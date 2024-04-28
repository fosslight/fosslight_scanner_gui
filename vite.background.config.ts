import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/background'),
  build: {
    outDir: resolve(__dirname, 'out/background'),
    emptyOutDir: true
    // Specific settings for the background build, such as plugins and optimizations
  }
});
