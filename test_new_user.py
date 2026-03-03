import sys
from fastapi.testclient import TestClient
from main import app, SessionLocal
from models import User

client = TestClient(app)

def run_test():
    email = "testnewuser123@example.com"
    # Create the user directly
    db = SessionLocal()
    if not db.query(User).filter(User.email == email).first():
        user = User(email=email, access_token="abc", refresh_token="def")
        db.add(user)
        db.commit()
    db.close()

    try:
        response = client.get(f"/stats?email={email}")
        print("Status code:", response.status_code)
        print("Response:", response.json())
        
        response2 = client.get(f"/assignments?email={email}&year=2026")
        print("Assignments code:", response2.status_code)
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
