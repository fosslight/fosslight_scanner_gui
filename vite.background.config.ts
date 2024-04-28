import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/background'),
  build: {
    outDir: resolve(__dirname, 'out/background'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        hidden: resolve(__dirname, 'src/background/index.html')
      }
    }
  },
  server: {
    port: 3000
  }
});
