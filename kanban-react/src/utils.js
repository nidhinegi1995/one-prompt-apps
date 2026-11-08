export function newId() {
  if (globalThis.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** "Frontend, #bug, bug" -> ["frontend", "bug"] */
export function parseTags(input) {
  const tags = input
    .split(',')
    .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

export function matchesFilters(todo, { search, priority, tag }) {
  if (priority !== 'all' && todo.priority !== priority) return false;
  if (tag && !todo.tags.includes(tag)) return false;
  // Leading '#'s are dropped so "#bug" finds tag "bug"; '\n' keeps matches within one field.
  const query = search.trim().replace(/^#+/, '').toLowerCase();
  if (query) {
    const haystack = [todo.title, todo.description, ...todo.tags].join('\n').toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}
