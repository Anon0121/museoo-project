const mysql = require('mysql2/promise');
const pool = require('../db');

async function checkInstitutionColumn() {
  try {
    console.log('🔍 Checking if institution column exists in visitors table...\n');
    
    // Check if institution column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'museosmart'
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'institution'
    `);
    
    if (columns.length === 0) {
      console.log('❌ Institution column does not exist in visitors table.');
      console.log('📝 Need to add institution column to support primary visitor institution field.');
      return false;
    } else {
      const column = columns[0];
      console.log('✅ Institution column exists:');
      console.log(`   - Name: ${column.COLUMN_NAME}`);
      console.log(`   - Type: ${column.DATA_TYPE}`);
      console.log(`   - Nullable: ${column.IS_NULLABLE === 'YES' ? 'Yes' : 'No'}`);
      console.log(`   - Default: ${column.COLUMN_DEFAULT || 'NULL'}`);
      console.log(`   - Max Length: ${column.CHARACTER_MAXIMUM_LENGTH || 'N/A'}`);
      return true;
    }
    
  } catch (err) {
    console.error('❌ Error checking institution column:', err);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the check
checkInstitutionColumn();


