import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set! Please check your .env file.")

# asyncpg requires the URL to start with postgresql+asyncpg://
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Neon appends ?sslmode=require which asyncpg doesn't understand. 
# We strip it out and manually pass ssl=True to the engine.
if "?" in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.split("?")[0]

import sys
from sqlalchemy.pool import NullPool

# Only disable connection pooling for Celery workers to avoid prefork crashes.
# We MUST leave pooling enabled for FastAPI, otherwise the websocket crawls!
use_nullpool = "celery" in sys.argv[0] or "celery" in sys.executable

if use_nullpool:
    engine = create_async_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"ssl": True},
        poolclass=NullPool
    )
else:
    engine = create_async_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"ssl": True},
        pool_size=100,
        max_overflow=200,
        pool_timeout=60
    )

# Configure the async session
SessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Async dependency generator
async def get_db():
    async with SessionLocal() as db:
        yield db
