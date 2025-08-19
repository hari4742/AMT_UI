import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/AMT_UI/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force @tonejs/midi to use a default-export-compatible flatten
      'array-flatten': path.resolve(
        __dirname,
        './src/vendor/array-flatten-default.ts'
      ),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
