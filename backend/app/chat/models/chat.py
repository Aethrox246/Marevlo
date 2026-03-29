from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Follow(Base):
    """User follow relationships"""
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='uq_follow_pair'),
        Index('idx_follower_id', 'follower_id'),
        Index('idx_following_id', 'following_id'),
    )


class Chat(Base):
    """Chat conversation between two users"""
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = Column(DateTime, nullable=True)
    
    # Relationships
    messages = relationship("Message", cascade="all, delete-orphan", back_populates="chat")
    
    __table_args__ = (
        UniqueConstraint('user_1_id', 'user_2_id', name='uq_chat_pair'),
        Index('idx_user_1_id', 'user_1_id'),
        Index('idx_user_2_id', 'user_2_id'),
    )


class Message(Base):
    """Individual message in a chat"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("user_sessions.id", ondelete="SET NULL"), nullable=True)
    log_id = Column(Integer, ForeignKey("activity_logs.id", ondelete="SET NULL"), nullable=True)
    
    content = Column(Text, nullable=False)
    is_edited = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    reads = relationship("MessageRead", cascade="all, delete-orphan", back_populates="message")
    sender = relationship("User", foreign_keys=[sender_id])
    
    __table_args__ = (
        Index('idx_chat_id', 'chat_id'),
        Index('idx_sender_id', 'sender_id'),
        Index('idx_session_id', 'session_id'),
        Index('idx_created_at', 'created_at'),
    )


class MessageRead(Base):
    """Track message read status"""
    __tablename__ = "message_reads"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    reader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    read_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("Message", back_populates="reads")
    
    __table_args__ = (
        UniqueConstraint('message_id', 'reader_id', name='uq_message_reader'),
        Index('idx_message_id', 'message_id'),
        Index('idx_reader_id', 'reader_id'),
    )
