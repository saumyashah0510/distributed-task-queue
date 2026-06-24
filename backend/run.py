import uvicorn

if __name__ == "__main__":
    # Runs the FastAPI app located in src/main.py
    # reload=True automatically restarts the server when you save files
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
