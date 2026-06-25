from fastapi.testclient import TestClient
from src.main import app
from src.database import get_db
from unittest.mock import AsyncMock, patch, MagicMock

# Create a test client (this acts like a fake browser/Postman that talks directly to FastAPI)
client = TestClient(app)

async def override_get_db():
    mock_db = AsyncMock()
    yield mock_db

app.dependency_overrides[get_db] = override_get_db 


def test_health_check():
    """
    This is our first automated test!
    It sends a GET request to the root URL (/) and checks if the API returns 
    the correct 200 OK status and the success message.
    """
    response = client.get("/")
    
    # 1. Assert (Check) that the status code is 200 (Success)
    assert response.status_code == 200
    
    # 2. Assert (Check) that the response JSON matches what we expect
    assert response.json() == {"status": "ok", "message": "Distributed Task Queue API is running!"}



@patch("src.routers.jobs.celery_app.send_task")
def test_submit_job(mock_celery):

    fake_job_data = {
        "type" : "email",
        "priority" : "high",
        "payload" : {"to" : "test@example.com", "subject" : "Pytest Hello"}
    }

    response = client.post("/api/jobs", json=fake_job_data)

    assert response.status_code == 200

    data = response.json()
    assert data["type"] == "email"
    assert data["priority"] == "high"
    assert data["status"] == "PENDING"

    mock_celery.assert_called_once()


def test_submit_invalid_job():
    """
    Test that the API correctly rejects a job if the type is invalid.
    """
    # We send "magic_spell" instead of "email" or "report"
    bad_data = {
        "type": "magic_spell", 
        "priority": "high",
        "payload": {}
    }
    
    response = client.post("/api/jobs", json=bad_data)
    
    # 422 Unprocessable Entity is FastAPI's default error for bad data!
    assert response.status_code == 422 


def test_submit_missing_fields():

    bad_data = {
        "type" : "email",
        "priority" : "high"
        # no payload
    }    

    response = client.post("/api/jobs",json = bad_data)

    assert response.status_code == 422


def test_get_job_not_found():
    """
    Test that requesting a fake job ID properly returns a 404 error.
    """
    # 1. We create a fake database specifically for this test
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_result
    
    # 2. Tell FastAPI to use this specific mock DB for just this test!
    app.dependency_overrides[get_db] = lambda: mock_db
    
    # 3. Try to fetch a job that doesn't exist
    response = client.get("/api/jobs/fake-id-1234")
    
    # 4. Assert the API correctly caught it and returned 404 Not Found
    assert response.status_code == 404
    
    # 5. Put the default mock back so we don't break other tests
    app.dependency_overrides[get_db] = override_get_db


    
    