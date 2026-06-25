import asyncio

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from contextlib import asynccontextmanager

from .websockets import manager
from .database import engine, SessionLocal
from . import models
from .routers import jobs, metrics


async def broadcast_metrics():

    while True:
        try :
            async with SessionLocal() as db:
                res = await db.execute(
                    select(models.JobModel.status, func.count(models.JobModel.id)).group_by(models.JobModel.status)
                )
                counts = dict(res.fetchall())

            metrics = {
                "PENDING" : counts.get("PENDING",0),
                "STARTED" : counts.get("STARTED",0),
                "SUCCESS" : counts.get("SUCCESS",0),
                "FAILURE" : counts.get("FAILURE",0)
            }  

            await manager.broadcast(metrics)

        except Exception as e:
            print("Metrics broadcast error:", e)

        await asyncio.sleep(1)        

@asynccontextmanager
async def lifespan(app : FastAPI):

    task = asyncio.create_task(broadcast_metrics())       
    yield

    task.cancel()   
    print("✅ Metrics broadcast stopped")


app = FastAPI(title="Distributed Task Queue API", lifespan=lifespan)

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket : WebSocket):
    await manager.connect(websocket)

    try :
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)            

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Distributed Task Queue API is running!"}

app.include_router(jobs.router)
app.include_router(metrics.router)
