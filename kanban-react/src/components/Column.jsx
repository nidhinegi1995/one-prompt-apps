import { useEffect, useRef, useState } from 'react';
import TaskCard from './TaskCard.jsx';
import { DRAG_TYPE } from '../constants.js';

/** The first card whose vertical midpoint is below the cursor: the drop goes right before it. */
function cardIdBelow(list, y) {
  const cards = [...list.querySelectorAll('.card:not(.dragging)')];
  const below = cards.find((card) => {
    const rect = card.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  });
  return below ? below.dataset.id : null;
}

export default function Column({
  column, prev, next, total, todos, draggedId,
  onDragStart, onDragEnd, onMove, onAdd, onEdit, onTagClick,
}) {
  const listRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (!draggedId) setIsOver(false);
  }, [draggedId]);

  function handleDragOver(e) {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false);
  }

  function handleDrop(e) {
    const id = e.dataTransfer.getData(DRAG_TYPE);
    if (!id) return;
    e.preventDefault();
    setIsOver(false);
    onMove(id, column.id, cardIdBelow(listRef.current, e.clientY));
    // The dragged card may unmount (it moved columns), so its dragend can be lost.
    onDragEnd();
  }

  const count = todos.length === total ? `${total}` : `${todos.length} / ${total}`;

  // The whole column accepts drops (header and padding too), not just the card list.
  // Dropping above the first card (e.g. on the header) inserts at the top; below the last appends.
  return (
    <section
      className={`column column-${column.id}`}
      aria-label={column.title}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="column-header">
        <span className="dot" aria-hidden="true" />
        <h2>{column.title}</h2>
        <span className="count">{count}</span>
        <button
          type="button"
          className="icon-btn"
          title={`Add task to ${column.title}`}
          aria-label={`Add task to ${column.title}`}
          onClick={onAdd}
        >
          +
        </button>
      </header>

      <div ref={listRef} className={`card-list${isOver ? ' drag-over' : ''}`}>
        {todos.length > 0 ? (
          todos.map((todo) => (
            <TaskCard
              key={todo.id}
              todo={todo}
              prev={prev}
              next={next}
              isDragging={draggedId === todo.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onMove={onMove}
              onEdit={onEdit}
              onTagClick={onTagClick}
            />
          ))
        ) : (
          <p className="empty">{total ? 'No matching tasks' : 'Drop tasks here'}</p>
        )}
      </div>
    </section>
  );
}
