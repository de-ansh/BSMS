from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.member import Member
from app.models.unit import Unit
from app.models.forum import Post, ForumComment
from app.dependencies import get_current_user, get_resident_member
from app.schemas.forum import (
    PostCreate,
    PostResponse,
    PostDetailResponse,
    ForumCommentCreate,
    ForumCommentResponse,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/forum", tags=["forum"])

def get_user_building_id(db: Session, user: User) -> str | None:
    if user.role in ("admin", "super_admin"):
        return user.building_id
    elif user.role == "resident":
        member = get_resident_member(db, user)
        if member and member.unit_id:
            unit = db.query(Unit).filter(Unit.id == member.unit_id).first()
            if unit:
                return unit.building_id
    return None

@router.get("/", response_model=list[PostResponse])
def list_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    building_id = get_user_building_id(db, current_user)
    if not building_id:
        return []

    # Query posts, join User to get author_name, outer join comments to get comment count
    results = db.query(
        Post,
        User.name,
        func.count(ForumComment.id).label("comment_count")
    ).join(
        User, Post.author_id == User.id
    ).outerjoin(
        ForumComment, Post.id == ForumComment.post_id
    ).filter(
        Post.building_id == building_id
    ).group_by(
        Post.id, User.name
    ).order_by(
        Post.created_at.desc()
    ).all()

    return [
        PostResponse(
            id=post.id,
            building_id=post.building_id,
            author_id=post.author_id,
            author_name=author_name,
            title=post.title,
            content=post.content,
            comment_count=comment_count,
            created_at=post.created_at,
            updated_at=post.updated_at
        )
        for post, author_name, comment_count in results
    ]

@router.get("/{post_id}", response_model=PostDetailResponse)
def get_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    building_id = get_user_building_id(db, current_user)
    if not building_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    post_data = db.query(Post, User.name).join(User, Post.author_id == User.id).filter(Post.id == post_id).first()
    if not post_data:
        raise HTTPException(status_code=404, detail="Post not found")

    post, author_name = post_data
    if post.building_id != building_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this post")

    comments_data = db.query(ForumComment, User.name).join(
        User, ForumComment.author_id == User.id
    ).filter(
        ForumComment.post_id == post_id
    ).order_by(
        ForumComment.created_at.asc()
    ).all()

    comments_list = [
        ForumCommentResponse(
            id=c.id,
            post_id=c.post_id,
            author_id=c.author_id,
            author_name=c_author_name,
            content=c.content,
            created_at=c.created_at
        )
        for c, c_author_name in comments_data
    ]

    return PostDetailResponse(
        id=post.id,
        building_id=post.building_id,
        author_id=post.author_id,
        author_name=author_name,
        title=post.title,
        content=post.content,
        comments=comments_list,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.post("/", response_model=PostResponse, status_code=201)
def create_post(
    body: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    building_id = get_user_building_id(db, current_user)
    if not building_id:
        raise HTTPException(status_code=403, detail="Not authorized to create posts")

    post = Post(
        building_id=building_id,
        author_id=current_user.id,
        title=body.title,
        content=body.content
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    log_audit(
        db=db,
        action="create_post",
        entity_type="post",
        user_id=current_user.id,
        entity_id=post.id,
        details=f"Created forum post: {post.title}"
    )

    return PostResponse(
        id=post.id,
        building_id=post.building_id,
        author_id=post.author_id,
        author_name=current_user.name,
        title=post.title,
        content=post.content,
        comment_count=0,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    is_author = post.author_id == current_user.id
    is_building_admin = current_user.role == "admin" and post.building_id == current_user.building_id
    is_super_admin = current_user.role == "super_admin"

    if not (is_author or is_building_admin or is_super_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.query(ForumComment).filter(ForumComment.post_id == post_id).delete()
    db.delete(post)
    db.commit()

    log_audit(
        db=db,
        action="delete_post",
        entity_type="post",
        user_id=current_user.id,
        entity_id=post_id,
        details=f"Deleted forum post: {post.title}"
    )

@router.post("/{post_id}/comments", response_model=ForumCommentResponse, status_code=201)
def create_comment(
    post_id: str,
    body: ForumCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    building_id = get_user_building_id(db, current_user)
    if post.building_id != building_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to comment on this post")

    comment = ForumComment(
        post_id=post_id,
        author_id=current_user.id,
        content=body.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_audit(
        db=db,
        action="create_comment",
        entity_type="comment",
        user_id=current_user.id,
        entity_id=comment.id,
        details=f"Added comment on post {post_id}"
    )

    return ForumCommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        author_id=comment.author_id,
        author_name=current_user.name,
        content=comment.content,
        created_at=comment.created_at
    )
