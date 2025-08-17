const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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

    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'add_checkin_time.sql'), 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        await connection.execute(statement);
      }
    }

    console.log('Migration completed successfully!');
    
    // Verify the column was added
    const [columns] = await connection.execute('DESCRIBE bookings');
    console.log('\nCurrent bookings table structure:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration(); 