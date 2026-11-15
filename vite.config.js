import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { clientsClaim: true, skipWaiting: true },
      devOptions: { enabled: true },
      manifest: {
        name: 'TGI Ascenseurs Casa',
        short_name: 'TGI Manager',
        description: 'Application de gestion pour TGI Ascenseurs',
        theme_color: '#4682B4',
        background_color: '#f4f7f9',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    })
  ]
})