import os
from sqlalchemy import create_engine, text

def migrate():
    from dotenv import load_dotenv
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is not set.")
        return
        
    engine = create_engine(db_url)
    
    statements = [
        "ALTER TABLE users ADD COLUMN telegram_enabled BOOLEAN DEFAULT 1;",
        "ALTER TABLE assignments ADD COLUMN reminded_3d BOOLEAN DEFAULT 0;",
        "ALTER TABLE assignments ADD COLUMN reminded_1d BOOLEAN DEFAULT 0;",
        "ALTER TABLE assignments ADD COLUMN reminded_12h BOOLEAN DEFAULT 0;",
    ]

    with engine.connect() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                print(f"Successfully ran: {stmt}")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print(f"Skipped (column already exists): {stmt}")
                else:
                    print(f"Error running {stmt}: {e}")
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
