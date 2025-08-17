const https = require('https');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Create self-signed certificates
const { execSync } = require('child_process');

function generateCertificates() {
  try {
    // Check if certificates already exist
    if (fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
      console.log('✅ SSL certificates already exist');
      return;
    }

    console.log('🔐 Generating self-signed certificates...');
    
    // Generate private key
    execSync('openssl genrsa -out key.pem 2048', { stdio: 'inherit' });
    
    // Generate certificate
    execSync('openssl req -new -x509 -key key.pem -out cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Dev/CN=localhost"', { stdio: 'inherit' });
    
    console.log('✅ Certificates generated successfully!');
  } catch (error) {
    console.error('❌ Error generating certificates:', error.message);
    console.log('📝 Please install OpenSSL or use the manual method below');
    process.exit(1);
  }
}

// Generate certificates
generateCertificates();

// Proxy configuration
const proxyConfig = {
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'silent'
};

// Create proxy middleware
const proxy = createProxyMiddleware(proxyConfig);

// Use proxy for all routes
app.use('/', proxy);

// Get local IP address
const os = require('os');
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// Create HTTPS server
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, app);

server.listen(8443, '0.0.0.0', () => {
  console.log('🚀 HTTPS Proxy Server running!');
  console.log('');
  console.log('📱 Access your site on your phone:');
  console.log(`   https://${localIP}:8443`);
  console.log('');
  console.log('⚠️  Note: You may see a security warning on your phone.');
  console.log('   Click "Advanced" and "Proceed to site" to continue.');
  console.log('');
  console.log('🔐 This will allow camera access for QR scanning!');
});

// Handle WebSocket upgrades
server.on('upgrade', (request, socket, head) => {
  proxy.upgrade(request, socket, head);
}); 