const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function testVisitorQuery() {
  let connection;
  
  try {
    console.log('🔍 Testing visitor analytics query...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Test date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`\n📅 Testing date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Test the exact query from the reports
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
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    console.log('\n📊 Query results:');
    console.log('Total rows returned:', visitors.length);
    
    if (visitors.length > 0) {
      visitors.forEach((visitor, index) => {
        console.log(`  Row ${index + 1}:`, visitor);
      });
    } else {
      console.log('  ❌ No results found');
    }
    
    // Check what check-in times actually exist
    const [checkinTimes] = await connection.execute(`
      SELECT 
        b.booking_id,
        b.first_name,
        b.last_name,
        b.checkin_time,
        b.status,
        b.date
      FROM bookings b
      WHERE b.checkin_time IS NOT NULL
      ORDER BY b.checkin_time DESC
    `);
    
    console.log('\n🔍 Actual check-in times in database:');
    if (checkinTimes.length > 0) {
      checkinTimes.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.first_name} ${booking.last_name} - ${booking.checkin_time} (${booking.status})`);
      });
    } else {
      console.log('  ❌ No check-in times found');
    }
    
    // Test without date filter
    const [allVisitors] = await connection.execute(`
      SELECT 
        COUNT(*) as total_visitors,
        COUNT(DISTINCT DATE(b.checkin_time)) as unique_days,
        AVG(b.total_visitors) as avg_visitors_per_booking
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.status = 'checked-in'
    `);
    
    console.log('\n📊 All checked-in visitors (no date filter):');
    console.log(allVisitors[0]);
    
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
testVisitorQuery(); 