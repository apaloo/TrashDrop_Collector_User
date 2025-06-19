/**
 * TrashDrop Collector - CORS Proxy for Local Development
 * Simple proxy server to bypass CORS restrictions during development
 */

const http = require('http');
const https = require('https');
const url = require('url');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Get configuration from environment variables or use defaults
const PORT = process.env.PROXY_PORT || process.env.PORT || 8095;
const HOST = process.env.PROXY_HOST || 'localhost';
const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || '*';
const ALLOWED_METHODS = process.env.CORS_ALLOWED_METHODS || 'GET, POST, PUT, DELETE, OPTIONS';
const ALLOWED_HEADERS = process.env.CORS_ALLOWED_HEADERS || '*';

http.createServer((req, res) => {
  const requestUrl = req.url.substring(1); // Remove leading slash
  
  if (!requestUrl || requestUrl === 'favicon.ico') {
    res.writeHead(404);
    res.end();
    return;
  }
  
  console.log(`Proxying request to: ${requestUrl}`);
  
  // Parse the URL
  const parsedUrl = url.parse(requestUrl);
  
  // Set up the options for the proxy request
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedUrl.hostname
    }
  };
  
  // Delete headers that would cause issues
  delete options.headers['host'];
  
  // Create the proxy request
  const proxyReq = https.request(options, (proxyRes) => {
    // Set CORS headers from environment variables
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    
    // Set response headers from the proxied response
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Set the status code
    res.writeHead(proxyRes.statusCode);
    
    // Pipe the proxied response to our response
    proxyRes.pipe(res, { end: true });
  });
  
  // Handle errors
  proxyReq.on('error', (err) => {
    console.error(`Proxy error: ${err.message}`);
    res.writeHead(500);
    res.end(`Proxy error: ${err.message}`);
  });
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Pipe the request data to the proxy request
  req.pipe(proxyReq, { end: true });
}).listen(PORT, HOST, () => {
  console.log(`✅ CORS proxy server running on http://${HOST}:${PORT}`);
  console.log(`📡 Ready to proxy requests for API development`);
});
