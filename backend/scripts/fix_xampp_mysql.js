const fs = require('fs');
const path = require('path');

async function fixXamppMySQL() {
  console.log('🔧 Configuring XAMPP MySQL for network access...\n');

  const myIniPath = 'C:\\xampp\\mysql\\bin\\my.ini';
  
  try {
    // Read the current my.ini file
    let content = fs.readFileSync(myIniPath, 'utf8');
    console.log('✅ Found my.ini file');

    // Check if bind-address is already configured
    if (content.includes('bind-address = 0.0.0.0')) {
      console.log('✅ bind-address is already set to 0.0.0.0');
    } else if (content.includes('bind-address = 127.0.0.1')) {
      // Replace localhost binding with network binding
      content = content.replace('bind-address = 127.0.0.1', 'bind-address = 0.0.0.0');
      console.log('✅ Updated bind-address from 127.0.0.1 to 0.0.0.0');
    } else {
      // Add bind-address if it doesn't exist
      const mysqldSection = content.indexOf('[mysqld]');
      if (mysqldSection !== -1) {
        const insertPosition = content.indexOf('\n', mysqldSection) + 1;
        content = content.slice(0, insertPosition) + 'bind-address = 0.0.0.0\n' + content.slice(insertPosition);
        console.log('✅ Added bind-address = 0.0.0.0 to [mysqld] section');
      } else {
        console.log('⚠️  Could not find [mysqld] section, adding it manually');
        content += '\n[mysqld]\nbind-address = 0.0.0.0\n';
      }
    }

    // Write the updated content back to the file
    fs.writeFileSync(myIniPath, content);
    console.log('✅ Updated my.ini file successfully');

    console.log('\n📝 Next steps:');
    console.log('1. Restart XAMPP MySQL service');
    console.log('2. Run the network access setup script');
    console.log('3. Test network connectivity');

  } catch (error) {
    console.error('❌ Error configuring my.ini:', error.message);
    console.log('\n🔧 Manual steps required:');
    console.log('1. Open C:\\xampp\\mysql\\bin\\my.ini in a text editor');
    console.log('2. Find the [mysqld] section');
    console.log('3. Add or change: bind-address = 0.0.0.0');
    console.log('4. Save the file');
    console.log('5. Restart XAMPP MySQL service');
  }
}

fixXamppMySQL().catch(console.error);
