document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("notes-container");
  const form = document.getElementById("create-note-form");
  const titleInput = document.getElementById("note-title");
  const contentInput = document.getElementById("note-content");
  const errorEl = document.getElementById("create-error");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchErrorEl = document.getElementById("search-error");
  const summarizeButton = document.getElementById("summarize-button");
  const summaryPanel = document.getElementById("summary-panel");

  function formatDate(dateStr) {
    const date = new Date(dateStr.replace(" ", "T") + "Z");
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }
    const datePart = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timePart = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} · ${timePart}`;
  }

  function leafTilt(id) {
    return ((id * 37) % 17) - 8;
  }

  function renderNote(note) {
    const noteEl = document.createElement("div");
    noteEl.className = "note";
    renderNoteView(noteEl, note);
    return noteEl;
  }

  function renderNoteView(noteEl, note) {
    noteEl.innerHTML = "";

    const headerEl = document.createElement("div");
    headerEl.className = "note-header";

    const titleEl = document.createElement("h2");
    titleEl.textContent = note.title;

    const leafEl = document.createElement("span");
    leafEl.className = "note-leaf";
    leafEl.textContent = "🍃";
    leafEl.style.transform = `rotate(${leafTilt(note.id)}deg)`;

    headerEl.appendChild(titleEl);
    headerEl.appendChild(leafEl);

    const contentEl = document.createElement("p");
    contentEl.textContent = note.content || "";

    const footerEl = document.createElement("div");
    footerEl.className = "note-footer";

    const createdAtEl = document.createElement("small");
    createdAtEl.textContent = formatDate(note.created_at);

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

    footerEl.appendChild(createdAtEl);
    footerEl.appendChild(actionsEl);

    noteEl.appendChild(headerEl);
    noteEl.appendChild(contentEl);
    noteEl.appendChild(footerEl);
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

  function renderNotes(notes, emptyMessage = "🍃 No notes yet — plant your first one above.") {
    container.innerHTML = "";
    container.classList.remove("loading", "empty");

    if (notes.length === 0) {
      container.classList.add("empty");
      container.textContent = emptyMessage;
      return;
    }

    notes.forEach((note) => {
      container.appendChild(renderNote(note));
    });
  }

  function loadNotes() {
    container.classList.add("loading");
    container.classList.remove("empty");
    container.textContent = "Loading notes...";

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
        container.classList.remove("loading");
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
        renderNotes(notes, "🍃 No notes match your search.");
      })
      .catch((error) => {
        searchErrorEl.textContent = `Search failed: ${error.message}`;
      });
  });

  summarizeButton.addEventListener("click", () => {
    summarizeButton.disabled = true;
    summarizeButton.textContent = "Summarizing...";
    summaryPanel.classList.remove("error");
    summaryPanel.classList.add("visible");
    summaryPanel.textContent = "Summarizing your week...";

    fetch("/notes/summary")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        summaryPanel.classList.remove("error");
        summaryPanel.textContent = data.summary;
      })
      .catch((error) => {
        summaryPanel.classList.add("error");
        summaryPanel.textContent = `Failed to generate summary: ${error.message}`;
      })
      .finally(() => {
        summarizeButton.disabled = false;
        summarizeButton.textContent = "Summarize my week";
      });
  });

  loadNotes();
});
