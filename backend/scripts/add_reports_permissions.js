const mysql = require('mysql2/promise');
require('dotenv').config();

async function addReportsPermissions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Adding reports permissions to existing users...');
    
    // Get all users
    const [users] = await pool.query('SELECT user_ID, username, role FROM system_user');
    console.log(`📋 Found ${users.length} users to update`);
    
    for (const user of users) {
      console.log(`👤 Processing user: ${user.username} (${user.role})`);
      
      // Add reports permission to user_permissions table
      try {
        await pool.query(
          'INSERT IGNORE INTO user_permissions (user_id, permission_name, is_allowed, access_level) VALUES (?, ?, ?, ?)',
          [
            user.user_ID, 
            'reports', 
            user.role === 'admin' ? 1 : 0, // Admins get access, staff don't by default
            user.role === 'admin' ? 'edit' : 'none' // Admins get edit access, staff get none
          ]
        );
        console.log(`  ✅ Added reports permission for ${user.username}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  Reports permission already exists for ${user.username}`);
        } else {
          console.log(`  ❌ Error adding reports permission for ${user.username}:`, err.message);
        }
      }
      
      // Update user's permissions JSON if it exists
      try {
        const [userData] = await pool.query(
          'SELECT permissions FROM system_user WHERE user_ID = ?',
          [user.user_ID]
        );
        
        if (userData.length > 0 && userData[0].permissions) {
          let permissions = JSON.parse(userData[0].permissions);
          
          // Add reports permission
          permissions.reports = {
            allowed: user.role === 'admin',
            access: user.role === 'admin' ? 'edit' : 'none'
          };
          
          // Update the user's permissions
          await pool.query(
            'UPDATE system_user SET permissions = ? WHERE user_ID = ?',
            [JSON.stringify(permissions), user.user_ID]
          );
          console.log(`  ✅ Updated permissions JSON for ${user.username}`);
        } else {
          console.log(`  ⚠️  No permissions JSON found for ${user.username}`);
        }
      } catch (err) {
        console.log(`  ❌ Error updating permissions JSON for ${user.username}:`, err.message);
      }
    }
    
    // Verify the changes
    console.log('\n📋 Verifying reports permissions...');
    const [permissions] = await pool.query(`
      SELECT up.user_id, up.permission_name, up.is_allowed, up.access_level, 
             su.username, su.role
      FROM user_permissions up
      JOIN system_user su ON up.user_id = su.user_ID
      WHERE up.permission_name = 'reports'
      ORDER BY su.username
    `);
    
    console.log('✅ Reports permissions for all users:');
    permissions.forEach(perm => {
      const status = perm.is_allowed ? '✅' : '❌';
      const accessIcon = perm.access_level === 'view' ? '👁️' : 
                        perm.access_level === 'edit' ? '✏️' : 
                        perm.access_level === 'admin' ? '👑' : '🚫';
      console.log(`  ${status} ${accessIcon} ${perm.username} (${perm.role}): ${perm.access_level}`);
    });
    
    console.log('\n✅ Reports permissions added successfully!');
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test the reports section in the admin panel');
    console.log('3. Verify that only users with reports permissions can access it');
    
  } catch (error) {
    console.error('❌ Failed to add reports permissions:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
addReportsPermissions(); 