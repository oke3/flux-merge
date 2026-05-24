import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets are loaded correctly from GitHub Pages
  test: {
    environment: 'jsdom',
    exclude: ['**/tests/**', '**/node_modules/**'],
  },
});
