from fastapi import FastAPI
from worker import celery_app, sleep_job

app = FastAPI()

@app.post("/job")
def create_job(duration : int):

    task = sleep_job.delay(duration)

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