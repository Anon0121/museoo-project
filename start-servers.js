const { exec } = require('child_process');
const os = require('os');

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log('🚀 Starting Museoo servers...\n');
console.log('📱 To access on your phone, use these URLs:');
console.log(`   Frontend: http://${localIP}:5173`);
console.log(`   Backend:  http://${localIP}:3000`);
console.log('\n⚠️  Make sure your phone and computer are on the same WiFi network!\n');

// Start backend server
console.log('🔧 Starting backend server...');
const backendProcess = exec('cd backend && npm start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Backend error: ${error}`);
    return;
  }
  console.log(`Backend stdout: ${stdout}`);
  if (stderr) console.error(`Backend stderr: ${stderr}`);
});

backendProcess.stdout?.pipe(process.stdout);
backendProcess.stderr?.pipe(process.stderr);

// Wait a bit then start frontend
setTimeout(() => {
  console.log('🎨 Starting frontend server...');
  const frontendProcess = exec('cd Museoo && npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Frontend error: ${error}`);
      return;
    }
    console.log(`Frontend stdout: ${stdout}`);
    if (stderr) console.error(`Frontend stderr: ${stderr}`);
  });

  frontendProcess.stdout?.pipe(process.stdout);
  frontendProcess.stderr?.pipe(process.stderr);
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  backendProcess.kill();
  process.exit(0);
}); 