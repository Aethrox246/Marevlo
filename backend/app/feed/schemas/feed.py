from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone


def format_time(dt: datetime) -> str:
    """Convert datetime to relative time string like 'Just now', '2h ago'"""
    if not dt:
        return "Unknown"
    # Use timezone-aware datetime
    now = datetime.now(timezone.utc)
    # Make dt timezone-aware if it isn't
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        return f"{int(seconds // 60)}m ago"
    elif seconds < 86400:
        return f"{int(seconds // 3600)}h ago"
    elif seconds < 604800:
        return f"{int(seconds // 86400)}d ago"
    else:
        return dt.strftime("%b %d, %Y")


class CommentResponse(BaseModel):
    """Comment structure - ALIGNED WITH FRONTEND"""
    id: int
    author: str  # username
    content: str
    time: str    # formatted time
    
    class Config:
        from_attributes = True


class FeedPostResponse(BaseModel):
    """Post response - FIELD NAMES MATCH FRONTEND"""
    id: int
    author: str                          # username
    avatar: str                          # single letter
    role: str                            # "Developer", "ML Engineer", etc
    content: str
    image: Optional[str] = None          # Mapped from image_url
    
    # Counters - RENAMED for frontend compatibility
    likes: int                           # from like_count
    comments: int                        # from comment_count
    reposts: int                         # from repost_count
    
    time: str                            # formatted timestamp
    likedByMe: bool                      # did current user like this
    
    # Article/Event specific
    isArticle: bool = False
    isEvent: bool = False
    title: Optional[str] = None
    
    # Event details (only if isEvent=True)
    eventDetails: Optional[dict] = None
    
    # Comments list
    commentsList: List[CommentResponse] = []
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_with_context(cls, post, current_user_id=None):
        """Create from ORM with frontend field mapping"""
        is_article = post.type == "article"
        is_event = post.type == "event"
        
        # Check if current user liked this post
        liked_by_me = False
        if current_user_id:
            liked_by_me = any(like.user_id == current_user_id for like in post.likes)
        
        # Build event details if event
        event_details = None
        if is_event:
            event_details = {
                "title": post.title,
                "date": post.event_date.isoformat() if post.event_date else None,
                "location": post.event_location
            }
        
        # Format comments
        comments_list = [
            CommentResponse(
                id=c.id,
                author=c.author.username,
                content=c.content,
                time=format_time(c.created_at)
            )
            for c in post.comments
        ]
        
        # Get user role from profile
        user_role = "Developer"
        if hasattr(post.author, 'profile') and post.author.profile:
            user_role = getattr(post.author.profile, 'role', 'Developer')
        
        return cls(
            id=post.id,
            author=post.author.username,
            avatar=post.author.username[0].upper(),
            role=user_role,
            content=post.content,
            image=post.image_url,
            likes=post.like_count,
            comments=post.comment_count,
            reposts=post.repost_count,
            time=format_time(post.created_at),
            likedByMe=liked_by_me,
            isArticle=is_article,
            isEvent=is_event,
            title=post.title,
            eventDetails=event_details,
            commentsList=comments_list
        )


class FeedPostCreate(BaseModel):
    """Schema for creating a new post - FRONTEND FORMAT"""
    content: str
    type: str = "post"
    title: Optional[str] = None
    image: Optional[str] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    
    class Config:
        example = {
            "content": "Just solved problem #47!",
            "type": "post"
        }


class FeedListResponse(BaseModel):
    """Feed list with pagination"""
    posts: List[FeedPostResponse]
    pagination: dict
    
    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    """Create comment on post"""
    content: str
    
    class Config:
        example = {"content": "Great post!"}
