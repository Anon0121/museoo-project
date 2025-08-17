const mysql = require('mysql2/promise');

async function addCheckinColumn() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update this if you have a password
      database: 'museosmart'
    });

    console.log('Connected to database');

    // Add the checkin_time column
    console.log('Adding checkin_time column to bookings table...');
    await connection.execute('ALTER TABLE bookings ADD COLUMN checkin_time TIMESTAMP NULL');
    
    console.log('✅ checkin_time column added successfully!');
    
    // Verify the column was added
    const [columns] = await connection.execute('DESCRIBE bookings');
    console.log('\n📋 Current bookings table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n🎉 Database migration completed successfully!');
    console.log('You can now scan QR codes without errors.');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  checkin_time column already exists. No action needed.');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCheckinColumn(); 