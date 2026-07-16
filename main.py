from typing import Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from database import get_connection, init_db

load_dotenv()

app = FastAPI()
anthropic_client = anthropic.Anthropic()

MAX_NOTE_CONTENT_CHARS = 2000


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
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


@app.get("/notes/search")
def search_notes(q: Optional[str] = Query(None)) -> list[dict]:
    if q is None or not q.strip():
        raise HTTPException(
            status_code=400,
            detail="Query parameter 'q' is required and cannot be empty",
        )
    pattern = f"%{q}%"
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT * FROM notes
            WHERE LOWER(title) LIKE LOWER(?) OR LOWER(content) LIKE LOWER(?)
            ORDER BY created_at DESC
            """,
            (pattern, pattern),
        ).fetchall()
    finally:
        connection.close()
    return [dict(row) for row in rows]


@app.get("/notes/summary")
def get_notes_summary() -> dict:
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT * FROM notes
            WHERE created_at >= datetime('now', '-7 days')
            ORDER BY created_at DESC
            """
        ).fetchall()
    finally:
        connection.close()

    if not rows:
        return {"summary": "No notes this week."}

    notes_text = "\n\n".join(
        f"Title: {row['title']}\n"
        f"Content: {(row['content'] or '')[:MAX_NOTE_CONTENT_CHARS]}"
        for row in rows
    )
    prompt = (
        "Here are my notes from the past week. Summarize them in a few natural, "
        "conversational sentences, as if you were catching me up on my own week. "
        "Respond in plain text only: no markdown formatting (no #, **, bullet "
        "points, or other markdown syntax) and no emoji.\n\n" + notes_text
    )

    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to generate summary: {e}"
        )

    summary_text = next(
        (block.text for block in response.content if block.type == "text"), ""
    )
    return {"summary": summary_text}


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


@app.delete("/notes/{note_id}")
def delete_note(note_id: int) -> dict:
    connection = get_connection()
    try:
        row = connection.execute(
            "SELECT * FROM notes WHERE id = ?", (note_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Note not found")
        connection.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        connection.commit()
    finally:
        connection.close()
    return {"message": "Note deleted", "id": note_id}


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


app.mount("/", StaticFiles(directory="static", html=True), name="static")
