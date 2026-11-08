export const STORAGE_KEY = 'kanban-todos-v1';

export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];

export const PRIORITIES = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

export const PRIORITY_LABELS = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.label]));

/** Custom drag-and-drop data type, so the board ignores unrelated drags (files, text). */
export const DRAG_TYPE = 'application/x-kanban-task';
