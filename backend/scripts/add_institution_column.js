const mysql = require('mysql2/promise');
const pool = require('../db');

async function addInstitutionColumn() {
  try {
    console.log('🔧 Adding institution column to visitors table...\n');
    
    // Check if institution column already exists
    const [existingColumns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'museosmart'
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'institution'
    `);
    
    if (existingColumns.length > 0) {
      console.log('✅ Institution column already exists in visitors table.');
      return;
    }
    
    // Add institution column
    await pool.query(`
      ALTER TABLE visitors
      ADD COLUMN institution VARCHAR(100) NULL
      AFTER purpose
    `);
    
    console.log('✅ Institution column added successfully!');
    console.log('📋 Column details:');
    console.log('   - Name: institution');
    console.log('   - Type: VARCHAR(100)');
    console.log('   - Nullable: Yes (optional field)');
    console.log('   - Position: After purpose column');
    
    // Verify the column was added
    const [newColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'museosmart'
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'institution'
    `);
    
    if (newColumns.length > 0) {
      const column = newColumns[0];
      console.log('\n✅ Verification successful:');
      console.log(`   - Column: ${column.COLUMN_NAME}`);
      console.log(`   - Type: ${column.DATA_TYPE}(${column.CHARACTER_MAXIMUM_LENGTH})`);
      console.log(`   - Nullable: ${column.IS_NULLABLE === 'YES' ? 'Yes' : 'No'}`);
    }
    
    console.log('\n🎉 Institution column is ready for use!');
    console.log('📝 Primary visitors can now specify their institution/organization.');
    console.log('📝 Additional visitors will automatically inherit this institution.');
    
  } catch (err) {
    console.error('❌ Error adding institution column:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
addInstitutionColumn();


