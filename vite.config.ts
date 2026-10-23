import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // exposes on 0.0.0.0 so phones/tablets on local Wi-Fi can connect
    port: 3000,
    open: false
  }
});
