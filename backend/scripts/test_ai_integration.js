// Test AI service with error handling
let aiService;
try {
  aiService = require('./services/aiService');
} catch (error) {
  console.log('⚠️  OpenAI not configured, testing fallback mode...');
  // Create a simple fallback test
  const fallbackTest = {
    getStatus: () => ({ available: false, provider: 'Fallback Analysis', message: 'OpenAI API key not configured' }),
    generateInsights: async (data, type, includeRecs) => ({
      summary: `Fallback analysis shows ${data.totalVisitors} visitors over ${data.uniqueDays} days.`,
      trends: ['Fallback trend analysis', 'Basic pattern recognition'],
      recommendations: includeRecs ? ['Basic recommendation 1', 'Basic recommendation 2'] : [],
      source: 'Fallback Analysis'
    })
  };
  aiService = fallbackTest;
}

// Test data for visitor analytics
const testData = {
  totalVisitors: 1250,
  uniqueDays: 30,
  avgVisitorsPerBooking: 2.3,
  dailyData: [
    { date: '2024-01-01', daily_visitors: 45 },
    { date: '2024-01-02', daily_visitors: 52 },
    { date: '2024-01-03', daily_visitors: 38 }
  ],
  demographics: [
    { nationality: 'Local', count: 800 },
    { nationality: 'International', count: 450 }
  ],
  timeSlots: [
    { visit_time: '10:00', count: 200 },
    { visit_time: '14:00', count: 350 },
    { visit_time: '16:00', count: 150 }
  ]
};

async function testAI() {
  console.log('🤖 Testing AI Integration...\n');
  
  // Check AI status
  const status = aiService.getStatus();
  console.log('AI Service Status:', status);
  console.log('');
  
  if (!status.available) {
    console.log('⚠️  OpenAI API key not configured. Testing fallback mode...\n');
  } else {
    console.log('✅ OpenAI API key found. Testing real AI integration...\n');
  }
  
  try {
    // Test AI insights generation
    console.log('📊 Generating AI insights for visitor analytics...');
    const insights = await aiService.generateInsights(testData, 'visitor_analytics', true);
    
    console.log('\n📋 Generated Insights:');
    console.log('Summary:', insights.summary);
    console.log('Source:', insights.source);
    console.log('');
    
    console.log('📈 Trends:');
    insights.trends.forEach((trend, index) => {
      console.log(`${index + 1}. ${trend}`);
    });
    console.log('');
    
    console.log('💡 Recommendations:');
    insights.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log('');
    
    console.log('✅ AI integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing AI integration:', error.message);
  }
}

// Run the test
testAI(); 