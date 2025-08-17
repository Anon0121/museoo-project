const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function testSimpleQuery() {
  let connection;
  
  try {
    console.log('🔍 Testing simple visitor query...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Test the exact query from the reports with a broad date range
    const startDate = '2025-07-01';
    const endDate = '2025-08-31';
    
    console.log(`\n📅 Testing date range: ${startDate} to ${endDate}`);
    
    const [visitors] = await connection.execute(`
      SELECT 
        COUNT(*) as total_visitors,
        COUNT(DISTINCT DATE(b.checkin_time)) as unique_days,
        AVG(b.total_visitors) as avg_visitors_per_booking,
        DATE(b.checkin_time) as date,
        COUNT(*) as daily_visitors
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.checkin_time BETWEEN ? AND ? 
      AND b.status = 'checked-in'
      GROUP BY DATE(b.checkin_time)
      ORDER BY date
    `, [startDate, endDate]);
    
    console.log('\n📊 Query results:');
    console.log('Total rows returned:', visitors.length);
    
    if (visitors.length > 0) {
      visitors.forEach((visitor, index) => {
        console.log(`  Row ${index + 1}:`, visitor);
      });
      
      // Calculate totals
      const totalVisitors = visitors.reduce((sum, v) => sum + (v.daily_visitors || 0), 0);
      const uniqueDays = visitors.length;
      const avgVisitorsPerBooking = visitors.length > 0 ? 
        visitors.reduce((sum, v) => sum + (v.avg_visitors_per_booking || 0), 0) / visitors.length : 0;
      
      console.log('\n📈 Summary:');
      console.log(`  Total Visitors: ${totalVisitors}`);
      console.log(`  Unique Days: ${uniqueDays}`);
      console.log(`  Avg Visitors per Booking: ${avgVisitorsPerBooking.toFixed(2)}`);
      
    } else {
      console.log('  ❌ No results found');
      
      // Try without date filter
      console.log('\n🔄 Trying without date filter...');
      const [allVisitors] = await connection.execute(`
        SELECT 
          COUNT(*) as total_visitors,
          COUNT(DISTINCT DATE(b.checkin_time)) as unique_days,
          AVG(b.total_visitors) as avg_visitors_per_booking
        FROM visitors v
        LEFT JOIN bookings b ON v.booking_id = b.booking_id
        WHERE b.status = 'checked-in'
      `);
      
      console.log('✅ Results without date filter:', allVisitors[0]);
    }
    
  } catch (error) {
    console.error('❌ Error testing query:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testSimpleQuery(); 