import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Column from './components/Column.jsx';
import TaskDialog from './components/TaskDialog.jsx';
import { COLUMNS } from './constants.js';
import { useTodos } from './hooks/useTodos.js';
import { useTheme } from './hooks/useTheme.js';
import { matchesFilters } from './utils.js';

export default function App() {
  const { todos, addTodo, updateTodo, deleteTodo, moveTodo, saveError } = useTodos();
  const { theme, cycleTheme } = useTheme();
  const [filters, setFilters] = useState({ search: '', priority: 'all', tag: null });
  // While the dialog is open: { todoId } to edit a task, or { todoId: null, status } to add one.
  const [dialog, setDialog] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const openNew = (status = 'todo') => setDialog({ todoId: null, status });
  const openEdit = (todoId) => setDialog({ todoId, status: null });
  const closeDialog = () => setDialog(null);
  const setTagFilter = (tag) => setFilters((f) => ({ ...f, tag }));

  // Press "N" anywhere (outside a form field) to add a task.
  useEffect(() => {
    function onKeyDown(e) {
      // e.key can be undefined (e.g. Chrome autofill); skip IME composition too.
      if (e.isComposing || e.key?.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest?.('input, textarea, select, dialog')) return;
      e.preventDefault();
      setDialog((d) => d ?? { todoId: null, status: 'todo' });
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const editingTodo = dialog?.todoId ? todos.find((t) => t.id === dialog.todoId) : null;

  // The dialog unmounts while open, which skips the browser's focus restore, so do it here.
  // Layout effect: runs before TaskDialog's effect moves focus into the form.
  const returnFocus = useRef(null);
  const isDialogOpen = dialog !== null;
  useLayoutEffect(() => {
    if (isDialogOpen) {
      returnFocus.current = {
        el: document.activeElement,
        todoId: dialog.todoId,
        status: dialog.status ?? editingTodo?.status ?? COLUMNS[0].id,
      };
      return;
    }
    const target = returnFocus.current;
    returnFocus.current = null;
    if (!target) return;
    // Fall back to the card (it may have moved column) or, if it was deleted, the column's add button.
    const fallback =
      (target.todoId && document.querySelector(`.card[data-id="${CSS.escape(target.todoId)}"]`)) ||
      document.querySelector(`.column-${target.status} .column-header button`);
    const el = target.el?.isConnected && target.el !== document.body ? target.el : fallback;
    el?.focus();
  }, [isDialogOpen]); // Only open/close matters; dialog/editingTodo are read at that moment.

  function handleSave(data) {
    if (editingTodo) updateTodo(editingTodo.id, data);
    else addTodo(data);
    closeDialog();
  }

  function handleDelete(id) {
    deleteTodo(id);
    closeDialog();
  }

  return (
    <>
      <Toolbar
        filters={filters}
        onFiltersChange={setFilters}
        onAdd={() => openNew()}
        theme={theme}
        onThemeChange={cycleTheme}
      />

      {filters.tag && (
        <div className="active-tag">
          Filtering by tag
          <span className="tag">#{filters.tag}</span>
          <button type="button" className="link" onClick={() => setTagFilter(null)}>Clear</button>
        </div>
      )}

      {saveError && (
        <div className="save-error" role="status">
          Couldn't save to this browser's storage. Changes will be lost when you close the tab.
        </div>
      )}

      <main className="board">
        {COLUMNS.map((column, index) => {
          const columnTodos = todos.filter((t) => t.status === column.id);
          return (
            <Column
              key={column.id}
              column={column}
              prev={COLUMNS[index - 1]}
              next={COLUMNS[index + 1]}
              total={columnTodos.length}
              todos={columnTodos.filter((t) => matchesFilters(t, filters))}
              draggedId={draggedId}
              onDragStart={setDraggedId}
              onDragEnd={() => setDraggedId(null)}
              onMove={moveTodo}
              onAdd={() => openNew(column.id)}
              onEdit={openEdit}
              onTagClick={setTagFilter}
            />
          );
        })}
      </main>

      {dialog && (
        <TaskDialog
          key={dialog.todoId ?? `new-${dialog.status}`}
          todo={editingTodo}
          defaultStatus={dialog.status ?? 'todo'}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
