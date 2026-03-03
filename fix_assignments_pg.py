import sys
from sqlalchemy import text
from database import engine

migration_sql_stmts = [
    "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_3d BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_1d BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_12h BOOLEAN DEFAULT FALSE;"
]

def run():
    try:
        with engine.connect() as conn:
            for stmt in migration_sql_stmts:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                    print(f"Success: {stmt}")
                except Exception as e:
                    print(f"Error executing {stmt}: {e}")
                    conn.rollback()
        print("Migrations finished.")
    except Exception as e:
        print(f"Failed to connect to db: {e}")

if __name__ == "__main__":
    run()
