import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [
    react(),
    {
      ...copy({
        targets: [
          {
            src: 'config/platform-selectors.json',
            dest: 'dist/config'
          },
          {
            src: 'public/icons',
            dest: 'dist'
          }
        ],
        hook: 'writeBundle'
      }),
      enforce: 'post',
      apply: 'build'
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Place background and content scripts at root level
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return '[name].js';
          }
          return 'js/[name].js';
        },
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name?.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          // Place content.css at root css/ directory
          if (!assetInfo.name.includes('content')) {
              return 'css/[name][extname]';
          }
          return 'css/content.css';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
