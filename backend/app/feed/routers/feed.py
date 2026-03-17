from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.feed.schemas.feed import FeedPostResponse, FeedPostCreate, FeedListResponse, CommentCreate
from app.auth.models.user import User
from app.feed.models.post import FeedPost, PostLike, Comment
from datetime import datetime

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/posts", response_model=FeedListResponse)
def list_feed(
    sort: str = Query("latest", pattern="^(latest|top)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get feed posts with pagination.
    
    Response field mapping:
    - like_count → likes
    - comment_count → comments
    - repost_count → reposts
    - image_url → image
    - created_at → time (formatted)
    - type='article' → isArticle=True
    - type='event' → isEvent=True
    """
    query = db.query(FeedPost).order_by(FeedPost.created_at.desc())
    
    if sort == "top":
        query = query.order_by(FeedPost.like_count.desc())
    
    total = query.count()
    posts = query.offset((page - 1) * limit).limit(limit).all()
    
    # Convert to frontend format
    posts_response = [
        FeedPostResponse.from_orm_with_context(p, current_user.id)
        for p in posts
    ]
    
    return FeedListResponse(
        posts=posts_response,
        pagination={
            "page": page,
            "limit": limit,
            "total_count": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.post("/posts", response_model=FeedPostResponse)
def create_post(
    post_data: FeedPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new post with frontend field format.
    
    Input fields match frontend (content, image, type, etc.)
    Output fields mapped to frontend format (likes, comments, reposts, image, time)
    """
    new_post = FeedPost(
        user_id=current_user.id,
        type=post_data.type,
        content=post_data.content,
        title=post_data.title,
        image_url=post_data.image,
        event_date=post_data.event_date,
        event_location=post_data.event_location
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Return in frontend format
    return FeedPostResponse.from_orm_with_context(new_post, current_user.id)


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle like on a post.
    Returns updated like count and likedByMe status.
    """
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        post.like_count = max(0, post.like_count - 1)
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.like_count += 1
    
    db.commit()
    db.refresh(post)
    
    return {
        "id": post.id,
        "likes": post.like_count,
        "likedByMe": not bool(existing_like)
    }


@router.post("/posts/{post_id}/comments", response_model=dict)
def add_comment(
    post_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a comment to a post.
    """
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    db.add(new_comment)
    post.comment_count += 1
    db.commit()
    db.refresh(new_comment)
    
    return {
        "id": new_comment.id,
        "author": current_user.username,
        "content": new_comment.content,
        "time": "Just now"
    }


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a post (only by the author).
    """
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}


@router.get("/posts/{post_id}", response_model=FeedPostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single post by ID.
    """
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return FeedPostResponse.from_orm_with_context(post, current_user.id)
