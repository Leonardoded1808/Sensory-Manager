import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          includeAssets: ['favicon.ico', 'icon.svg'],
          manifest: {
            name: 'Sensory Manager',
            short_name: 'Sensory',
            description: 'Gestión de clínicas y especialistas',
            theme_color: '#ffffff',
            icons: [
               {
                 src: 'icon.svg',
                 sizes: '192x192',
                 type: 'image/svg+xml'
               },
               {
                 src: 'icon.svg',
                 sizes: '512x512',
                 type: 'image/svg+xml'
               }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
