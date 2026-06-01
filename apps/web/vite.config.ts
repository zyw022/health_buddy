import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 本地路径别名
      '@': path.resolve(__dirname, './src'),
      // Workspace 包直接指向 src，不需要先 build
      '@health-buddy/shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types/src/index.ts',
      ),
    },
  },
});
