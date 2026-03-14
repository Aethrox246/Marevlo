from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    slug = Column(String, unique=True)

    description = Column(Text)
    difficulty = Column(String)