const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function checkBookingsStructure() {
  let connection;
  
  try {
    console.log('🔍 Checking bookings table structure...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Check if bookings table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "bookings"');
    
    if (tables.length === 0) {
      console.log('❌ bookings table does not exist');
      return;
    }
    
    console.log('✅ bookings table exists');
    
    // Check table structure
    const [structure] = await connection.execute('DESCRIBE bookings');
    console.log('\n📋 bookings table structure:');
    structure.forEach(field => {
      console.log(`  - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check booking count
    const [bookingCount] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
    console.log(`\n📊 Total bookings: ${bookingCount[0].count}`);
    
    if (bookingCount[0].count > 0) {
      // Show sample bookings with all columns
      const [bookings] = await connection.execute(`
        SELECT * FROM bookings ORDER BY created_at DESC LIMIT 3
      `);
      
      console.log('\n📋 Sample bookings:');
      bookings.forEach((booking, index) => {
        console.log(`\n  Booking ${index + 1}:`);
        Object.keys(booking).forEach(key => {
          console.log(`    ${key}: ${booking[key]}`);
        });
      });
    }
    
    // Check for check-in related columns
    const checkinColumns = structure.filter(field => 
      field.Field.toLowerCase().includes('check') || 
      field.Field.toLowerCase().includes('in') ||
      field.Field.toLowerCase().includes('time') ||
      field.Field.toLowerCase().includes('scan')
    );
    
    if (checkinColumns.length > 0) {
      console.log('\n🔍 Check-in related columns found:');
      checkinColumns.forEach(field => {
        console.log(`  - ${field.Field}: ${field.Type}`);
      });
    } else {
      console.log('\n❌ No check-in related columns found');
    }
    
  } catch (error) {
    console.error('❌ Error checking bookings:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkBookingsStructure(); 