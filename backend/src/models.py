from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    type = Column(
        Enum("email", "report", "ai_analysis", name="job_type"), 
        nullable=False
    )
    priority = Column(
        Enum("high", "normal", "low", name="job_priority"), 
        nullable=False, 
        index=True
    )
    queue_name = Column(String)
    status = Column(
        Enum("PENDING", "STARTED", "SUCCESS", "FAILURE", "RETRY", "REVOKED", name="job_status"), 
        nullable=False, 
        index=True
    )
    payload = Column(JSON)
    result = Column(JSON)
    error = Column(String)
    worker_id = Column(String, ForeignKey("workers.id"), index=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)


class WorkerModel(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True, index=True)
    status = Column(
        Enum("active", "offline", name="worker_status"), 
        nullable=False
    )
    current_job_id = Column(String)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tasks_completed = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)