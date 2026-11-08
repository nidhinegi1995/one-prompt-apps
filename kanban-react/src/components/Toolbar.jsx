import { PRIORITIES } from '../constants.js';

const THEME_LABELS = { system: '◐ System', light: '☀ Light', dark: '☾ Dark' };

export default function Toolbar({ filters, onFiltersChange, onAdd, theme, onThemeChange }) {
  const update = (changes) => onFiltersChange({ ...filters, ...changes });

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">✓</span>
        <h1>Kanban To-Do</h1>
      </div>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search tasks…"
          aria-label="Search tasks"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
        <select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) => update({ priority: e.target.value })}
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn theme-toggle"
          title="Switch theme (system → light → dark)"
          aria-label={`Theme: ${theme}. Click to switch.`}
          onClick={onThemeChange}
        >
          {THEME_LABELS[theme]}
        </button>
        <button type="button" className="btn primary" onClick={onAdd}>+ New task</button>
      </div>
    </header>
  );
}
