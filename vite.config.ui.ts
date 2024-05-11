import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react() // Supports React fast refresh and JSX transformation
  ],
  base: '/', // Use root in development
  server: {
    port: 3000 // Dedicated port for the UI development server
  },
  build: {
    outDir: resolve(__dirname, 'dist/renderer'), // Separate output directory
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html') // Only the renderer entry
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer') // Specific alias for renderer
    }
  }
});
