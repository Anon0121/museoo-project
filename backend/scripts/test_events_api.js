const axios = require('axios');

async function testEventsAPI() {
  try {
    console.log('🔍 Testing Events API endpoint...');
    
    const response = await axios.get('http://localhost:3000/api/activities/events');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Events returned:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('\n📅 Events found:');
      response.data.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}`);
        console.log(`     Date: ${event.start_date}`);
        console.log(`     Time: ${event.time}`);
        console.log(`     Location: ${event.location}`);
        console.log(`     Organizer: ${event.organizer}`);
        console.log('');
      });
    } else {
      console.log('❌ No events returned from API');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEventsAPI(); 