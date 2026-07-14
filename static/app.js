document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("notes-container");
  const form = document.getElementById("create-note-form");
  const titleInput = document.getElementById("note-title");
  const contentInput = document.getElementById("note-content");
  const errorEl = document.getElementById("create-error");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchErrorEl = document.getElementById("search-error");

  function renderNote(note) {
    const noteEl = document.createElement("div");
    noteEl.className = "note";
    renderNoteView(noteEl, note);
    return noteEl;
  }

  function renderNoteView(noteEl, note) {
    noteEl.innerHTML = "";

    const titleEl = document.createElement("h2");
    titleEl.textContent = note.title;

    const contentEl = document.createElement("p");
    contentEl.textContent = note.content || "";

    const createdAtEl = document.createElement("small");
    createdAtEl.textContent = note.created_at;

    const actionsEl = document.createElement("div");
    actionsEl.className = "note-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      renderNoteEdit(noteEl, note);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      if (!confirm("Delete this note?")) {
        return;
      }
      fetch(`/notes/${note.id}`, { method: "DELETE" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          loadNotes();
        })
        .catch((error) => {
          alert(`Failed to delete note: ${error.message}`);
        });
    });

    actionsEl.appendChild(editButton);
    actionsEl.appendChild(deleteButton);

    noteEl.appendChild(titleEl);
    noteEl.appendChild(contentEl);
    noteEl.appendChild(createdAtEl);
    noteEl.appendChild(actionsEl);
  }

  function renderNoteEdit(noteEl, note) {
    noteEl.innerHTML = "";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.required = true;
    titleInput.value = note.title;

    const contentInput = document.createElement("textarea");
    contentInput.value = note.content || "";

    const editErrorEl = document.createElement("p");
    editErrorEl.className = "error";

    const actionsEl = document.createElement("div");
    actionsEl.className = "note-actions";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      editErrorEl.textContent = "";

      if (!titleInput.value.trim()) {
        editErrorEl.textContent = "Title is required";
        return;
      }

      fetch(`/notes/${note.id}`, {
        method: "PUT",
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
          loadNotes();
        })
        .catch((error) => {
          editErrorEl.textContent = `Failed to save note: ${error.message}`;
        });
    });

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => {
      renderNoteView(noteEl, note);
    });

    actionsEl.appendChild(saveButton);
    actionsEl.appendChild(cancelButton);

    noteEl.appendChild(titleInput);
    noteEl.appendChild(contentInput);
    noteEl.appendChild(actionsEl);
    noteEl.appendChild(editErrorEl);
  }

  function renderNotes(notes, emptyMessage = "No notes yet.") {
    container.innerHTML = "";

    if (notes.length === 0) {
      container.textContent = emptyMessage;
      return;
    }

    notes.forEach((note) => {
      container.appendChild(renderNote(note));
    });
  }

  function loadNotes() {
    fetch("/notes")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((notes) => {
        renderNotes(notes);
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

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchErrorEl.textContent = "";

    const query = searchInput.value.trim();
    if (!query) {
      loadNotes();
      return;
    }

    fetch(`/notes/search?q=${encodeURIComponent(query)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((notes) => {
        renderNotes(notes, "No notes match your search.");
      })
      .catch((error) => {
        searchErrorEl.textContent = `Search failed: ${error.message}`;
      });
  });

  loadNotes();
});
