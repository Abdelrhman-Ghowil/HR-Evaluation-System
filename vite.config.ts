import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5001,
    // Allow Replit preview domains to connect in dev
    allowedHosts: [
      "hr-evaluation-system-superpowerss.replit.app",
      ".replit.app",
      ".repl.co",
      ".replit.dev",
      ".spock.replit.dev",
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
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5001,
    allowedHosts: [
      "hr-evaluation-system-superpowerss.replit.app",
      ".replit.app",
      ".repl.co",
      ".replit.dev",
      ".spock.replit.dev",
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
