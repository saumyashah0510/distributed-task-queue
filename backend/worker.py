import time
from celery import Celery
from celery.signals import task_prerun, task_postrun
from database import SessionLocal
from models import JobModel

celery_app = Celery(
    "tasks",
    broker = "redis://localhost:6379/0",
    backend = "redis://localhost:6379/0"
)

@celery_app.task(bind = True)
def sleep_job(self,duration : int):

    print(f"Starting job. Sleeping for {duration} seconds...")
    time.sleep(duration)

    return {"status" : "completed", "duration" : duration, "message" : "Job finished successfully"}

@task_prerun.connect
def task_started(task_id,task,*args,**kwargs) :

    db = SessionLocal()
    job = db.query(JobModel).filter(JobModel.id == task_id).first()

    if job :
        job.status = "STARTED"
        db.commit()

    db.close()

@task_postrun.connect
def task_finished(task_id,task,*args,**kwargs) :

    db = SessionLocal()
    job = db.query(JobModel).filter(JobModel.id == task_id).first()

    if job:
        job.status = "SUCCESS"
        db.commit()

    db.close()    
        