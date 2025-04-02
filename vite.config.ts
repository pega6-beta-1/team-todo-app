import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: '.',
    publicDir: 'public',
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: './index.html',
          archived: './archived.html',
          completed: './completed.html'
        }
      }
    },
    // Define environment variables to be exposed to the client
    define: {
      // Using Vite's preferred way for environment variables
      'process.env.OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY || '')
    }
  }
})
