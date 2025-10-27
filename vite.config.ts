import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      // Vite requires VITE_ prefix for client-side env vars
      'import.meta.env.VITE_GHL_CLIENT_ID': JSON.stringify(env.VITE_GHL_CLIENT_ID || env.GHL_CLIENT_ID || '68fd461dc407410f0f0c0cb1-mh6umpou'),
      'import.meta.env.VITE_GHL_CLIENT_SECRET': JSON.stringify(env.VITE_GHL_CLIENT_SECRET || env.GHL_CLIENT_SECRET || 'a7a79a21-828d-4744-b1a3-c13158773c92'),
      'import.meta.env.VITE_GHL_SHARED_SECRET': JSON.stringify(env.VITE_GHL_SHARED_SECRET || env.GHL_SHARED_SECRET || '0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a'),
    }
  }
})


