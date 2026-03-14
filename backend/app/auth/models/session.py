from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.core.database import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    logout_time = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(100), nullable=True)
    device = Column(String(100), nullable=True)
