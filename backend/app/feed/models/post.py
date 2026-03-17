from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class FeedPost(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="SET NULL"), nullable=True)
    
    # Post content
    type = Column(String(20), default="post")  # post, article, event, repost
    content = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # Counters
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    repost_count = Column(Integer, default=0)
    
    # Optional enrichment
    tags = Column(JSON, default=[])
    code_snippet = Column(JSON, nullable=True)
    
    # Event-specific
    event_date = Column(DateTime, nullable=True)
    event_location = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", foreign_keys=[user_id])
    likes = relationship("PostLike", cascade="all, delete-orphan")
    comments = relationship("Comment", cascade="all, delete-orphan", back_populates="post")
    
    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_created_at', 'created_at'),
        Index('idx_type', 'type'),
        Index('idx_problem_id', 'problem_id'),
    )


class PostLike(Base):
    __tablename__ = "post_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),
        Index('idx_post_id', 'post_id'),
        Index('idx_user_id', 'user_id'),
    )


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("FeedPost", back_populates="comments")
    author = relationship("User", foreign_keys=[user_id])
    
    __table_args__ = (
        Index('idx_post_id', 'post_id'),
        Index('idx_user_id', 'user_id'),
    )
