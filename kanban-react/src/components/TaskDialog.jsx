import { useEffect, useRef, useState } from 'react';
import { COLUMNS, PRIORITIES } from '../constants.js';
import { parseTags } from '../utils.js';

function initialValues(todo, defaultStatus) {
  if (todo) {
    return {
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      status: todo.status,
      tags: todo.tags.join(', '),
    };
  }
  return { title: '', description: '', priority: 'medium', status: defaultStatus, tags: '' };
}

/** Add/edit form in a native modal <dialog>. Mounted only while open. */
export default function TaskDialog({ todo, defaultStatus, onSave, onDelete, onClose }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(todo, defaultStatus));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    titleRef.current.focus();
  }, []);

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const title = values.title.trim();
    if (!title) {
      // Whitespace-only: clear the DOM value now (state updates are async) so the
      // browser's "required" message shows.
      setValues((v) => ({ ...v, title: '' }));
      titleRef.current.value = '';
      titleRef.current.reportValidity();
      titleRef.current.focus();
      return;
    }
    onSave({
      title,
      description: values.description.trim(),
      priority: values.priority,
      status: values.status,
      tags: parseTags(values.tags),
    });
  }

  function handleDelete() {
    if (confirm(`Delete "${todo.title}"?`)) onDelete(todo.id);
  }

  // Clicking the dimmed backdrop (outside the dialog box) closes it. Both press and release must be
  // on the backdrop (so drag-selecting text out of a field doesn't close), and the extra clicks of a
  // double-click (e.g. the one that opened this dialog) are ignored.
  const pressedBackdrop = useRef(false);

  function isBackdrop(e) {
    if (e.target !== dialogRef.current) return false;
    const r = dialogRef.current.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  }

  function handleMouseDown(e) {
    pressedBackdrop.current = isBackdrop(e);
  }

  function handleClick(e) {
    const wasPressed = pressedBackdrop.current;
    pressedBackdrop.current = false;
    if (wasPressed && e.detail <= 1 && isBackdrop(e)) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onClose={onClose}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <form onSubmit={handleSubmit}>
        <h2 id="dialog-title">{todo ? 'Edit task' : 'New task'}</h2>

        <label>
          Title
          <input ref={titleRef} required maxLength={120} autoComplete="off" value={values.title} onChange={set('title')} />
        </label>

        <label>
          Description
          <textarea rows={4} value={values.description} onChange={set('description')} />
        </label>

        <div className="row">
          <label>
            Priority
            <select value={values.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={values.status} onChange={set('status')}>
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Tags
          <input placeholder="e.g. frontend, bug, urgent" autoComplete="off" value={values.tags} onChange={set('tags')} />
          <small>Separate tags with commas</small>
        </label>

        <div className="dialog-actions">
          {todo && (
            <button type="button" className="btn danger" onClick={handleDelete}>Delete</button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">Save</button>
        </div>
      </form>
    </dialog>
  );
}
