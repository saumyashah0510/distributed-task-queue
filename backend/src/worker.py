import os
from dotenv import load_dotenv
from celery import Celery
from kombu import Queue

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