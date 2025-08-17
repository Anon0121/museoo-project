const mysql = require('mysql2/promise');

const fixEventRegistrationDatabase = async () => {
  let connection;
  
  try {
    console.log('🔧 Fixing Event Registration Database Structure...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });
    
    console.log('✅ Connected to database');
    
    // Check and fix event_details table
    console.log('\n📋 Checking event_details table...');
    const [eventDetailsStructure] = await connection.execute('DESCRIBE event_details');
    
    const hasMaxCapacity = eventDetailsStructure.some(row => row.Field === 'max_capacity');
    const hasCurrentRegistrations = eventDetailsStructure.some(row => row.Field === 'current_registrations');
    
    if (!hasMaxCapacity) {
      console.log('🔧 Adding max_capacity column to event_details...');
      await connection.execute('ALTER TABLE event_details ADD COLUMN max_capacity INT DEFAULT 50');
      console.log('✅ Added max_capacity column');
    } else {
      console.log('✅ max_capacity column already exists');
    }
    
    if (!hasCurrentRegistrations) {
      console.log('🔧 Adding current_registrations column to event_details...');
      await connection.execute('ALTER TABLE event_details ADD COLUMN current_registrations INT DEFAULT 0');
      console.log('✅ Added current_registrations column');
    } else {
      console.log('✅ current_registrations column already exists');
    }
    
    // Check and fix event_registrations table
    console.log('\n📋 Checking event_registrations table...');
    const [eventRegistrationsStructure] = await connection.execute('DESCRIBE event_registrations');
    
    const requiredColumns = [
      { name: 'id', type: 'int(11)', null: 'NOT NULL', extra: 'AUTO_INCREMENT PRIMARY KEY' },
      { name: 'event_id', type: 'int(11)', null: 'NOT NULL' },
      { name: 'full_name', type: 'varchar(255)', null: 'NOT NULL' },
      { name: 'email', type: 'varchar(255)', null: 'NOT NULL' },
      { name: 'contact_number', type: 'varchar(50)', null: 'NULL' },
      { name: 'institution', type: 'varchar(255)', null: 'NULL' },
      { name: 'registration_date', type: 'timestamp', null: 'NOT NULL', default: 'CURRENT_TIMESTAMP' },
      { name: 'status', type: "enum('registered','checked_in','cancelled')", null: 'NULL', default: 'registered' },
      { name: 'qr_code', type: 'varchar(255)', null: 'NULL' },
      { name: 'checkin_time', type: 'timestamp', null: 'NULL' }
    ];
    
    for (const column of requiredColumns) {
      const exists = eventRegistrationsStructure.some(row => row.Field === column.name);
      if (!exists) {
        console.log(`🔧 Adding ${column.name} column to event_registrations...`);
        let alterQuery = `ALTER TABLE event_registrations ADD COLUMN ${column.name} ${column.type}`;
        if (column.null === 'NOT NULL') {
          alterQuery += ' NOT NULL';
        }
        if (column.default) {
          alterQuery += ` DEFAULT ${column.default}`;
        }
        await connection.execute(alterQuery);
        console.log(`✅ Added ${column.name} column`);
      } else {
        console.log(`✅ ${column.name} column already exists`);
      }
    }
    
    // Check and create indexes
    console.log('\n📋 Checking indexes...');
    try {
      const [indexes] = await connection.execute('SHOW INDEX FROM event_registrations');
      const existingIndexes = indexes.map(index => index.Key_name);
      
      const requiredIndexes = [
        { name: 'idx_event_registrations_event_id', column: 'event_id' },
        { name: 'idx_event_registrations_email', column: 'email' },
        { name: 'idx_event_registrations_status', column: 'status' }
      ];
      
      for (const index of requiredIndexes) {
        if (!existingIndexes.includes(index.name)) {
          console.log(`🔧 Creating index ${index.name}...`);
          await connection.execute(`CREATE INDEX ${index.name} ON event_registrations(${index.column})`);
          console.log(`✅ Created index ${index.name}`);
        } else {
          console.log(`✅ Index ${index.name} already exists`);
        }
      }
    } catch (error) {
      console.log('❌ Error checking indexes:', error.message);
    }
    
    // Show final structure
    console.log('\n📋 Final event_registrations table structure:');
    const [finalStructure] = await connection.execute('DESCRIBE event_registrations');
    finalStructure.forEach(row => {
      console.log(`   • ${row.Field} - ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });
    
    console.log('\n📋 Final event_details table structure:');
    const [finalEventDetailsStructure] = await connection.execute('DESCRIBE event_details');
    finalEventDetailsStructure.forEach(row => {
      console.log(`   • ${row.Field} - ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });
    
    console.log('\n✅ Event Registration Database Structure Fixed Successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database structure:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

if (require.main === module) {
  fixEventRegistrationDatabase();
}

module.exports = fixEventRegistrationDatabase;

