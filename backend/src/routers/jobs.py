import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ..database import get_db
from .. import models
from .. import models
from .. import schemas
from ..worker import email_job,report_job,ai_job,celery_app

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)

PRIORITY_MAP = {
    "email": "high",
    "report": "normal",
    "ai_analysis": "low"
}

@router.post("", response_model=schemas.JobResponse)
async def create_job(job_in: schemas.JobCreate, db: AsyncSession = Depends(get_db)):

    job_id = str(uuid.uuid4())
    inferred_priority = job_in.priority
    target_queue = f"{inferred_priority}_priority"

    new_job = models.JobModel(
        id=job_id,
        type=job_in.type,
        priority=inferred_priority,
        queue_name=target_queue,
        status="PENDING",
        payload=job_in.payload,
        created_at=datetime.utcnow(),
        retry_count=0
    )

    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)

    # triggering celery
    if job_in.type == "email":
        email_job.apply_async(args = [job_id, job_in.payload], queue = target_queue, task_id = job_id)
    elif job_in.type == "report":
        report_job.apply_async(args = [job_id, job_in.payload], queue = target_queue, task_id = job_id)
    elif job_in.type == "ai_analysis":
        ai_job.apply_async(args = [job_id, job_in.payload], queue = target_queue, task_id = job_id)    

    return new_job


@router.get("", response_model=List[schemas.JobResponse])
async def list_jobs(
    status: Optional[str] = None,
    type: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(models.JobModel)
    
    if status:
        query = query.filter(models.JobModel.status == status)
    if type:
        query = query.filter(models.JobModel.type == type)
    if priority:
        query = query.filter(models.JobModel.priority == priority)
        
    query = query.order_by(models.JobModel.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{job_id}", response_model=schemas.JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.JobModel).filter(models.JobModel.id == job_id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/{job_id}/retry", response_model=schemas.JobResponse)
async def retry_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.JobModel).filter(models.JobModel.id == job_id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != "FAILURE":
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")
        
    job.status = "RETRY"
    job.retry_count += 1
    job.updated_at = datetime.utcnow()
    
    target_queue = f"{job.priority}_priority"
    if job.type == "email":
        email_job.apply_async(args = [job.id, job.payload], queue = target_queue, task_id = job.id)
    elif job.type == "report":
        report_job.apply_async(args = [job.id, job.payload], queue = target_queue, task_id = job.id)
    elif job.type == "ai_analysis":
        ai_job.apply_async(args = [job.id, job.payload], queue = target_queue, task_id = job.id)    
    
    await db.commit()
    await db.refresh(job)
    return job


@router.post("/{job_id}/revoke", response_model=schemas.JobResponse)
async def revoke_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.JobModel).filter(models.JobModel.id == job_id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status not in ["PENDING", "RETRY", "STARTED"]:
        raise HTTPException(status_code=400, detail="Can only revoke pending, retrying, or active jobs")
        
    job.status = "REVOKED"
    job.updated_at = datetime.utcnow()
    
    celery_app.control.revoke(job_id, terminate=True)
    
    await db.commit()
    await db.refresh(job)
    return job

@router.get("/all/workers", response_model=List[schemas.WorkerResponse])
async def list_workers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.WorkerModel))
    return result.scalars().all()