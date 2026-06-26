from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.poll import Poll, PollOption, Vote
from app.dependencies import get_current_user, require_admin
from app.schemas.poll import (
    PollCreate,
    PollResponse,
    PollOptionResponse,
    VoteCreate,
)
from app.services.audit import log_audit
from app.routers.forum import get_user_building_id

router = APIRouter(prefix="/polls", tags=["polls"])

@router.get("/", response_model=list[PollResponse])
def list_polls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    building_id = get_user_building_id(db, current_user)
    if not building_id:
        return []

    # Get all polls in the building
    polls_query = db.query(Poll, User.name).join(
        User, Poll.creator_id == User.id
    ).filter(
        Poll.building_id == building_id
    ).order_by(
        Poll.created_at.desc()
    ).all()

    response = []
    now = datetime.now()

    for poll, creator_name in polls_query:
        # Check if expired and update status dynamically
        is_active = poll.is_active
        if is_active and poll.expires_at and poll.expires_at < now:
            poll.is_active = False
            db.commit()
            is_active = False

        # Get options
        options = db.query(PollOption).filter(PollOption.poll_id == poll.id).all()
        
        # Get votes count for each option
        opt_responses = []
        for opt in options:
            vote_count = db.query(Vote).filter(Vote.option_id == opt.id).count()
            opt_responses.append(
                PollOptionResponse(
                    id=opt.id,
                    poll_id=opt.poll_id,
                    option_text=opt.option_text,
                    vote_count=vote_count
                )
            )

        # Check if current user has voted
        user_vote = db.query(Vote).filter(
            Vote.poll_id == poll.id,
            Vote.user_id == current_user.id
        ).first()

        response.append(
            PollResponse(
                id=poll.id,
                building_id=poll.building_id,
                creator_id=poll.creator_id,
                creator_name=creator_name,
                question=poll.question,
                is_active=is_active,
                expires_at=poll.expires_at,
                created_at=poll.created_at,
                updated_at=poll.updated_at,
                options=opt_responses,
                voted_option_id=user_vote.option_id if user_vote else None
            )
        )

    return response

@router.post("/", response_model=PollResponse, status_code=201)
def create_poll(
    body: PollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    building_id = get_user_building_id(db, current_user)
    if not building_id:
        raise HTTPException(status_code=403, detail="Not authorized to create polls")

    if not body.options or len(body.options) < 2:
        raise HTTPException(status_code=400, detail="A poll must have at least 2 options")

    poll = Poll(
        building_id=building_id,
        creator_id=current_user.id,
        question=body.question,
        expires_at=body.expires_at,
        is_active=True
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)

    options_list = []
    for opt_text in body.options:
        opt_text_stripped = opt_text.strip()
        if not opt_text_stripped:
            continue
        opt = PollOption(
            poll_id=poll.id,
            option_text=opt_text_stripped
        )
        db.add(opt)
        options_list.append(opt)
    
    db.commit()

    # Log audit
    log_audit(
        db=db,
        action="create_poll",
        entity_type="poll",
        user_id=current_user.id,
        entity_id=poll.id,
        details=f"Created community poll: {poll.question}"
    )

    opt_responses = [
        PollOptionResponse(
            id=opt.id,
            poll_id=opt.poll_id,
            option_text=opt.option_text,
            vote_count=0
        )
        for opt in options_list
    ]

    return PollResponse(
        id=poll.id,
        building_id=poll.building_id,
        creator_id=poll.creator_id,
        creator_name=current_user.name,
        question=poll.question,
        is_active=poll.is_active,
        expires_at=poll.expires_at,
        created_at=poll.created_at,
        updated_at=poll.updated_at,
        options=opt_responses,
        voted_option_id=None
    )

@router.post("/{poll_id}/vote", response_model=PollResponse)
def cast_vote(
    poll_id: str,
    body: VoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    building_id = get_user_building_id(db, current_user)
    if poll.building_id != building_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to vote on this poll")

    # Check if active
    now = datetime.now()
    if not poll.is_active or (poll.expires_at and poll.expires_at < now):
        poll.is_active = False
        db.commit()
        raise HTTPException(status_code=400, detail="This poll is closed or expired")

    # Validate option_id belongs to the poll
    option = db.query(PollOption).filter(
        PollOption.id == body.option_id,
        PollOption.poll_id == poll_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Selected option not found for this poll")

    # Check if already voted
    existing_vote = db.query(Vote).filter(
        Vote.poll_id == poll_id,
        Vote.user_id == current_user.id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted in this poll")

    vote = Vote(
        poll_id=poll_id,
        option_id=body.option_id,
        user_id=current_user.id
    )
    db.add(vote)
    db.commit()

    log_audit(
        db=db,
        action="cast_vote",
        entity_type="poll",
        user_id=current_user.id,
        entity_id=poll_id,
        details=f"Voted in poll: {poll.question}"
    )

    # Get updated options for response
    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).all()
    opt_responses = []
    for opt in options:
        vote_count = db.query(Vote).filter(Vote.option_id == opt.id).count()
        opt_responses.append(
            PollOptionResponse(
                id=opt.id,
                poll_id=opt.poll_id,
                option_text=opt.option_text,
                vote_count=vote_count
            )
        )

    creator_name = db.query(User.name).filter(User.id == poll.creator_id).scalar()

    return PollResponse(
        id=poll.id,
        building_id=poll.building_id,
        creator_id=poll.creator_id,
        creator_name=creator_name,
        question=poll.question,
        is_active=poll.is_active,
        expires_at=poll.expires_at,
        created_at=poll.created_at,
        updated_at=poll.updated_at,
        options=opt_responses,
        voted_option_id=body.option_id
    )

@router.patch("/{poll_id}/close", response_model=PollResponse)
def close_poll(
    poll_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    building_id = get_user_building_id(db, current_user)
    if poll.building_id != building_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this poll")

    poll.is_active = False
    db.commit()

    log_audit(
        db=db,
        action="close_poll",
        entity_type="poll",
        user_id=current_user.id,
        entity_id=poll.id,
        details=f"Closed poll: {poll.question}"
    )

    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).all()
    opt_responses = []
    for opt in options:
        vote_count = db.query(Vote).filter(Vote.option_id == opt.id).count()
        opt_responses.append(
            PollOptionResponse(
                id=opt.id,
                poll_id=opt.poll_id,
                option_text=opt.option_text,
                vote_count=vote_count
            )
        )

    creator_name = db.query(User.name).filter(User.id == poll.creator_id).scalar()

    # Check if current user has voted
    user_vote = db.query(Vote).filter(
        Vote.poll_id == poll_id,
        Vote.user_id == current_user.id
    ).first()

    return PollResponse(
        id=poll.id,
        building_id=poll.building_id,
        creator_id=poll.creator_id,
        creator_name=creator_name,
        question=poll.question,
        is_active=poll.is_active,
        expires_at=poll.expires_at,
        created_at=poll.created_at,
        updated_at=poll.updated_at,
        options=opt_responses,
        voted_option_id=user_vote.option_id if user_vote else None
    )
