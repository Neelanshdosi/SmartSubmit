import os
from sqlalchemy import text
from database import engine

migration_sql = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_token VARCHAR;
"""

def run():
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text(migration_sql))
    print("Migration successful")

if __name__ == "__main__":
    run()
