import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 gera um único index.html autocontido (para publicar/compartilhar)
export default defineConfig({
  plugins: process.env.SINGLEFILE ? [react(), viteSingleFile()] : [react()],
  base: './', // funciona em usuario.github.io/repositorio e em domínio próprio
  build: { chunkSizeWarningLimit: 3000 },
});
