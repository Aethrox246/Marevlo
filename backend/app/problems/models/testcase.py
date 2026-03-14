from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey
from app.core.database import Base

class TestCase(Base):
    __tablename__ = "testcases"

    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey("problems.id"))

    input = Column(Text)
    output = Column(Text)

    is_hidden = Column(Boolean, default=False)