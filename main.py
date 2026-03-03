import os
import requests
from datetime import datetime, timedelta

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, extract
from sqlalchemy.exc import OperationalError, ProgrammingError
from fastapi.middleware.cors import CORSMiddleware
from models import Base, User, Assignment
from pydantic import BaseModel
from twilio.rest import Client
from apscheduler.schedulers.background import BackgroundScheduler

# -----------------------
# Setup
# -----------------------

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(background_sync, "interval", minutes=5)
    scheduler.add_job(send_telegram_reminders, "interval", minutes=5)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)

Base.metadata.create_all(bind=engine)


# ------ one-time cleanup of duplicate rows already in the DB ------
def _cleanup_duplicate_rows():
    """Remove duplicate Assignment rows, keeping the one with the latest due_date."""
    db = SessionLocal()
    try:
        all_assignments = db.query(Assignment).all()
        # Group by (user_id, normalised title, normalised course)
        from collections import defaultdict
        groups = defaultdict(list)
        for a in all_assignments:
            key = (a.user_id,
                   (a.title or "").strip().lower(),
                   (a.course or "").strip().lower())
            groups[key].append(a)
        deleted = 0
        for key, dupes in groups.items():
            if len(dupes) <= 1:
                continue
            # Keep the row with a google_course_work_id (prefer non-empty),
            # then the latest due_date, then the highest PK id.
            dupes.sort(key=lambda x: (
                bool(x.google_course_work_id),
                x.due_date,
                x.id,
            ), reverse=True)
            for dup in dupes[1:]:
                db.delete(dup)
                deleted += 1
        if deleted:
            db.commit()
            print(f"🧹 Cleaned up {deleted} duplicate assignment row(s).")
    except Exception as e:
        print(f"⚠️  Duplicate cleanup skipped: {e}")
        db.rollback()
    finally:
        db.close()

_cleanup_duplicate_rows()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY") or "dev-secret-change-in-production",
)

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile "
                 "https://www.googleapis.com/auth/classroom.courses.readonly "
                 "https://www.googleapis.com/auth/classroom.coursework.me.readonly "
                 "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly"
    },
)

# -----------------------
# Routes
# -----------------------

@app.get("/")
def home():
    return {"message": "Go to /login to authenticate"}

