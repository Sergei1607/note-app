from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel

from database import get_connection, init_db

app = FastAPI()


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/notes")
def create_note(note: NoteCreate) -> dict:
    connection = get_connection()
    try:
        cursor = connection.execute(
            "INSERT INTO notes (title, content) VALUES (?, ?)",
            (note.title, note.content),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM notes WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    finally:
        connection.close()
    return dict(row)
