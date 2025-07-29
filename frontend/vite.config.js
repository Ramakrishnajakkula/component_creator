import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { parse } from 'postcss';

// https://vite.dev/config/
// vite.config.js
// vite.config.js
export default {
  server: {
    hmr: {
      host: 'component-creator-1.onrender.com',
      protocol: 'wss',
      port: 443
    }
  },
  plugins: [react()],
};


