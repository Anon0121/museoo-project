const mysql = require('mysql2/promise');

async function debugPermissions() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 Checking user permissions in database...\n');

    // Check system_user table
    const [users] = await pool.query('SELECT user_ID, username, role, permissions FROM system_user');
    console.log('📋 Users in system_user table:');
    users.forEach(user => {
      console.log(`  User ID: ${user.user_ID}, Username: ${user.username}, Role: ${user.role}`);
      console.log(`  Permissions JSON: ${user.permissions || 'NULL'}`);
      console.log('');
    });

    // Check user_permissions table
    const [permissions] = await pool.query('SELECT user_id, permission_name, is_allowed, access_level FROM user_permissions ORDER BY user_id, permission_name');
    console.log('📋 Permissions in user_permissions table:');
    permissions.forEach(perm => {
      console.log(`  User ID: ${perm.user_id}, Permission: ${perm.permission_name}, Allowed: ${perm.is_allowed}, Access: ${perm.access_level}`);
    });

    // Test tab filtering logic
    console.log('\n🧪 Testing tab filtering logic:');
    const allTabs = [
      { name: "Dashboard", permission: "dashboard" },
      { name: "Schedule", permission: "schedule" },
      { name: "Visitors", permission: "visitors" },
      { name: "Scanner", permission: "scanner" },
      { name: "Exhibit", permission: "exhibit" },
      { name: "Event", permission: "event" },
      { name: "CulturalObjects", permission: "cultural_objects" },
      { name: "Archive", permission: "archive" },
      { name: "Donation", permission: "donation" },
      { name: "Settings", permission: "settings" },
    ];

    users.forEach(user => {
      console.log(`\n🔍 Testing for user: ${user.username} (ID: ${user.user_ID})`);
      
      // Get user permissions
      const userPerms = {};
      permissions.filter(p => p.user_id === user.user_ID).forEach(perm => {
        userPerms[perm.permission_name] = {
          allowed: perm.is_allowed,
          access: perm.access_level
        };
      });

      console.log('  User permissions:', userPerms);

      // Test filtering
      const visibleTabs = allTabs.filter(tab => {
        const permission = userPerms[tab.permission];
        
        if (!permission) {
          console.log(`    ✅ ${tab.name} - no permission found, showing`);
          return true;
        }
        
        if (permission.allowed === false) {
          console.log(`    ❌ ${tab.name} - not allowed, hiding`);
          return false;
        }
        
        console.log(`    ✅ ${tab.name} - allowed, showing`);
        return true;
      });

      console.log(`  Visible tabs: ${visibleTabs.map(t => t.name).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugPermissions(); 