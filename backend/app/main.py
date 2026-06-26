from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    audit_log,
    billing,
    buildings,
    dashboard,
    members,
    notices,
    staff,
    super_admin,
    units,
    visitors,
    complaints,
    amenities,
    vehicles,
    parking,
    forum,
    polls,
)
# (rest of file...)
@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.validate_for_startup()
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
app.include_router(super_admin.router)
app.include_router(buildings.router)
app.include_router(dashboard.router)
app.include_router(members.router)
app.include_router(units.router)
app.include_router(staff.router)
app.include_router(billing.router)
app.include_router(notices.router)
app.include_router(audit_log.router)
app.include_router(visitors.router)
app.include_router(complaints.router)
app.include_router(amenities.router)
app.include_router(vehicles.router)
app.include_router(parking.router)
app.include_router(forum.router)
app.include_router(polls.router)
