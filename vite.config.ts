import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// Dev entry is app.html. Offline double-click file is root index.html (copied after build).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: {
    open: '/app.html',
  },
  build: {
    outDir: 'play',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./app.html', import.meta.url)),
    },
  },
  // keep rootDir referenced so tooling can resolve from package root
  root: rootDir,
})
