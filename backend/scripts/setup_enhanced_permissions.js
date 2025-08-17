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

async function setupEnhancedPermissions() {
  let connection;
  
  try {
    console.log('🔧 Setting up enhanced user permissions system...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read and execute the enhanced permissions SQL file
    const sqlFile = path.join(__dirname, 'enhance_permissions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📝 Executing enhanced permissions SQL statements...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (err) {
          if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Skipped (already exists):', statement.substring(0, 50) + '...');
          } else {
            console.log('❌ Error executing:', statement.substring(0, 50) + '...');
            console.log('Error:', err.message);
          }
        }
      }
    }
    
    // Verify the enhanced setup
    console.log('\n📋 Verifying enhanced setup...');
    
    // Check user_permissions table structure
    const [permissionsTable] = await connection.execute('DESCRIBE user_permissions');
    console.log('✅ Enhanced user_permissions table structure:');
    permissionsTable.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Show existing permissions with access levels
    const [permissions] = await connection.execute(`
      SELECT up.user_id, up.permission_name, up.is_allowed, up.access_level, 
             su.username, su.firstname, su.lastname, su.role
      FROM user_permissions up
      JOIN system_user su ON up.user_id = su.user_ID
      ORDER BY su.username, up.permission_name
    `);
    
    console.log('\n📋 Current user permissions with access levels:');
    let currentUser = '';
    permissions.forEach(perm => {
      if (perm.username !== currentUser) {
        currentUser = perm.username;
        console.log(`\n👤 ${perm.firstname} ${perm.lastname} (${perm.username}) - ${perm.role}:`);
      }
      const status = perm.is_allowed ? '✅' : '❌';
      const accessIcon = perm.access_level === 'view' ? '👁️' : 
                        perm.access_level === 'edit' ? '✏️' : 
                        perm.access_level === 'admin' ? '👑' : '🚫';
      console.log(`  ${status} ${accessIcon} ${perm.permission_name}: ${perm.access_level}`);
    });
    
    console.log('\n✅ Enhanced user permissions system setup completed successfully!');
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test creating a new user with access levels');
    console.log('3. Check that staff users have appropriate access levels');
    console.log('4. Verify view-only vs edit access in different sections');
    
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
setupEnhancedPermissions(); 