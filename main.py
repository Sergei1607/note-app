from fastapi import FastAPI

from database import init_db

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def health_check() -> dict:
    return {"status": "ok"}
