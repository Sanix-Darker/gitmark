import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
        options: 'options.html',
        content: 'content.js',
        background: 'background.js'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep original names for entry files
          return `${chunkInfo.name}.js`
        },
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name].css'
          }
          return '[name].[ext]'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Disable minification for debugging
    sourcemap: true
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})