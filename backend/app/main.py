from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle startup and shutdown events.
    """
    # Create tables on startup (in development, let Alembic handle migrations in production)
    if settings.ENVIRONMENT != "production":
        Base.metadata.create_all(bind=engine)
    
    yield
    
    # Clean up resources on shutdown if needed
    # Nothing to do for now

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for managing university thesis submissions and reviews",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include the API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """Welcome to the Thesis Tracker API."""
    return {
        "message": "Welcome to the Thesis Tracker API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """API health check endpoint."""
    return {"status": "healthy"} 