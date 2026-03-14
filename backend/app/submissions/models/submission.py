from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class ProblemSubmission(Base):
    __tablename__ = "problem_submissions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    problem_id = Column(Integer, ForeignKey("problems.id"))

    language = Column(String)

    status = Column(String)

    test_cases_passed = Column(Integer)

    execution_time = Column(Float)

    memory_used = Column(Float)

    submitted_at = Column(DateTime, server_default=func.now())