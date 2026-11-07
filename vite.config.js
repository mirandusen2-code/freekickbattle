import { referenceVideoService } from './scripts/reference-video-service.mjs';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { createVideoImportService } from './scripts/video-import-service.mjs';

function videoImportPlugin() {
  function configure(server) { const service = createVideoImportService({ root: server.config.root }); server.middlewares.use(referenceVideoService(server.config.root)); server.middlewares.use(service.handler); server.httpServer?.once('close', () => service.close()); }
  return { name: 'local-video-import', configureServer: configure, configurePreviewServer: configure };
}

export default defineConfig({
  plugins: [videoImportPlugin()],
  server: { watch: { ignored: ['**/research/**', '**/artifacts/**'] } },
  build: {
    rollupOptions: {
      input: { game: resolve(import.meta.dirname, 'index.html'), lab: resolve(import.meta.dirname, 'lab.html'), references: resolve(import.meta.dirname, 'reference.html'), analyze: resolve(import.meta.dirname, 'analyze.html'), review: resolve(import.meta.dirname, 'review.html') },
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
