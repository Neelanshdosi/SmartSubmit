import os
from database import engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

chat_id = os.getenv("TELEGRAM_CHAT_ID")

if chat_id:
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(
                text("UPDATE users SET telegram_connected = TRUE, telegram_chat_id = :chat_id WHERE email = 'neelanshdosi@gmail.com'"),
                {"chat_id": chat_id}
            )
    print("Fixed telegram connection status for neelanshdosi@gmail.com using .env value.")
else:
    print("No TELEGRAM_CHAT_ID found in .env")
