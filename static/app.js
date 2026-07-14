document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("notes-container");
  const form = document.getElementById("create-note-form");
  const titleInput = document.getElementById("note-title");
  const contentInput = document.getElementById("note-content");
  const errorEl = document.getElementById("create-error");

  function loadNotes() {
    fetch("/notes")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((notes) => {
        container.innerHTML = "";

        if (notes.length === 0) {
          container.textContent = "No notes yet.";
          return;
        }

        notes.forEach((note) => {
          const noteEl = document.createElement("div");
          noteEl.className = "note";

          const titleEl = document.createElement("h2");
          titleEl.textContent = note.title;

          const contentEl = document.createElement("p");
          contentEl.textContent = note.content || "";

          const createdAtEl = document.createElement("small");
          createdAtEl.textContent = note.created_at;

          noteEl.appendChild(titleEl);
          noteEl.appendChild(contentEl);
          noteEl.appendChild(createdAtEl);
          container.appendChild(noteEl);
        });
      })
      .catch((error) => {
        container.textContent = `Failed to load notes: ${error.message}`;
      });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorEl.textContent = "";

    fetch("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleInput.value,
        content: contentInput.value,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        form.reset();
        loadNotes();
      })
      .catch((error) => {
        errorEl.textContent = `Failed to create note: ${error.message}`;
      });
  });

  loadNotes();
});
