const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating self-signed SSL certificates for HTTPS development...');

try {
  // Generate private key
  execSync('openssl genrsa -out localhost-key.pem 2048', { stdio: 'inherit' });
  
  // Generate certificate
  execSync('openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
  
  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Files created:');
  console.log('   - localhost-key.pem (private key)');
  console.log('   - localhost.pem (certificate)');
  console.log('');
  console.log('🚀 You can now start your development server with HTTPS!');
  console.log('📱 Access your site via: https://YOUR_IP:5173');
  
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('');
  console.log('🔧 Alternative: Use mkcert (easier setup)');
  console.log('1. Install mkcert: https://github.com/FiloSottile/mkcert');
  console.log('2. Run: mkcert -install');
  console.log('3. Run: mkcert localhost 127.0.0.1 ::1');
} 