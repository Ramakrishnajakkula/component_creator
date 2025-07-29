import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { parse } from 'postcss';

// https://vite.dev/config/
// vite.config.js
// vite.config.js
export default {
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 5173,
    allowedHosts: ['component-creator-1.onrender.com'],
  },
  plugins: [react()],
};


