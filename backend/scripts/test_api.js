const axios = require('axios');

// Test the login API
async function testLoginAPI() {
  console.log('🧪 Testing Login API...');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1️⃣ Testing server connection...');
    const healthCheck = await axios.get('http://localhost:3000/');
    console.log('✅ Server is running');
    console.log('Response:', healthCheck.data);
    
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Error:', error.message);
    return;
  }
  
  try {
    // Test 2: Test login with admin credentials
    console.log('\n2️⃣ Testing login with admin credentials...');
    const loginResponse = await axios.post('http://localhost:3000/api/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login API response:');
    console.log('Success:', loginResponse.data.success);
    console.log('Message:', loginResponse.data.message);
    
    if (loginResponse.data.success) {
      console.log('User data:', loginResponse.data.user);
    }
    
  } catch (error) {
    console.log('❌ Login API error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
  
  try {
    // Test 3: Test user endpoint (should fail without session)
    console.log('\n3️⃣ Testing user endpoint without session...');
    const userResponse = await axios.get('http://localhost:3000/api/user', {
      withCredentials: true
    });
    
    console.log('✅ User API response:', userResponse.data);
    
  } catch (error) {
    console.log('❌ User API error (expected without session):');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testLoginAPI(); 