import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This allows the code to access process.env.API_KEY in the browser
      // after Netlify injects it during the build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});