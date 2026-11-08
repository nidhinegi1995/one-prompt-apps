import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this app from /<repo>/kanban-react/; locally it's served from /.
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5173,
  },
});
