/**
 * Maximo Proxy Server
 * 
 * Author: Markus van Kempen
 * Date: 3 Feb 2026
 * 
 * Description: An Express.js proxy server to bypass CORS and forward requests to the Maximo API.
 * It also serves the static frontend files.
 */
require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration from environment variables
const API_TARGET = process.env.MAXIMO_HOST || 'https://your-maximo-host.com';

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 1. Proxy API Requests
// Forward all requests starting with /maximo to the external API
app.use('/maximo', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true, // Necessary for the target server to believe the request is coming from itself
    secure: false,      // Disable SSL verification (like curl -k) to avoid self-signed cert errors
    logLevel: 'debug',  // Log proxy events
    onProxyRes: function (proxyRes, req, res) {
        // Add CORS headers to the response to allow browser access if strictly needed
        // (Though serving static files from the same origin creates a same-origin context)
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
}));

// 2. Serve Static Files
// Serve files from the project root and subdirectories
app.use(express.static(path.join(__dirname)));
app.use('/demos', express.static(path.join(__dirname, 'demos')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Start Server
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Maximo App Proxy Server`);
    console.log(`==================================================`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Proxying /maximo -> ${API_TARGET}/maximo`);
    console.log(`\nDemo Apps:`);
    console.log(`  • Asset Manager: http://localhost:${PORT}/demos/assets.html`);
    console.log(`  • Work Orders:   http://localhost:${PORT}/demos/index.html`);
    console.log(`  • Carbon Table:  http://localhost:${PORT}/demos/carbon_workorders.html`);
    console.log(`\nPress Ctrl+C to stop.`);
});
