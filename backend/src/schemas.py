from pydantic import BaseModel
from typing import Optional,Dict,Any,Literal
from datetime import datetime


class JobCreate(BaseModel):

    type : Literal["email","report","ai_analysis"]
    priority : Literal["high","normal","low"]
    payload : Dict[str,Any]

class JobResponse(BaseModel):

    id : str
    type : Literal["email","report","ai_analysis"]
    priority : Literal["high","normal","low"]
    payload : Dict[str,Any]    
    queue_name : Optional[str] = None
    status : Literal["PENDING","STARTED","SUCCESS","FAILURE","RETRY","REVOKED"]
    result : Optional[Dict[str,Any]] = None
    error : Optional[str] = None
    created_at : datetime
    updated_at : Optional[datetime] = None
    started_at : Optional[datetime] = None
    completed_at : Optional[datetime] = None
    worker_id : Optional[str] = None
    retry_count : int = 0

    class Config : 
        from_attributes = True

class WorkerResponse(BaseModel):

    id : str
    status : Literal["active","offline"]
    current_job_id : Optional[str] = None
    last_seen : Optional[datetime] = None
    tasks_completed : int = 0
    started_at : datetime

    class Config : 
        from_attributes = True

class MetricsResponse(BaseModel):

    pending_jobs: int
    active_jobs: int
    failed_jobs: int
    completed_jobs: int
    active_workers: int

    