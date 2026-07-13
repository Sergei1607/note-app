from typing import Optional

from fastapi import FastAPI, HTTPException
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


@app.get("/notes")
def list_notes() -> list[dict]:
    connection = get_connection()
    try:
        rows = connection.execute(
            "SELECT * FROM notes ORDER BY created_at DESC"
        ).fetchall()
    finally:
        connection.close()
    return [dict(row) for row in rows]


@app.get("/notes/{note_id}")
def get_note(note_id: int) -> dict:
    connection = get_connection()
    try:
        row = connection.execute(
            "SELECT * FROM notes WHERE id = ?", (note_id,)
        ).fetchone()
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return dict(row)


@app.put("/notes/{note_id}")
def update_note(note_id: int, note: NoteCreate) -> dict:
    connection = get_connection()
    try:
        connection.execute(
            "UPDATE notes SET title = ?, content = ? WHERE id = ?",
            (note.title, note.content, note_id),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM notes WHERE id = ?", (note_id,)
        ).fetchone()
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return dict(row)
