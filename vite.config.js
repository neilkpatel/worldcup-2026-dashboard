import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built app runs straight from a file:// URL
  // (double-click dist/index.html — no dev server needed).
  base: './',
  plugins: [react(), tailwindcss()],
})
