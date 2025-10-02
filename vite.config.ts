import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 꼭 프로젝트에 맞게 export
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api 로 들어온 걸 8080 dev-proxy로 보냄
      '/api': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true,
        // 그대로 전달 (이미 /api/seoul/trades 형태이므로 rewrite 불필요)
        // rewrite: (p) => p, // 생략 가능
      },
    },
  },
});
