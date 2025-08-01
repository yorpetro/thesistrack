from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, theses, comments, committee, events, attachments, requests, reviews, deadlines

# Create main API router
api_router = APIRouter()

# Add all endpoint groups
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(theses.router, prefix="/theses", tags=["theses"])
api_router.include_router(comments.router, prefix="/theses", tags=["comments"])
api_router.include_router(committee.router, prefix="/theses", tags=["committee"])
api_router.include_router(attachments.router, prefix="/theses", tags=["attachments"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(requests.router, prefix="/assistant", tags=["requests"])
api_router.include_router(reviews.router, prefix="/theses", tags=["reviews"])
api_router.include_router(deadlines.router, prefix="/deadlines", tags=["deadlines"]) 