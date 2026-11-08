'use strict';

const STORAGE_KEY = 'kanban-todos-v1';
const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

const board = document.getElementById('board');
const dialog = document.getElementById('task-dialog');
const form = document.getElementById('task-form');
const dialogTitle = document.getElementById('dialog-title');
const deleteBtn = document.getElementById('delete-task');
const searchInput = document.getElementById('search');
const priorityFilter = document.getElementById('priority-filter');
const activeTagEl = document.getElementById('active-tag');

const field = (name) => form.elements.namedItem(name);

const filters = { search: '', priority: 'all', tag: null };
let todos = loadTodos();
let editingId = null;
let draggedId = null;

// ---------- Storage ----------

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // Storage blocked or data corrupt: fall back to the sample board.
  }
  return sampleTodos();
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage unavailable (e.g. private mode): changes last for this session only.
  }
}

function newId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function sampleTodos() {
  const now = new Date().toISOString();
  return [
    { id: newId(), createdAt: now, status: 'todo', priority: 'high', title: 'Write test cases for login page', description: 'Cover valid login, invalid password, locked account and empty fields.', tags: ['testing', 'parabank'] },
    { id: newId(), createdAt: now, status: 'in-progress', priority: 'medium', title: 'Draft LinkedIn post', description: 'Share what I learned about Claude Code this week.', tags: ['content'] },
    { id: newId(), createdAt: now, status: 'completed', priority: 'low', title: 'Install Claude Code', description: '', tags: ['setup'] },
  ];
}

// ---------- Helpers ----------

/** Tiny DOM builder. Children are appended as text, so user input is never parsed as HTML. */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

