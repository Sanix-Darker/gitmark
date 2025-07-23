import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
        options: 'options.html',
        content: 'content.js',
        background: 'background.js',
        'content.css': 'content.css',  // Add CSS entries
        'options.css': 'options.css'   // Add CSS entries
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return `${chunkInfo.name}.js`
        },
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name].css';
          }
          return '[name].[ext]';
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: true,
      format: {
        comments: false,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
