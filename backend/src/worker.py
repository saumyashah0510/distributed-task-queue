import os, time
from dotenv import load_dotenv
from celery import Celery
from kombu import Queue

from .database import SessionLocal
from . import models

load_dotenv()

redis_url = os.getenv("REDIS_URL")

celery_app = Celery(
    "tasks",
    broker = redis_url,
    backend = redis_url
)

print("Celery app initialized. Broker :", redis_url)

celery_app.conf.task_queues = (
    Queue("high_priority"),
    Queue("normal_priority"),
    Queue("low_priority"),
)

celery_app.conf.task_routes = {
    'src.worker.email_job' : {'queue' : 'high_priority'},
    'src.worker.report_job' : {'queue' : 'normal_priority'},
    'src.worker.ai_job' : {'queue' : 'low_priority'}
}


@celery_app.task(name = 'src.worker.email_job')
def email_job(job_id : str, payload : dict):

    print(f"[{job_id}] 📧 STARTING EMAIL JOB...")
    print(f"[{job_id}] Payload received : {payload}")

    time.sleep(3)

    print(f"[{job_id}] ✅ Email sent successfully!")

    return {"status" : "sent", "to" : payload.get("to","unknown")}


@celery_app.task(name = 'src.worker.report_job')
def report_job(job_id : str, payload : dict):

    print(f"[{job_id}] 📊 STARTING REPORT JOB...")
    print(f"[{job_id}] Payload received : {payload}")

    time.sleep(3)

    print(f"[{job_id}] ✅ Report sent successfully!")

    return {"status" : "sent", "to" : payload.get("to","unknown")}
    

@celery_app.task(name = 'src.worker.ai_job')
def ai_job(job_id : str, payload : dict):

    print(f"[{job_id}] 🧠 STARTING AI JOB...")
    print(f"[{job_id}] Payload received : {payload}")

    time.sleep(3)

    print(f"[{job_id}] ✅ AI JOB completed successfully!")

    return {"status" : "sent", "to" : payload.get("to","unknown")}        

