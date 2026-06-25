import random
from locust import HttpUser, task, between

class TaskQueueUser(HttpUser):

    wait_time = between(1,3)

    @task(3)
    def check_dashboard(self):
        self.client.get("/api/jobs")

    @task(1)
    def submit_random_job(self):

        job_types = ["email", "report", "ai_analysis"]
        chosen_type = random.choice(job_types)
        
        if chosen_type == "email":
            chosen_priority = "high"
        elif chosen_type == "report":
            chosen_priority = "normal"
        else:
            chosen_priority = "low"

        payload = {
            "type" : chosen_type,
            "priority" : chosen_priority,
            "payload" : {
                "message" : "Hello from locust load test"
            }
        }    

        self.client.post("/api/jobs",json=payload)