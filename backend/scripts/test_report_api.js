const axios = require('axios');

async function testReportAPI() {
  try {
    console.log('🔍 Testing report generation API...');
    
    // Test data
    const reportData = {
      reportType: 'visitor_analytics',
      startDate: '2025-07-01',
      endDate: '2025-08-31',
      includeCharts: true,
      includeRecommendations: true,
      includePredictions: true,
      includeComparisons: true
    };
    
    console.log('📊 Test data:', reportData);
    
    // Make API call
    const response = await axios.post('http://localhost:3000/api/reports/generate', reportData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testReportAPI(); 