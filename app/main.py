from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import create_db_and_tables, sync_file_expiry_policy
from .routers import files, tools, users

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

create_db_and_tables()
sync_file_expiry_policy()

app.include_router(users.router)
app.include_router(files.router_auth)
app.include_router(tools.router_auth)

# Demo-friendly single service: serve frontend files from the same origin.
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
