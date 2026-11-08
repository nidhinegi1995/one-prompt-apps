# Kanban To-Do (React)

A to-do app with a Kanban board (To Do → In Progress → Completed), built with React and Vite.

## Run it locally

```bash
npm install      # first time only
npm run dev      # start the dev server
```

Then open http://localhost:5173.

Other commands:
- `npm run build`: builds the production version into `dist/`.
- `npm run preview`: serves that build locally.

## Features

- Tasks have a **title**, **description**, **priority** (High, Medium or Low) and **tags**.
- **Add tasks** with **+ New task**, the **+** on a column, or press **N**.
- **Edit** with ✎, a double-click, or Enter on a focused card. **Delete** from the edit window.
- **Move tasks** by dragging (between columns or within one) or with the ← → buttons.
- **Search**, filter by priority, or click a tag to show only tasks with that tag.
- Tasks are saved in the browser's localStorage and stay in sync across open tabs. If saving fails (e.g. storage is full or blocked), a banner warns you.
- **Theme toggle** (System → Light → Dark). Your choice is remembered. The colours use zinc greys with an indigo→violet accent, in the style of Linear, Vercel and shadcn/ui.

## Project structure

```
src/
  main.jsx              entry point: mounts <App /> and loads the styles
  App.jsx               page layout, filters, dialog state
  hooks/useTodos.js     task state, localStorage saving, add/update/delete/move
  hooks/useTheme.js     System/Light/Dark theme, remembered in localStorage
  components/
    Toolbar.jsx         title, search, priority filter, New task button
    Column.jsx          one board column, which accepts dropped cards
    TaskCard.jsx        one draggable task card
    TaskDialog.jsx      add/edit form
  constants.js          columns, priorities
  utils.js              id generation, tag parsing, filtering
  index.css             styles
```
