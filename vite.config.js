import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: 'localhost', // Local development
        port: 5174,
        proxy: {
            '/v1': {
                target: 'https://api.lunest.app',
                changeOrigin: true,
                secure: true,
                logLevel: 'debug',
                // Handle connection errors gracefully
                onProxyReq: (proxyReq, req, res) => {
                    console.log(`[Vite Proxy] ${req.method} ${req.url} → https://api.lunest.app${req.url}`);
                },
                onProxyRes: (proxyRes, req, res) => {
                    console.log(`[Vite Proxy] ✅ ${proxyRes.statusCode} ${req.url}`);
                },
                onError: (err, req, res) => {
                    console.error(`[Vite Proxy Error] Failed to connect to backend:`, {
                        error: err.message,
                        code: err.code,
                        path: req.url,
                    });
                    res.writeHead(503, {
                        'Content-Type': 'application/json',
                    });
                    res.end(JSON.stringify({
                        error: 'Backend server is not responding',
                        details: err.message,
                        backend: 'https://api.lunest.app',
                        retryAfter: 5,
                    }));
                },
            },
        },
        // Increase timeout for slow networks
        middlewareMode: false,
        cors: {
            origin: '*',
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
            credentials: true,
        },
    },
})