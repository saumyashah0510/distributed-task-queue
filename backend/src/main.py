from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routers import jobs, metrics

# We use lifespan to run startup tasks (like creating tables) async safely
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the tables asynchronously on startup
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield
    # We could put shutdown logic here if needed

app = FastAPI(title="Distributed Task Queue API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Distributed Task Queue API is running!"}

app.include_router(jobs.router)
app.include_router(metrics.router)
