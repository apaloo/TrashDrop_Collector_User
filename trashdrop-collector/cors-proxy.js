// Simple CORS proxy for local development
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8095;

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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Pipe the request data to the proxy request
  req.pipe(proxyReq, { end: true });
}).listen(PORT, () => {
  console.log(`CORS proxy server running on http://localhost:${PORT}`);
});
