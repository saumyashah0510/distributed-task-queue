from random import random
import os, time, ssl, asyncio, random
from dotenv import load_dotenv
from celery import Celery
from celery.signals import worker_ready, worker_shutting_down
from kombu import Queue
from sqlalchemy import select
from datetime import datetime,timezone

from .database import SessionLocal, engine
from . import models

load_dotenv()

# Create a persistent event loop for the worker to avoid asyncpg 'Event loop is closed' errors
worker_loop = asyncio.new_event_loop()
asyncio.set_event_loop(worker_loop)

def run_async(coro):
    return worker_loop.run_until_complete(coro)

redis_url = os.getenv("REDIS_URL")

IS_DEMO_MODE = os.getenv("DEMO_MODE","False").lower() == "true"
SLEEP_MULTIPLIER = 0.3 if IS_DEMO_MODE else 1.0

celery_app = Celery(
    "tasks",
    broker = redis_url,
    backend = redis_url
)

# Upstash strictly requires SSL. We must tell Celery to use it.
if redis_url.startswith("rediss://"):
    celery_app.conf.broker_use_ssl = {'ssl_cert_reqs': ssl.CERT_NONE}
    celery_app.conf.redis_backend_use_ssl = {'ssl_cert_reqs': ssl.CERT_NONE}

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


async def update_job_status(job_id : str, status : str, result : dict = None, error : str = None,
worker_id : str = None, retry_count : int = None):
    async with SessionLocal() as db:
        res = await db.execute(select(models.JobModel).filter(models.JobModel.id == job_id))   

        job = res.scalars().first()
        if job :
            if job.status == "REVOKED":
                # If the job was already revoked by the user, ignore any further worker state updates
                return
            
            job.status = status
            if result : 
                job.result = result 
            if error : 
                job.error = error
            if worker_id : 
                job.worker_id = worker_id
            if retry_count is not None :
                job.retry_count = retry_count    

            now = datetime.utcnow()
            if status == "STARTED" and not job.started_at :
                job.started_at = now
                if job.worker_id:
                    worker_res = await db.execute(select(models.WorkerModel).filter(models.WorkerModel.id == job.worker_id))
                    worker = worker_res.scalars().first()
                    if worker:
                        worker.current_job_id = job.id
            elif status in ["SUCCESS", "FAILURE", "RETRY"]:
                if status in ["SUCCESS", "FAILURE"]:
                    job.completed_at = now
                if job.worker_id:
                    worker_res = await db.execute(select(models.WorkerModel).filter(models.WorkerModel.id == job.worker_id))
                    worker = worker_res.scalars().first()
                    if worker:
                        if status == "SUCCESS":
                            worker.tasks_completed = (worker.tasks_completed or 0) + 1
                        if worker.current_job_id == job.id:
                            worker.current_job_id = None
            await db.commit()
            
    await engine.dispose()    


@celery_app.task(bind=True, name='src.worker.email_job', max_retries=3)
def email_job(self, job_id: str, payload: dict):
    worker_id = self.request.hostname
    current_retry = self.request.retries

    run_async(update_job_status(job_id, "STARTED", worker_id=worker_id, retry_count=current_retry))
    print(f"[{job_id}] 📧 STARTING EMAIL JOB (Retry {current_retry})...")
    
    try:
        time.sleep(3 * SLEEP_MULTIPLIER)
        # We can simulate an error here if "fail" is in the subject
        if "fail" in payload.get("subject", "").lower():
            raise ConnectionError("SMTP server timeout!")

        if random.random() < 0.10:
            raise RuntimeError("Chaos Engineering : Random simulated failure")    

        final_result = {"status": "sent", "to": payload.get("to", "unknown")}
        run_async(update_job_status(job_id, "SUCCESS", result=final_result))
        
        print(f"[{job_id}] ✅ Email sent successfully!")
        return final_result
        
    except Exception as e:
        print(f"[{job_id}] ❌ ERROR: {str(e)}")
        if self.request.retries >= self.max_retries:
            asyncio.run(update_job_status(job_id, "FAILURE", error=str(e)))
            print(f"[{job_id}] 💀 JOB FAILED PERMANENTLY")
            raise e
        print(f"[{job_id}] ♻️ Retrying in 5 seconds...")
        asyncio.run(update_job_status(job_id, "RETRY"))
        raise self.retry(exc=e, countdown=5)


