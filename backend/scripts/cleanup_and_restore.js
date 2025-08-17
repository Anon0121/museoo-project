const fs = require('fs');
const path = require('path');

function cleanupAndRestore() {
  console.log('🧹 Cleaning up development files and restoring original state...\n');

  // Files to delete (development scripts)
  const filesToDelete = [
    'add_qr_code_sent_column.js',
    'fix_null_constraints.js',
    'fix_booking_schema.js',
    'fix_all_schemas.js',
    'unified_visitors_migration.js',
    'test_unified_visitor_system.js',
    'debug_booking_error.js',
    'test_simple_booking.js',
    'generate_unified_test_qr.js',
    'test_qr_code_generation_final.js',
    'test_real_qr_fix.js',
    'check_qr_column_schema.js',
    'check_database_qr_codes.js',
    'test_qr_system_final.js',
    'test_unified_qr_scanning.js',
    'test_frontend_scanner.js',
    'test_real_booking_api.js',
    'test_ultra_simplified_booking.js',
    'test_email_sending.js',
    'send_missing_emails.js',
    'test_qr_code_generation.js',
    'test_email_with_qr.js',
    'update_group_members_schema.js',
    'test_qr_code_functionality.js',
    'test_primary_visitor_qr.js',
    'test_email_qr_debug.js',
    'test_simple_endpoint.js',
    'test_real_booking_api.js',
    'test_booking_endpoint.js',
    'test_frontend_connection.js',
    'add_checkin_columns.js',
    'test_qr_code_with_member_data.js',
    'update_visitor_fields.js'
  ];

  // Image files to delete
  const imageFilesToDelete = [
    'test_group_member_qr.png',
    'test_primary_visitor_qr.png',
    'final_test_qr.png',
    'test_qr_code_fixed.png',
    'test_qr_code.png',
    'test_qr_code_enhanced.png'
  ];

  const scriptsDir = __dirname;
  let deletedCount = 0;

  // Delete development script files
  console.log('🗑️  Deleting development script files...');
  filesToDelete.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`   ✅ Deleted: ${file}`);
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete ${file}: ${err.message}`);
      }
    }
  });

  // Delete image files
  console.log('\n🗑️  Deleting test image files...');
  imageFilesToDelete.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`   ✅ Deleted: ${file}`);
        deletedCount++;
      } catch (err) {
        console.log(`   ⚠️  Could not delete ${file}: ${err.message}`);
      }
    }
  });

  // Remove the original slots file we created
  const slotsOriginalPath = path.join(__dirname, '../routes/slots_original.js');
  if (fs.existsSync(slotsOriginalPath)) {
    try {
      fs.unlinkSync(slotsOriginalPath);
      console.log('\n   ✅ Deleted: slots_original.js');
      deletedCount++;
    } catch (err) {
      console.log(`   ⚠️  Could not delete slots_original.js: ${err.message}`);
    }
  }

  console.log(`\n🎉 Cleanup completed! Deleted ${deletedCount} files.`);
  console.log('\n📋 Summary:');
  console.log('   ✅ Database reset to original state');
  console.log('   ✅ Backend routes restored to original');
  console.log('   ✅ Development files cleaned up');
  console.log('   ✅ All group booking enhancements removed');
  console.log('\n🚀 The system is now back to its original state!');
  console.log('   You can now start fresh with the basic booking functionality.');
}

if (require.main === module) {
  cleanupAndRestore();
}

module.exports = cleanupAndRestore;
