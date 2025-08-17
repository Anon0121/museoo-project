const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function setupPermissions() {
  let connection;
  
  try {
    console.log('🔧 Setting up user permissions system...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read and execute the permissions SQL file
    const sqlFile = path.join(__dirname, 'add_user_permissions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📝 Executing SQL statements...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (err) {
          if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Skipped (already exists):', statement.substring(0, 50) + '...');
          } else {
            console.log('❌ Error executing:', statement.substring(0, 50) + '...');
            console.log('Error:', err.message);
          }
        }
      }
    }
    
    // Verify the setup
    console.log('\n📋 Verifying setup...');
    
    // Check user_permissions table
    const [permissionsTable] = await connection.execute('DESCRIBE user_permissions');
    console.log('✅ user_permissions table structure:');
    permissionsTable.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    // Check system_user table for permissions column
    const [userTable] = await connection.execute('DESCRIBE system_user');
    const permissionsColumn = userTable.find(col => col.Field === 'permissions');
    if (permissionsColumn) {
      console.log('✅ permissions column found in system_user table');
    } else {
      console.log('❌ permissions column not found');
    }
    
    // Show existing users and their permissions
    const [users] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, role, permissions
      FROM system_user
      ORDER BY user_ID
    `);
    
    console.log('\n📋 Current users and their permissions:');
    users.forEach(user => {
      const permissions = user.permissions ? JSON.parse(user.permissions) : 'No permissions set';
      console.log(`  - ${user.username} (${user.firstname} ${user.lastname}) - ${user.role}`);
      console.log(`    Permissions: ${JSON.stringify(permissions)}`);
    });
    
    console.log('\n✅ User permissions system setup completed successfully!');
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test creating a new user with permissions');
    console.log('3. Check that staff users only see allowed features');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
setupPermissions(); 