import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { builtinModules } from 'module';

export default defineConfig(({ command }) => ({
  plugins: [
    react() // Enables React support
  ],
  base: command === 'build' ? './' : '/', // Base path for production build
  // server: {
  //   port: 3000, // Define the port for the dev server
  //   strictPort: true, // Fail if port is already in use
  //   hmr: {
  //     // HMR specific configuration
  //     protocol: 'ws', // WebSocket for HMR notifications
  //     host: 'localhost',
  //     port: 3000, // Match the server port
  //     clientPort: 3000 // Use when behind a proxy
  //   }
  // },
  build: {
    outDir: resolve(__dirname, 'dist'), // Output directory
    emptyOutDir: true, // Clear output directory before building
    rollupOptions: {
      input: {
        // Define entry points relative to the src directory
        main: resolve(__dirname, 'src/main/index.ts'), // Main process
        preloadVisible: resolve(__dirname, 'src/preload/visible.ts'), // Preload script for visible renderer
        preloadHidden: resolve(__dirname, 'src/preload/hidden.ts'), // Preload script for hidden renderer
        renderer: resolve(__dirname, 'src/renderer/index.html'), // Renderer process (React)
        background: resolve(__dirname, 'src/background/index.html') // Background process
      },
      external: ['electron', 'path', 'fs', 'os', ...builtinModules],
      output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: (chunkInfo): string => {
          const name = chunkInfo.name;
          switch (name) {
            case 'main':
              return 'main/index.js';
            case 'preloadVisible':
              return 'preload/visible.mjs';
            case 'preloadHidden':
              return 'preload/hidden.mjs';
            case 'renderer':
              return 'renderer/index.js';
            case 'background':
              return 'background/index.js';
            default:
              return '[name]/bundle.js';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      // Simplify module resolution
      '@': resolve(__dirname, 'src'),
      '@main': resolve(__dirname, 'src/main'),
      '@preload': resolve(__dirname, 'src/preload'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@background': resolve(__dirname, 'src/background/src')
    }
  }
}));