function parseTags(input) {
  const tags = input
    .split(',')
    .map((t) => t.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

function matchesFilters(todo) {
  if (filters.priority !== 'all' && todo.priority !== filters.priority) return false;
  if (filters.tag && !todo.tags.includes(filters.tag)) return false;
  if (filters.search) {
    const haystack = [todo.title, todo.description, ...todo.tags].join(' ').toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

// ---------- Rendering ----------

function render() {
  board.replaceChildren(...COLUMNS.map(renderColumn));

  activeTagEl.hidden = !filters.tag;
  if (filters.tag) {
    activeTagEl.replaceChildren(
      'Filtering by tag',
      el('span', { class: 'tag' }, `#${filters.tag}`),
      el('button', { type: 'button', class: 'link', onclick: () => setTagFilter(null) }, 'Clear'),
    );
  }
}

function renderColumn(column) {
  const all = todos.filter((t) => t.status === column.id);
  const visible = all.filter(matchesFilters);
  const count = visible.length === all.length ? `${all.length}` : `${visible.length} / ${all.length}`;

  const list = el(
    'div',
    { class: 'card-list', dataset: { status: column.id } },
    visible.length
      ? visible.map(renderCard)
      : el('p', { class: 'empty' }, all.length ? 'No matching tasks' : 'Drop tasks here'),
  );
  list.addEventListener('dragover', onDragOver);
  list.addEventListener('dragleave', onDragLeave);
  list.addEventListener('drop', onDrop);

  return el(
    'section',
    { class: `column column-${column.id}`, 'aria-label': column.title },
    el(
      'header',
      { class: 'column-header' },
      el('h2', {}, column.title),
      el('span', { class: 'count' }, count),
      el('button', {
        type: 'button',
        class: 'icon-btn',
        title: `Add task to ${column.title}`,
        'aria-label': `Add task to ${column.title}`,
        onclick: () => openDialog(null, column.id),
      }, '+'),
    ),
    list,
  );
}

function renderCard(todo) {
  const colIndex = COLUMNS.findIndex((c) => c.id === todo.status);
  const prev = COLUMNS[colIndex - 1];
  const next = COLUMNS[colIndex + 1];

  const card = el(
    'article',
    { class: `card priority-${todo.priority}`, draggable: 'true', tabindex: '0', dataset: { id: todo.id } },
    el(
      'div',
      { class: 'card-top' },
      el('span', { class: `badge badge-${todo.priority}` }, PRIORITY_LABELS[todo.priority]),
      el(
        'div',
        { class: 'card-actions' },
        el('button', {
          type: 'button', class: 'icon-btn', disabled: !prev,
          title: prev ? `Move to ${prev.title}` : '', 'aria-label': prev ? `Move to ${prev.title}` : 'Move left',
          onclick: () => prev && moveTodo(todo.id, prev.id),
        }, '←'),
        el('button', {
          type: 'button', class: 'icon-btn', disabled: !next,
          title: next ? `Move to ${next.title}` : '', 'aria-label': next ? `Move to ${next.title}` : 'Move right',
          onclick: () => next && moveTodo(todo.id, next.id),
        }, '→'),
        el('button', {
          type: 'button', class: 'icon-btn', title: 'Edit', 'aria-label': `Edit ${todo.title}`,
          onclick: () => openDialog(todo.id),
        }, '✎'),
      ),
    ),
    el('h3', { class: 'card-title' }, todo.title),
    todo.description && el('p', { class: 'card-desc' }, todo.description),
    todo.tags.length > 0 && el(
      'div',
      { class: 'tags' },
      todo.tags.map((tag) => el('button', {
        type: 'button', class: 'tag', title: `Show only #${tag}`,
        onclick: () => setTagFilter(tag),
      }, `#${tag}`)),
    ),
  );

  card.addEventListener('dragstart', (e) => {
    draggedId = todo.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', todo.id);
  });
  card.addEventListener('dragend', () => {
    draggedId = null;
    card.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach((n) => n.classList.remove('drag-over'));
  });
  card.addEventListener('dblclick', () => openDialog(todo.id));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === card) openDialog(todo.id);
  });

  return card;
}

function setTagFilter(tag) {
  filters.tag = tag;
  render();
}

// ---------- Moving tasks ----------

/** Move a task to `status`, placed before the task `beforeId` (or at the end of the column). */
function moveTodo(id, status, beforeId = null) {
  if (id === beforeId) return;
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return;

  const [todo] = todos.splice(index, 1);
  todo.status = status;
  const beforeIndex = beforeId ? todos.findIndex((t) => t.id === beforeId) : -1;
  if (beforeIndex === -1) todos.push(todo);
  else todos.splice(beforeIndex, 0, todo);

  saveTodos();
  render();
}

function onDragOver(e) {
  if (!draggedId) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const list = e.currentTarget;
  list.classList.remove('drag-over');
  const id = draggedId || e.dataTransfer.getData('text/plain');
  if (id) moveTodo(id, list.dataset.status, cardIdBelow(list, e.clientY));
}

/** The first card whose vertical midpoint is below the cursor: the drop goes right before it. */
function cardIdBelow(list, y) {
  const cards = [...list.querySelectorAll('.card:not(.dragging)')];
  const below = cards.find((card) => {
    const rect = card.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  });
  return below ? below.dataset.id : null;
}

// ---------- Add / edit dialog ----------

function openDialog(id = null, status = 'todo') {
  const todo = id ? todos.find((t) => t.id === id) : null;
  editingId = todo ? todo.id : null;

  form.reset();
  dialogTitle.textContent = todo ? 'Edit task' : 'New task';
  field('title').value = todo ? todo.title : '';
  field('description').value = todo ? todo.description : '';
  field('priority').value = todo ? todo.priority : 'medium';
  field('status').value = todo ? todo.status : status;
  field('tags').value = todo ? todo.tags.join(', ') : '';
  deleteBtn.hidden = !todo;

  dialog.showModal();
  field('title').focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    title: field('title').value.trim(),
    description: field('description').value.trim(),
    priority: field('priority').value,
    status: field('status').value,
    tags: parseTags(field('tags').value),
  };
  if (!data.title) {
    field('title').value = '';
    field('title').reportValidity();
    return;
  }

  const existing = editingId && todos.find((t) => t.id === editingId);
  if (existing) {
    const statusChanged = existing.status !== data.status;
    Object.assign(existing, data);
    if (statusChanged) {
      // A task moved via the form goes to the end of its new column.
      todos.splice(todos.indexOf(existing), 1);
      todos.push(existing);
    }
  } else {
    todos.push({ id: newId(), createdAt: new Date().toISOString(), ...data });
  }

  saveTodos();
  render();
  dialog.close();
});

deleteBtn.addEventListener('click', () => {
  const todo = todos.find((t) => t.id === editingId);
  if (!todo || !confirm(`Delete "${todo.title}"?`)) return;
  todos = todos.filter((t) => t.id !== editingId);
  saveTodos();
  render();
  dialog.close();
});

document.getElementById('cancel-task').addEventListener('click', () => dialog.close());

// Clicking the dimmed backdrop closes the dialog.
dialog.addEventListener('click', (e) => {
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  if (outside) dialog.close();
});

// ---------- Toolbar ----------

document.getElementById('add-task').addEventListener('click', () => openDialog());

searchInput.addEventListener('input', () => {
  filters.search = searchInput.value.trim();
  render();
});

priorityFilter.addEventListener('change', () => {
  filters.priority = priorityFilter.value;
  render();
});

// Press "N" anywhere (outside a text field) to add a task.
document.addEventListener('keydown', (e) => {
  const typing = e.target.closest('input, textarea, select');
  if (e.key.toLowerCase() === 'n' && !typing && !dialog.open && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    openDialog();
  }
});

// ---------- Init ----------

field('status').append(...COLUMNS.map((c) => el('option', { value: c.id }, c.title)));
render();
