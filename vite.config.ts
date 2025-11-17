import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Allow Replit preview domains to connect in dev
    allowedHosts: [
      "hr-evaluation-system-superpowerss.replit.app",
      ".replit.app",
      ".repl.co",
    ],
    proxy: {
      '/api': {
        target: 'https://hr-eval-sys.vercel.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  // Configure preview host checks for hosted environments (Replit)
  preview: {
    host: '0.0.0.0',
    // Port is overridden by CLI (--port $PORT) in scripts/preview.mjs
    allowedHosts: [
      "hr-evaluation-system-superpowerss.replit.app",
      ".replit.app",
      ".repl.co",
    ],
  },
  plugins: [
    react(),
    // Removed: mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
