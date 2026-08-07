import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serve o projeto em /MEJ-AI-INTERFACE/, não na raiz do domínio.
  base: command === 'build' ? '/MEJ-AI-INTERFACE/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://projetopdi.atlab.ufc.br/api',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}))
