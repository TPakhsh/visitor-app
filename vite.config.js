// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // معادل --host (0.0.0.0) -> از LAN قابل دسترسی می‌شود
    port: 5173,        // در صورت نیاز عوض کن
    strictPort: true,  // اگر پورت گرفته بود خطا بده تا متوجه شوی
    cors: true,
    // در برخی شبکه‌ها/فایروال‌ها کمک می‌کند که HMR پایدار شود:
    // hmr: { host: 'YOUR_LAN_IP', protocol: 'ws', port: 5173 },
  },
})
