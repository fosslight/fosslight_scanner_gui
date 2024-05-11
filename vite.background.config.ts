import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Base path for production build
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        hidden: resolve(__dirname, 'src/background/index.html')
      },
      output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: 'background/index.js'
      }
    }
  },
  server: {
    port: 3000, // Ensure Vite runs on port 3000 for the background process
    strictPort: true, // Makes Vite fail if port 3000 is already in use
    hmr: {
      protocol: 'ws', // Use WebSocket for HMR signaling
      host: 'localhost'
    }
  }
});
