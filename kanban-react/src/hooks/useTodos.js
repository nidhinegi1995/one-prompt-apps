import { useCallback, useEffect, useRef, useState } from 'react';
import { COLUMNS, PRIORITIES, STORAGE_KEY } from '../constants.js';
import { newId } from '../utils.js';

function sampleTodos() {
  const now = new Date().toISOString();
  return [
    { id: newId(), createdAt: now, status: 'todo', priority: 'high', title: 'Write test cases for login page', description: 'Cover valid login, invalid password, locked account and empty fields.', tags: ['testing', 'parabank'] },
    { id: newId(), createdAt: now, status: 'in-progress', priority: 'medium', title: 'Draft LinkedIn post', description: 'Share what I learned about Claude Code this week.', tags: ['content'] },
    { id: newId(), createdAt: now, status: 'completed', priority: 'low', title: 'Install Claude Code', description: '', tags: ['setup'] },
  ];
}

const STATUS_IDS = new Set(COLUMNS.map((c) => c.id));
const PRIORITY_IDS = new Set(PRIORITIES.map((p) => p.id));
const str = (v) => (typeof v === 'string' ? v : '');

/** Repair stored tasks so one bad entry can't crash the board: drop junk/duplicates, fill defaults. */
function normalizeTodos(list) {
  const seen = new Set();
  return list.flatMap((t) => {
    if (!t || typeof t !== 'object' || typeof t.id !== 'string' || seen.has(t.id)) return [];
    seen.add(t.id);
    return [{
      ...t,
      title: str(t.title),
      description: str(t.description),
      tags: Array.isArray(t.tags) ? t.tags.filter((tag) => typeof tag === 'string') : [],
      status: STATUS_IDS.has(t.status) ? t.status : COLUMNS[0].id,
      priority: PRIORITY_IDS.has(t.priority) ? t.priority : 'medium',
    }];
  });
}

function backupCorrupt(raw) {
  try {
    localStorage.setItem(`${STORAGE_KEY}.corrupt`, raw);
  } catch {
    // Nowhere to put it; nothing more we can do.
  }
}

function loadTodos() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeTodos(parsed);
    }
  } catch {
    // Storage blocked or data corrupt: fall back to the sample board.
  }
  // Keep unreadable data in a backup key so the sample board doesn't destroy it.
  if (raw !== null) backupCorrupt(raw);
  return sampleTodos();
}

/**
 * All task state lives here. Array order is the display order:
 * each column shows its tasks in the order they appear in `todos`.
 */
export function useTodos() {
  const [todos, setTodos] = useState(loadTodos);
  const [saveError, setSaveError] = useState(false);
  // True when `todos` was just loaded from another tab's write, so we don't echo it back.
  const fromStorage = useRef(false);

  useEffect(() => {
    if (fromStorage.current) {
      fromStorage.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      setSaveError(false);
    } catch {
      // Storage unavailable (e.g. private mode): changes last for this session only.
      setSaveError(true);
    }
  }, [todos]);

  // Another tab changed the board: show its version instead of overwriting it later.
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY) return;
      fromStorage.current = true;
      setTodos(loadTodos());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addTodo = useCallback((data) => {
    setTodos((prev) => [...prev, { id: newId(), createdAt: new Date().toISOString(), ...data }]);
  }, []);

  const updateTodo = useCallback((id, data) => {
    setTodos((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (!existing) return prev;
      const updated = { ...existing, ...data };
      // A task moved to another column via the form goes to the end of that column.
      if (existing.status !== updated.status) return [...prev.filter((t) => t.id !== id), updated];
      return prev.map((t) => (t.id === id ? updated : t));
    });
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** Move a task to `status`, placed before task `beforeId` (or at the end of the column). */
  const moveTodo = useCallback((id, status, beforeId = null) => {
    setTodos((prev) => {
      if (id === beforeId) return prev;
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;
      const rest = prev.filter((t) => t.id !== id);
      const moved = { ...todo, status };
      const index = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1;
      if (index === -1) return [...rest, moved];
      return [...rest.slice(0, index), moved, ...rest.slice(index)];
    });
  }, []);

  return { todos, addTodo, updateTodo, deleteTodo, moveTodo, saveError };
}