from sqlalchemy import text
@app.get("/fix-db")
def fix_db():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_3d BOOLEAN DEFAULT FALSE;"))
        db.execute(text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_1d BOOLEAN DEFAULT FALSE;"))
        db.execute(text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_12h BOOLEAN DEFAULT FALSE;"))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()



@app.get("/login")
async def login(request: Request):
    redirect_uri = "http://127.0.0.1:8000/auth/callback"
    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        access_type="offline",
        prompt="consent"
    )


@app.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        return RedirectResponse(
            "http://localhost:5173/?error=oauth_failed"
        )
    access_token = token["access_token"]
    refresh_token = token.get("refresh_token")
    user_info = token.get("userinfo")
    if not user_info or not user_info.get("email"):
        return RedirectResponse(
            "http://localhost:5173/?error=no_email"
        )

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    db = SessionLocal()

    # -----------------------
    # Create or Update User
    # -----------------------

    user = db.query(User).filter(User.email == user_info["email"]).first()

    if user:
        user.access_token = access_token
        if refresh_token:
            user.refresh_token = refresh_token
        db.commit()
    else:
        user = User(
            email=user_info["email"],
            access_token=access_token,
            refresh_token=refresh_token
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    user_email = user_info["email"]

    try:
        today = datetime.today().date()

        # -----------------------
        # Fetch Courses
        # -----------------------
        courses_response = requests.get(
            "https://classroom.googleapis.com/v1/courses",
            headers=headers
        )
        courses_data = courses_response.json()

        if "courses" in courses_data:
            for course in courses_data["courses"]:
                course_id = course["id"]
                course_name = course["name"]

                assignments_response = requests.get(
                    f"https://classroom.googleapis.com/v1/courses/{course_id}/courseWork",
                    headers=headers
                )
                assignments_data = assignments_response.json()

                if "courseWork" not in assignments_data:
                    continue

                for assignment in assignments_data["courseWork"]:
                    try:
                        due = assignment.get("dueDate")
                        if not due:
                            continue

                        due_date = datetime(
                            due["year"],
                            due["month"],
                            due["day"]
                        ).date()

                        # Skip assignments not from 2026
                        if due_date.year != 2026:
                            continue

                        # -----------------------
                        # Check submission status
                        # -----------------------
                        submission_response = requests.get(
                            f"https://classroom.googleapis.com/v1/courses/{course_id}/courseWork/{assignment['id']}/studentSubmissions",
                            headers=headers
                        )
                        submission_data = submission_response.json()

                        submissions = submission_data.get("studentSubmissions", [])
                        if submissions and submissions[0].get("state") == "TURNED_IN":
                            continue

                        # -----------------------
                        # Insert or Update DB
                        # -----------------------
                        cw_id = str(assignment.get("id", "")) if assignment.get("id") else ""
                        title = (assignment.get("title") or "").strip()
                        existing_assignment = None
                        if cw_id:
                            existing_assignment = (
                                db.query(Assignment)
                                .filter(
                                    Assignment.user_id == user.id,
                                    Assignment.google_course_work_id == cw_id,
                                )
                                .first()
                            )
                        if not existing_assignment:
                            existing_assignment = (
                                db.query(Assignment)
                                .filter(
                                    Assignment.user_id == user.id,
                                    Assignment.title == title,
                                    Assignment.course == course_name,
                                )
                                .first()
                            )

                        if existing_assignment:
                            existing_assignment.due_date = due_date
                            if cw_id:
                                existing_assignment.google_course_work_id = cw_id
                            db.commit()
                        else:
                            new_assignment = Assignment(
                                google_course_work_id=cw_id or None,
                                course=course_name,
                                title=title,
                                due_date=due_date,
                                user_id=user.id
                            )
                            db.add(new_assignment)
                            db.commit()

                    except Exception as assign_err:
                        print(f"⚠️ Skipped assignment due to error: {assign_err}")
                        db.rollback()
                        continue

    except Exception as e:
        print(f"⚠️ Error syncing classroom data: {e}")
    finally:
        db.close()

    return RedirectResponse(
        f"http://localhost:5173/dashboard?email={user_email}"
    )

@app.get("/dashboard")
def dashboard(email: str):
    db = SessionLocal()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {"error": "User not found"}

    assignments = db.query(Assignment).filter(
        Assignment.user_id == user.id
    ).all()

    result = [
        {
            "course": a.course,
            "title": a.title,
            "due_date": str(a.due_date)
        }
        for a in assignments
    ]

    db.close()

    return {
        "email": email,
        "assignments": result
    }


# -----------------------
# Helpers
# -----------------------

def _priority(due_date, title: str) -> str:
    today = datetime.today().date()
    if due_date < today:
        return "HIGH"
    days = (due_date - today).days
    t = (title or "").lower()
    if days <= 1 or any(k in t for k in ("exam", "test", "final", "project")):
        return "HIGH"
    if days <= 3:
        return "MEDIUM"
    return "LOW"


def _norm(s):
    return (s or "").strip().lower()


def _dedupe_assignments(assignments):
    best = {}          # canonical_key  -> Assignment
    alias = {}         # secondary_key  -> canonical_key
    for a in assignments:
        cw = getattr(a, "google_course_work_id", None) or None
        tc = f"{_norm(a.title)}|{_norm(a.course)}"

        # Determine the canonical key for this assignment.
        # If we've already seen either key, reuse the same canonical key
        # so that rows sharing a cw_id OR the same title|course collapse
        # into one entry.
        canon = None
        if cw and cw in alias:
            canon = alias[cw]
        if tc in alias:
            canon = alias[tc]
        if canon is None:
            canon = cw or tc

        # Register both secondary keys → canonical
        if cw:
            alias[cw] = canon
        alias[tc] = canon

        if canon not in best or a.due_date > best[canon].due_date:
            best[canon] = a
    return list(best.values())


# -----------------------
# Dashboard Stats
# -----------------------


@app.get("/stats")
def get_stats(email: str, year: int | None = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        query = db.query(Assignment).filter(Assignment.user_id == user.id)

        if year is not None:
            query = query.filter(extract("year", Assignment.due_date) == year)

        assignments = query.all()
        unique = _dedupe_assignments(assignments)
        today = datetime.today().date()

        total = len(unique)
        submitted_count = sum(1 for a in unique if getattr(a, "is_submitted", False))
        pending = total - submitted_count
        completion_rate = round((submitted_count / total * 100), 1) if total else 0
        late_count = sum(1 for a in unique if not getattr(a, "is_submitted", False) and a.due_date < today)
        pending_by_course = {}
        for a in unique:
            if getattr(a, "is_submitted", False):
                continue
            pending_by_course[a.course] = pending_by_course.get(a.course, 0) + 1
        most_pending_course = max(pending_by_course, key=pending_by_course.get) if pending_by_course else None

        return {
            "total": total,
            "submitted": submitted_count,
            "pending": pending,
            "completion_rate": completion_rate,
            "late_assignments": late_count,
            "most_pending_course": most_pending_course,
        }
    except HTTPException:
        raise
    except (OperationalError, ProgrammingError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database schema may need migration. Run migrations_add_dashboard_fields.sql. Error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/assignments")
def get_assignments(email: str, year: int = 2026):
    """Pending assignments only for list/calendar view."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        query = (
            db.query(Assignment)
            .filter(Assignment.user_id == user.id)
            .filter(extract("year", Assignment.due_date) == year)
            .filter(Assignment.is_submitted == False)
        )
        assignments = query.order_by(Assignment.due_date).all()
        unique = _dedupe_assignments(assignments)
        result = [
            {
                "title": a.title,
                "course": a.course,
                "due_date": str(a.due_date),
                "is_submitted": getattr(a, "is_submitted", False),
                "priority": _priority(a.due_date, a.title),
            }
            for a in unique
        ]
        return {"assignments": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/assignments/pending")
def get_pending_assignments(email: str, year: int = 2026):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        query = (
            db.query(Assignment)
            .filter(Assignment.user_id == user.id)
            .filter(extract("year", Assignment.due_date) == year)
            .filter(Assignment.is_submitted == False)
        )
        assignments = query.order_by(Assignment.due_date).all()
        unique = _dedupe_assignments(assignments)
        result = [
            {
                "title": a.title,
                "course": a.course,
                "due_date": str(a.due_date),
                "priority": _priority(a.due_date, a.title),
            }
            for a in unique
        ]
        return {"assignments": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/assignments/all")
def get_all_assignments(email: str, year: int = 2026):
    """All assignments (pending + submitted) for the given year."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        assignments = (
            db.query(Assignment)
            .filter(Assignment.user_id == user.id)
            .filter(extract("year", Assignment.due_date) == year)
            .order_by(Assignment.due_date)
            .all()
        )
        unique = _dedupe_assignments(assignments)
        result = [
            {
                "title": a.title,
                "course": a.course,
                "due_date": str(a.due_date),
                "is_submitted": getattr(a, "is_submitted", False),
                "priority": _priority(a.due_date, a.title),
            }
            for a in unique
        ]
        return {"assignments": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/assignments/submitted")
def get_submitted_assignments(email: str, year: int = 2026):
    """Only submitted assignments for the given year."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        assignments = (
            db.query(Assignment)
            .filter(Assignment.user_id == user.id)
            .filter(extract("year", Assignment.due_date) == year)
            .filter(Assignment.is_submitted == True)
            .order_by(Assignment.due_date)
            .all()
        )
        unique = _dedupe_assignments(assignments)
        result = [
            {
                "title": a.title,
                "course": a.course,
                "due_date": str(a.due_date),
            }
            for a in unique
        ]
        return {"assignments": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()



class ToggleWhatsAppBody(BaseModel):
    email: str


@app.post("/toggle-whatsapp")
def toggle_whatsapp(body: ToggleWhatsAppBody):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.whatsapp_enabled = not getattr(user, "whatsapp_enabled", False)
        db.commit()
        db.refresh(user)
        enabled = getattr(user, "whatsapp_enabled", False)
        return {"enabled": enabled}
    finally:
        db.close()


@app.get("/user-whatsapp")
def get_whatsapp_status(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        enabled = getattr(user, "whatsapp_enabled", False)
        return {"enabled": enabled}
    finally:
        db.close()


class ToggleTelegramBody(BaseModel):
    email: str

@app.post("/toggle-telegram")
def toggle_telegram(body: ToggleTelegramBody):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.telegram_enabled = not getattr(user, "telegram_enabled", True)
        db.commit()
        db.refresh(user)
        enabled = getattr(user, "telegram_enabled", True)
        return {"enabled": enabled}
    finally:
        db.close()

@app.get("/user-telegram")
def get_telegram_status(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        enabled = getattr(user, "telegram_enabled", True)
        connected = getattr(user, "telegram_connected", False)
        return {"enabled": enabled, "connected": connected}
    finally:
        db.close()



import uuid

@app.get("/generate-telegram-token")
def generate_telegram_token(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        token = str(uuid.uuid4())[:8]  # Short token for easy entry
        user.telegram_token = token
        db.commit()
        return {"token": token}
    finally:
        db.close()

@app.post("/telegram-webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    if "message" not in data:
        return {"status": "ok"}
        
    message = data["message"]
    text = message.get("text", "").strip()
    chat_id = str(message.get("chat", {}).get("id"))
    
    if text.startswith("/start"):
        parts = text.split(" ")
        if len(parts) > 1:
            token = parts[1].strip()
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.telegram_token == token).first()
                if user:
                    user.telegram_chat_id = chat_id
                    user.telegram_connected = True
                    user.telegram_token = None
                    db.commit()
                    send_telegram_message("✅ Connected successfully! You will now receive reminders.", chat_id=chat_id)
            finally:
                db.close()
    return {"status": "ok"}

def send_telegram_message(message: str, chat_id: str = None):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not chat_id:
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not bot_token or not chat_id:
        print("⚠️ Telegram credentials missing")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"⚠️ Failed to send Telegram message: {e}")


@app.get("/send-reminders")
def send_reminders():
    db = SessionLocal()

    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

    tomorrow = datetime.today().date() + timedelta(days=1)

    assignments = db.query(Assignment).filter(
        Assignment.due_date == tomorrow
    ).all()

    if not assignments:
        db.close()
        return {"message": "No assignments due tomorrow"}

    for a in assignments:
        message_body = (
            f"📚 Reminder!\n\n"
            f"Assignment: {a.title}\n"
            f"Course: {a.course}\n"
            f"Due Date: {a.due_date}"
        )

        client.messages.create(
            body=message_body,
            from_=os.getenv("TWILIO_WHATSAPP_NUMBER"),
            to=os.getenv("YOUR_PHONE")
        )

    db.close()

    return {"message": "Reminders sent successfully"}
def background_sync():
    print("🔄 Running background sync...")

    db = SessionLocal()
    users = db.query(User).all()
    print(f"   → Found {len(users)} user(s) in DB")

    for user in users:
        print(f"   → Processing user: {user.email}")
        if not user.refresh_token:
            print(f"   ⚠️  Skipping {user.email} — no refresh token")
            continue

        try:
            # ── Refresh access token ───────────────────────────────────
            token_response = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "refresh_token": user.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            new_token = token_response.json()
            access_token = new_token.get("access_token")
            if not access_token:
                print(f"   ❌ Token refresh failed for {user.email}: {new_token}")
                continue
            print(f"   ✅ Token refreshed for {user.email}")

            user.access_token = access_token
            db.commit()

            headers = {"Authorization": f"Bearer {access_token}"}

            # ── Fetch courses ──────────────────────────────────────────
            courses_response = requests.get(
                "https://classroom.googleapis.com/v1/courses",
                headers=headers,
            )
            courses_data = courses_response.json()

            if "courses" not in courses_data:
                print(f"   ❌ No courses for {user.email} — API response: {courses_data}")
                continue

            changes = 0

            for course in courses_data["courses"]:
                course_id = course["id"]
                course_name = course["name"]

                assignments_response = requests.get(
                    f"https://classroom.googleapis.com/v1/courses/{course_id}/courseWork",
                    headers=headers,
                )
                assignments_data = assignments_response.json()

                if "courseWork" not in assignments_data:
                    continue

                for assignment in assignments_data["courseWork"]:
                    due = assignment.get("dueDate")
                    if not due:
                        continue

                    due_date = datetime(
                        due["year"], due["month"], due["day"]
                    ).date()

                    # Skip assignments not from 2026
                    if due_date.year != 2026:
                        continue

                    cw_id = str(assignment["id"]) if assignment.get("id") else ""
                    title = (assignment.get("title") or "").strip()

                    # ── Look up existing record ────────────────────────
                    existing = None
                    if cw_id:
                        existing = (
                            db.query(Assignment)
                            .filter(
                                Assignment.user_id == user.id,
                                Assignment.google_course_work_id == cw_id,
                            )
                            .first()
                        )
                    if not existing:
                        existing = (
                            db.query(Assignment)
                            .filter(
                                Assignment.user_id == user.id,
                                Assignment.title == title,
                                Assignment.course == course_name,
                            )
                            .first()
                        )

                    if existing:
                        # ── Diff: only update on real changes ─────────
                        due_changed = existing.due_date != due_date
                        already_submitted = getattr(existing, "is_submitted", False)

                        # Only hit the submissions API for still-pending assignments
                        newly_submitted = False
                        if not already_submitted:
                            try:
                                sub_resp = requests.get(
                                    f"https://classroom.googleapis.com/v1/courses/{course_id}"
                                    f"/courseWork/{assignment['id']}/studentSubmissions",
                                    headers=headers,
                                )
                                subs = sub_resp.json().get("studentSubmissions", [])
                                if subs and subs[0].get("state") in ("TURNED_IN", "RETURNED"):
                                    newly_submitted = True
                            except Exception as sub_err:
                                print(f"     ⚠️  Submission fetch error for '{title}': {sub_err}")

                        if due_changed or newly_submitted:
                            if due_changed:
                                print(f"     📅 Due date changed: '{title}' → {due_date} (was {existing.due_date})")
                                existing.due_date = due_date
                            if newly_submitted:
                                print(f"     ✅ Submitted: '{title}' in {course_name}")
                                existing.is_submitted = True
                            if cw_id:
                                existing.google_course_work_id = cw_id
                            db.commit()
                            changes += 1

                    else:
                        # ── Brand new assignment ───────────────────────
                        is_submitted = False
                        try:
                            sub_resp = requests.get(
                                f"https://classroom.googleapis.com/v1/courses/{course_id}"
                                f"/courseWork/{assignment['id']}/studentSubmissions",
                                headers=headers,
                            )
                            subs = sub_resp.json().get("studentSubmissions", [])
                            if subs and subs[0].get("state") in ("TURNED_IN", "RETURNED"):
                                is_submitted = True
                        except Exception as sub_err:
                            print(f"     ⚠️  Submission fetch error for '{title}': {sub_err}")

                        new_assignment = Assignment(
                            google_course_work_id=cw_id or None,
                            course=course_name,
                            title=title,
                            due_date=due_date,
                            is_submitted=is_submitted,
                            user_id=user.id,
                        )
                        db.add(new_assignment)
                        db.commit()
                        print(f"     ➕ New assignment: '{title}' in {course_name} (due {due_date})")
                        changes += 1

                        if not is_submitted:
                            if getattr(user, "whatsapp_enabled", False):
                                try:
                                    twilio_client = Client(
                                        os.getenv("TWILIO_ACCOUNT_SID"),
                                        os.getenv("TWILIO_AUTH_TOKEN"),
                                    )
                                    twilio_client.messages.create(
                                        body=(
                                            f"📚 New Assignment!\n\n"
                                            f"{title}\n"
                                            f"Course: {course_name}\n"
                                            f"Due: {due_date}"
                                        ),
                                        from_=os.getenv("TWILIO_WHATSAPP_NUMBER"),
                                        to=os.getenv("YOUR_PHONE"),
                                    )
                                    print(f"     📲 WhatsApp sent for '{title}'")
                                except Exception as twilio_err:
                                    print(f"     ⚠️  WhatsApp failed: {twilio_err}")

                            if getattr(user, "telegram_enabled", True):
                                tg_msg = (
                                    f"📚 <b>New Assignment!</b>\n"
                                    f"<b>Title:</b> {title}\n"
                                    f"<b>Course:</b> {course_name}\n"
                                    f"<b>Due:</b> {due_date}"
                                )
                                chat_id = getattr(user, "telegram_chat_id", None)
                                if chat_id or os.getenv("TELEGRAM_CHAT_ID"):
                                    send_telegram_message(tg_msg, chat_id=chat_id)

            if changes == 0:
                print(f"   ✓ No changes detected for {user.email}")
            else:
                print(f"   ✓ {changes} change(s) applied for {user.email}")

        except Exception as e:
            print(f"   ❌ Sync error for {user.email}: {e}")
            db.rollback()

    print("🔄 Background sync complete.")
    db.close()


def send_telegram_reminders():
    print("🔔 Running Telegram reminders check...")
    db = SessionLocal()
    
    try:
        now = datetime.today()
        today = now.date()
        
        users_with_tg = db.query(User).filter(
            User.telegram_enabled == True,
            (User.telegram_connected == True) | (User.telegram_chat_id != None)
        ).all()
        user_ids = [u.id for u in users_with_tg]
        
        if not user_ids:
            return
            
        pending_assignments = db.query(Assignment).filter(
            Assignment.is_submitted == False,
            Assignment.user_id.in_(user_ids)
        ).all()
        
        # Build lookup for users to confirm tg enabled status per assignment (just in case)
        user_lookup = {u.id: u for u in users_with_tg}
        
        for a in pending_assignments:
            if not a.due_date:
                continue
                
            due_date = a.due_date
            
            # Ensure reminders only fire for 2026 assignments
            if due_date.year != 2026:
                continue
            
            # Since due_date is just a Date, we approximate the time elapsed by days.
            # We assume deadline is end of day (23:59)
            deadline = datetime(due_date.year, due_date.month, due_date.day, 23, 59)
            time_left = deadline - now
            days_left = time_left.days
            hours_left = time_left.total_seconds() / 3600.0
            
            # if the deadline already passed, skip reminders
            if hours_left < 0:
                continue
                
            reminder_sent = False
            msg = None
            
            # Triggers: 3 days, 1 day, 12 hours
            # 12 hours check (0-12)
            if hours_left <= 12 and not a.reminded_12h:
                msg = f"⏳ <b>URGENT REMINDER (Next 12 hours)</b>:\n<b>{a.title}</b> is due very soon in {a.course}!"
                a.reminded_12h = True
                a.reminded_1d = True # roll up previous flags
                a.reminded_3d = True
                reminder_sent = True
            # 1 day check (12-24)
            elif days_left == 0 and hours_left <= 24 and not a.reminded_1d:
                msg = f"⏳ <b>Tomorrow!</b>\n<b>{a.title}</b> is due tomorrow in {a.course}!"
                a.reminded_1d = True
                a.reminded_3d = True
                reminder_sent = True
            # 3 days check (24-72)
            elif days_left <= 3 and not a.reminded_3d:
                msg = f"📅 <b>Upcoming (3 Days)</b>:\n<b>{a.title}</b> is coming up in {a.course}!"
                a.reminded_3d = True
                reminder_sent = True
                
            if reminder_sent and msg:
                chat_id = getattr(user_lookup[a.user_id], "telegram_chat_id", None)
                if chat_id or os.getenv("TELEGRAM_CHAT_ID"):
                    send_telegram_message(msg, chat_id=chat_id)
                
        db.commit()
    except Exception as e:
        print(f"⚠️ Error sending telegram reminders: {e}")
        db.rollback()
    finally:
        db.close()


