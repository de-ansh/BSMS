from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import (
    auth,
    audit_log,
    billing,
    dashboard,
    members,
    notices,
    staff,
    units,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.validate_for_startup()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="BSMS API",
    description="Building & Society Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(members.router)
app.include_router(units.router)
app.include_router(staff.router)
app.include_router(billing.router)
app.include_router(notices.router)
app.include_router(audit_log.router)