@celery_app.task(bind=True, name='src.worker.report_job', max_retries=3)
def report_job(self, job_id: str, payload: dict):
    worker_id = self.request.hostname
    current_retry = self.request.retries

    run_async(update_job_status(job_id, "STARTED", worker_id=worker_id, retry_count=current_retry))
    print(f"[{job_id}] 📊 STARTING REPORT JOB (Retry {current_retry})...")
    
    try:
        time.sleep(7 * SLEEP_MULTIPLIER)
        fmt = payload.get("format", "pdf")
        if fmt not in ["pdf", "csv"]:
            raise ValueError(f"Unsupported report format: {fmt}")

        if random.random() < 0.10:
            raise RuntimeError("Chaos Engineering : Random simulated failure")    

        final_result = {
            "status": "generated", 
            "file_url": f"s3://reports-bucket/report_{job_id}.{fmt}",
            "pages": 42
        }
        
        run_async(update_job_status(job_id, "SUCCESS", result=final_result))
        print(f"[{job_id}] ✅ Report generated successfully!")
        return final_result
        
    except Exception as e:
        print(f"[{job_id}] ❌ ERROR: {str(e)}")
        if self.request.retries >= self.max_retries:
            asyncio.run(update_job_status(job_id, "FAILURE", error=str(e)))
            print(f"[{job_id}] 💀 JOB FAILED PERMANENTLY")
            raise e
        print(f"[{job_id}] ♻️ Retrying in 5 seconds...")
        asyncio.run(update_job_status(job_id, "RETRY"))
        raise self.retry(exc=e, countdown=5)
    

@celery_app.task(bind = True,name = 'src.worker.ai_job', max_retries = 3)
def ai_job(self, job_id : str, payload : dict):

    worker_id = self.request.hostname
    current_retry = self.request.retries

    run_async(update_job_status(job_id,"STARTED", worker_id=worker_id, retry_count = current_retry))

    print(f"[{job_id}] 🧠 STARTING AI JOB (Retry {current_retry})...")

    try :
        time.sleep(12 * SLEEP_MULTIPLIER)
        text_to_analyze = payload.get("text", "")
    
        if "crash" in text_to_analyze.lower():
            raise ValueError("AI Model encountered an unexpected error!")

        if random.random() < 0.10:
            raise RuntimeError("Chaos Engineering : Random simulated failure")    

        final_result = {
            "sentiment": "positive",
            "confidence": 0.98,
            "analyzed_word_count": len(text_to_analyze.split())
        }

        run_async(update_job_status(job_id,"SUCCESS",final_result))

        print(f"[{job_id}] ✅ AI JOB completed successfully!")
        return final_result        

    except Exception as e:
        print(f"[{job_id}] ❌ ERROR: {str(e)}")

        if self.request.retries >= self.max_retries :
            run_async(update_job_status(job_id,"FAILURE",error = str(e)))
            print(f"[{job_id}] 💀 JOB FAILED PERMANENTLY")
            raise e

        print(f"[{job_id}] ♻️ Retrying in 5 seconds...")
        run_async(update_job_status(job_id, "RETRY"))
        raise self.retry(exc=e, countdown=5) 



async def register_worker(worker_id : str):
    async with SessionLocal() as db:

        res = await db.execute(select(models.WorkerModel).filter(models.WorkerModel.id == worker_id))
        worker = res.scalars().first()

        if not worker :
            worker = models.WorkerModel(id = worker_id, status = "active")
            db.add(worker)
        else :
            worker.status = "active"

        await db.commit()
    await engine.dispose()


async def unregister_worker(worker_id : str):

    async with SessionLocal() as db:

        res = await db.execute(select(models.WorkerModel).filter(models.WorkerModel.id == worker_id))
        worker = res.scalars().first()

        if worker:
            worker.status = "offline"
            await db.commit()
    await engine.dispose()      


@worker_ready.connect
def on_worker_ready(sender, **kwargs):

    print(f"📡 Registering worker {sender.hostname} in the Database...") 
    run_async(register_worker(sender.hostname))


@worker_shutting_down.connect
def on_worker_shutdown(sender, **kwargs):
    # During shutdown, Celery passes the hostname as a plain string in `sender`
    hostname = sender if isinstance(sender, str) else getattr(sender, 'hostname', str(sender))
    print(f"🛑 Marking worker {hostname} as offline in Database...")
    run_async(unregister_worker(hostname))
