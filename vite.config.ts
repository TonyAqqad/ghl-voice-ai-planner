import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        // Allow TypeScript errors to not block builds
        include: "**/*.{jsx,tsx}",
      })
    ],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Disable sourcemaps for production to speed up build
      emptyOutDir: true, // Clear dist folder before building
      minify: 'esbuild', // Use esbuild (built-in, faster than terser)
      chunkSizeWarningLimit: 1000
    },
    define: {
      // Vite requires VITE_ prefix for client-side env vars
      // SECURITY: Never hardcode secrets - use environment variables only!
      // Set these in Render Dashboard or .env file (never commit .env)
      'import.meta.env.VITE_GHL_CLIENT_ID': JSON.stringify(env.VITE_GHL_CLIENT_ID || env.GHL_CLIENT_ID || ''),
      'import.meta.env.VITE_GHL_CLIENT_SECRET': JSON.stringify(env.VITE_GHL_CLIENT_SECRET || env.GHL_CLIENT_SECRET || ''),
      'import.meta.env.VITE_GHL_SHARED_SECRET': JSON.stringify(env.VITE_GHL_SHARED_SECRET || env.GHL_SHARED_SECRET || ''),
      'import.meta.env.VITE_ELEVENLABS_API_KEY': JSON.stringify(env.VITE_ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY || ''),
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY || ''),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'https://ghlvoiceai.captureclient.com'),
    }
  }
})


