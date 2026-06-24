from fastapi import FastAPI, Depends
from worker import celery_app, sleep_job
from database import engine, get_db, SessionLocal
from models import Base, JobModel
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/job")
def create_job(duration : int, db : Session = Depends(get_db)):

    task = sleep_job.delay(duration)

    new_job = JobModel(
        id = task.id,
        type = "Sleep",
        status = "Pending",
        duration = duration
    )
    db.add(new_job)
    db.commit()

    return {
        "message" : "Job submitted successfully",
        "task_id" : task.id
    }

@app.get("/job/{task_id}")
def get_job_status(task_id : str) :

    task_result = celery_app.AsyncResult(task_id)

    return {
        "task_id" : task_id,
        "status" : task_result.status,
        "result" : task_result.result
    }     