const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function checkActualDates() {
  let connection;
  
  try {
    console.log('🔍 Checking actual check-in dates...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Check all check-in times
    const [checkinTimes] = await connection.execute(`
      SELECT 
        b.booking_id,
        b.first_name,
        b.last_name,
        b.checkin_time,
        b.status,
        DATE(b.checkin_time) as checkin_date,
        b.date as booking_date
      FROM bookings b
      WHERE b.checkin_time IS NOT NULL
      ORDER BY b.checkin_time DESC
    `);
    
    console.log('\n📅 Actual check-in dates:');
    if (checkinTimes.length > 0) {
      checkinTimes.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.first_name} ${booking.last_name}`);
        console.log(`     Check-in: ${booking.checkin_time} (${booking.checkin_date})`);
        console.log(`     Booking: ${booking.booking_date}`);
        console.log(`     Status: ${booking.status}`);
        console.log('');
      });
      
      // Get date range
      const earliest = new Date(Math.min(...checkinTimes.map(b => new Date(b.checkin_time))));
      const latest = new Date(Math.max(...checkinTimes.map(b => new Date(b.checkin_time))));
      
      console.log('📊 Date range summary:');
      console.log(`  Earliest check-in: ${earliest.toISOString()}`);
      console.log(`  Latest check-in: ${latest.toISOString()}`);
      console.log(`  Date range: ${earliest.toDateString()} to ${latest.toDateString()}`);
      
      // Test with this date range
      const [testQuery] = await connection.execute(`
        SELECT 
          COUNT(*) as total_visitors,
          COUNT(DISTINCT DATE(b.checkin_time)) as unique_days,
          AVG(b.total_visitors) as avg_visitors_per_booking
        FROM visitors v
        LEFT JOIN bookings b ON v.booking_id = b.booking_id
        WHERE b.checkin_time BETWEEN ? AND ? 
        AND b.status = 'checked-in'
      `, [earliest.toISOString(), latest.toISOString()]);
      
      console.log('\n✅ Test query with actual date range:');
      console.log(testQuery[0]);
      
    } else {
      console.log('  ❌ No check-in times found');
    }
    
  } catch (error) {
    console.error('❌ Error checking dates:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkActualDates(); 