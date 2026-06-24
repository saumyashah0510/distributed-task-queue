from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from .. import models
from .. import schemas

router = APIRouter(
    prefix="/api",
    tags=["Metrics"]
)

@router.get("/metrics", response_model=schemas.MetricsResponse)
async def get_metrics(db: AsyncSession = Depends(get_db)):
    
    pending_q = await db.execute(select(func.count()).select_from(models.JobModel).filter(models.JobModel.status == "PENDING"))
    active_q = await db.execute(select(func.count()).select_from(models.JobModel).filter(models.JobModel.status == "STARTED"))
    failed_q = await db.execute(select(func.count()).select_from(models.JobModel).filter(models.JobModel.status == "FAILURE"))
    completed_q = await db.execute(select(func.count()).select_from(models.JobModel).filter(models.JobModel.status == "SUCCESS"))
    
    active_workers_q = await db.execute(select(func.count()).select_from(models.WorkerModel).filter(models.WorkerModel.status == "active"))
    
    return schemas.MetricsResponse(
        pending_jobs=pending_q.scalar() or 0,
        active_jobs=active_q.scalar() or 0,
        failed_jobs=failed_q.scalar() or 0,
        completed_jobs=completed_q.scalar() or 0,
        active_workers=active_workers_q.scalar() or 0
    )

@router.get("/queues")
async def get_queues(db: AsyncSession = Depends(get_db)):
    results = await db.execute(
        select(models.JobModel.queue_name, func.count(models.JobModel.id))
        .filter(models.JobModel.status.in_(["PENDING", "RETRY"]))
        .group_by(models.JobModel.queue_name)
    )
    
    queue_counts = {
        "high_priority": 0,
        "normal_priority": 0,
        "low_priority": 0
    }
    
    for row in results.all():
        queue_name, count = row
        if queue_name in queue_counts:
            queue_counts[queue_name] = count
            
    return queue_counts

@router.get("/workers", response_model=List[schemas.WorkerResponse])
async def get_workers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.WorkerModel))
    return result.scalars().all()
