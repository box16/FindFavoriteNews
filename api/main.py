from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def hello():
    return {"message": "Hello from FastAPI in Docker!"}
