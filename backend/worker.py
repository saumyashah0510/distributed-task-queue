import time
from celery import Celery

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