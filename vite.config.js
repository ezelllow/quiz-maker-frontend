import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep React in its own vendor chunk. React rarely changes, so
        // returning users keep it cached even after the app code is
        // redeployed — only the small app chunks need re-downloading.
        // (rolldown/Vite 8 expects manualChunks as a function.)
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
