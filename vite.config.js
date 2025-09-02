// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        id: '/',
        scope: '/',
        name: 'Visitor App',
        short_name: 'Visitor',
        description: 'ویزیتورها – React + Supabase',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2B2E4A',
        lang: 'fa',
        dir: 'rtl',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: { enabled: false }
    })
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true
  }
})
