const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function checkVisitors() {
  let connection;
  
  try {
    console.log('🔍 Checking visitor data...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Check if visitors table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "visitors"');
    
    if (tables.length === 0) {
      console.log('❌ visitors table does not exist');
      return;
    }
    
    console.log('✅ visitors table exists');
    
    // Check table structure
    const [structure] = await connection.execute('DESCRIBE visitors');
    console.log('\n📋 visitors table structure:');
    structure.forEach(field => {
      console.log(`  - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check visitor count
    const [visitorCount] = await connection.execute('SELECT COUNT(*) as count FROM visitors');
    console.log(`\n📊 Total visitors: ${visitorCount[0].count}`);
    
    if (visitorCount[0].count > 0) {
      // Show sample visitors
      const [visitors] = await connection.execute(`
        SELECT visitor_ID, first_name, last_name, nationality, email, status, created_at 
        FROM visitors 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n👥 Recent visitors:');
      visitors.forEach((visitor, index) => {
        console.log(`  ${index + 1}. ${visitor.first_name} ${visitor.last_name} (${visitor.nationality}) - Status: ${visitor.status || 'Unknown'}`);
      });
    } else {
      console.log('\n❌ No visitors found in database');
    }
    
    // Check bookings table
    const [bookingTables] = await connection.execute('SHOW TABLES LIKE "bookings"');
    
    if (bookingTables.length > 0) {
      const [bookingCount] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
      console.log(`\n📅 Total bookings: ${bookingCount[0].count}`);
      
      if (bookingCount[0].count > 0) {
        const [bookings] = await connection.execute(`
          SELECT booking_ID, visitor_ID, booking_date, time_slot, status 
          FROM bookings 
          ORDER BY booking_date DESC 
          LIMIT 5
        `);
        
        console.log('\n📋 Recent bookings:');
        bookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. Booking ${booking.booking_ID} - Visitor ${booking.visitor_ID} - ${booking.booking_date} ${booking.time_slot} (${booking.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking visitors:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkVisitors(); 