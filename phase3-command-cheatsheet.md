# Phase 3 Command Cheat Sheet — WSL / Claude Code / FastAPI

## Getting into your environment

**Open Ubuntu terminal (from Windows):**
```
wsl
```
or open the "Ubuntu" app directly from the Start menu.

**Navigate to the project and activate the virtual environment:**
```
cd ~/projects/note-app
source venv/bin/activate
```
You'll know it worked when your prompt shows `(venv)` at the start.

**Exit the venv (rarely needed, but good to know):**
```
deactivate
```

---

## Launching Claude Code

From inside the project folder, with venv active:
```
claude
```

**Exit Claude Code:**
```
/exit
```
(or Ctrl+C)

---

## Running the server manually

**Start the server:**
```
uvicorn main:app --port 8123
```
This will occupy the terminal (looks "stuck" — that's normal, it's running and listening).

**Stop the server:**
Press `Ctrl+C` in the terminal where it's running.

**Force-stop if you lose track of it:**
```
pkill -f uvicorn
```

---

## Testing the API manually

**Option 1 — Browser (recommended, interactive):**
With the server running, open in a Windows browser:
```
http://127.0.0.1:8123/docs
```
Click an endpoint → "Try it out" → edit the JSON → "Execute".

**Option 2 — curl (from a second Ubuntu terminal, since the first is occupied by the server):**

Health check:
```
curl http://127.0.0.1:8123/
```

Create a note:
```
curl -X POST http://127.0.0.1:8123/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"My first note","content":"Hello world"}'
```

---

## Git workflow (per feature)

```
git status                      # see what changed
git add .                       # stage everything
git commit -m "Description"     # commit with a message
git push                        # push to GitHub
```

(First push only needed `git push -u origin main`; after that, plain `git push` works.)

---

## Checking the database directly

```
python3 -c "
import sqlite3
conn = sqlite3.connect('notes.db')
rows = conn.execute('SELECT * FROM notes').fetchall()
for r in rows:
    print(dict(r))
conn.close()
"
```

---

## Quick reference: what each piece does

| Command/Tool | What it is |
|---|---|
| `wsl` | Enters your Ubuntu Linux environment from Windows |
| `venv` | Isolated folder of Python packages just for this project |
| `uvicorn` | The program that actually runs your FastAPI app as a live server |
| `curl` | Sends a real HTTP request from the terminal, for manual testing |
| `/docs` | FastAPI's free, auto-generated interactive testing page |
| `git status/add/commit/push` | Track, stage, save, and upload your code changes |
