import { useEffect } from 'react';
import { DRAG_TYPE, PRIORITY_LABELS } from '../constants.js';

/** Card (and arrow button) to focus once it remounts after a ←/→ move. */
let pendingFocus = null;

export default function TaskCard({ todo, prev, next, isDragging, onDragStart, onDragEnd, onMove, onEdit, onTagClick }) {
  function handleDragStart(e) {
    e.dataTransfer.setData(DRAG_TYPE, todo.id);
    e.dataTransfer.effectAllowed = 'move';
    // Re-rendering inside dragstart can cancel the drag in Chrome, so update state on the next tick.
    setTimeout(() => onDragStart(todo.id), 0);
  }

  // A ←/→ move remounts the card in another column, losing focus; the new instance takes it back.
  function moveWithFocus(dir, status) {
    pendingFocus = { id: todo.id, dir };
    onMove(todo.id, status);
  }

  useEffect(() => {
    if (pendingFocus?.id !== todo.id) return;
    const { dir } = pendingFocus;
    pendingFocus = null;
    const card = document.querySelector(`.card[data-id="${CSS.escape(todo.id)}"]`);
    const button = card?.querySelector(`[data-move="${dir}"]`);
    (button && !button.disabled ? button : card)?.focus();
  }, [todo.id]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.target === e.currentTarget) onEdit(todo.id);
  }

  return (
    <article
      className={`card priority-${todo.priority}${isDragging ? ' dragging' : ''}`}
      data-id={todo.id}
      draggable
      tabIndex={0}
      aria-label={todo.title}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={(e) => {
        // Double-clicking a tag or action button shouldn't also open the editor.
        if (e.target.closest('button')) return;
        onEdit(todo.id);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="card-top">
        <span className={`badge badge-${todo.priority}`}>{PRIORITY_LABELS[todo.priority]}</span>
        <div className="card-actions">
          <button
            type="button"
            className="icon-btn"
            disabled={!prev}
            title={prev ? `Move to ${prev.title}` : undefined}
            aria-label={prev ? `Move to ${prev.title}` : 'Move left'}
            data-move="prev"
            onClick={() => prev && moveWithFocus('prev', prev.id)}
          >
            ←
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={!next}
            title={next ? `Move to ${next.title}` : undefined}
            aria-label={next ? `Move to ${next.title}` : 'Move right'}
            data-move="next"
            onClick={() => next && moveWithFocus('next', next.id)}
          >
            →
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Edit"
            aria-label={`Edit ${todo.title}`}
            onClick={() => onEdit(todo.id)}
          >
            ✎
          </button>
        </div>
      </div>

      <h3 className="card-title">{todo.title}</h3>
      {todo.description && <p className="card-desc">{todo.description}</p>}

      {todo.tags.length > 0 && (
        <div className="tags">
          {todo.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag"
              title={`Show only #${tag}`}
              onClick={() => onTagClick(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
