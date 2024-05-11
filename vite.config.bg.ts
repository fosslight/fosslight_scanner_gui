import { defineConfig } from 'vite';
import { resolve } from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  base: '/', // Base path, typically root for development
  server: {
    port: 3001 // Different port to avoid conflicts with the UI server
  },
  build: {
    outDir: resolve(__dirname, 'dist/background'), // Separate output directory for background
    rollupOptions: {
      input: {
        preloadVisible: resolve(__dirname, 'src/preload/visible.ts'),
        preloadHidden: resolve(__dirname, 'src/preload/hidden.ts'),
        background: resolve(__dirname, 'src/background/index.html')
      },
      external: ['electron', 'fs', 'path', ...builtinModules], // Ensure Node built-ins are external
      output: {
        format: 'esm', // Use ES Modules format
        entryFileNames: '[name]/index.mjs' // Use .mjs for clarity on ES Modules
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/background') // Specific alias for background components
    }
  }
});
