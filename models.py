from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    access_token = Column(String)
    refresh_token = Column(String)
    whatsapp_enabled = Column(Boolean, default=False)
    telegram_enabled = Column(Boolean, default=True)
    telegram_chat_id = Column(String, nullable=True)
    telegram_connected = Column(Boolean, default=False)
    telegram_token = Column(String, nullable=True)

    assignments = relationship("Assignment", back_populates="owner")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    google_course_work_id = Column(String, index=True)
    course = Column(String)
    title = Column(String)
    due_date = Column(Date)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_submitted = Column(Boolean, default=False)

    # Telegram reminder flags
    reminded_3d = Column(Boolean, default=False)
    reminded_1d = Column(Boolean, default=False)
    reminded_12h = Column(Boolean, default=False)

    owner = relationship("User", back_populates="assignments")