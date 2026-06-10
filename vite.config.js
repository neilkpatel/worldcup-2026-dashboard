import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  // Relative base + singlefile inlines all JS/CSS into one index.html so the
  // built app runs straight from a file:// URL (double-click — no dev server).
  // Browsers block external ES-module scripts over file://; inlining avoids that.
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
})
