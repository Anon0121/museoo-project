const mysql = require('mysql2/promise');
const pool = require('../db');

async function checkAdditionalVisitorDetails() {
  try {
    console.log('🔍 Checking additional visitor details in database...\n');
    
    // Check the specific token
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      ['ADD-BOOK45-2']
    );
    
    if (tokenRows.length === 0) {
      console.log('❌ Token not found!');
      return;
    }
    
    const tokenInfo = tokenRows[0];
    console.log('✅ Token found:');
    console.log(`   Token ID: ${tokenInfo.token_id}`);
    console.log(`   Email: ${tokenInfo.email}`);
    console.log(`   Status: ${tokenInfo.status}`);
    console.log(`   Booking Status: ${tokenInfo.booking_status}`);
    
    if (tokenInfo.details) {
      console.log('\n📋 Stored Details (JSON):');
      console.log(tokenInfo.details);
      
      try {
        const details = JSON.parse(tokenInfo.details);
        console.log('\n📋 Parsed Details:');
        console.log(`   First Name: ${details.firstName || 'N/A'}`);
        console.log(`   Last Name: ${details.lastName || 'N/A'}`);
        console.log(`   Gender: ${details.gender || 'N/A'}`);
        console.log(`   Nationality: ${details.nationality || 'N/A'}`);
        console.log(`   Address: ${details.address || 'N/A'}`);
        console.log(`   Institution: ${details.institution || 'N/A'}`);
        console.log(`   Purpose: ${details.purpose || 'N/A'}`);
        
        // Check if nationality is empty or null
        if (!details.nationality || details.nationality === '') {
          console.log('\n⚠️  NATIONALITY IS EMPTY!');
          console.log('💡 This explains why nationality is not showing in the scanner');
        }
      } catch (parseError) {
        console.log('❌ Error parsing details JSON:', parseError.message);
      }
    } else {
      console.log('❌ No details stored for this token');
    }
    
    // Check a few more recent additional visitors
    console.log('\n🔍 Checking other recent additional visitors...');
    const [recentTokens] = await pool.query(
      `SELECT av.token_id, av.email, av.status, av.details
       FROM additional_visitors av
       ORDER BY av.created_at DESC
       LIMIT 5`
    );
    
    console.log(`\n📋 Recent Additional Visitors (${recentTokens.length}):`);
    recentTokens.forEach((token, index) => {
      console.log(`\n   ${index + 1}. Token: ${token.token_id}`);
      console.log(`      Email: ${token.email}`);
      console.log(`      Status: ${token.status}`);
      
      if (token.details) {
        try {
          const details = JSON.parse(token.details);
          console.log(`      Nationality: ${details.nationality || 'EMPTY'}`);
        } catch (e) {
          console.log(`      Details: Error parsing JSON`);
        }
      } else {
        console.log(`      Details: None`);
      }
    });
    
    console.log('\n🎯 Analysis:');
    console.log('   - Check if nationality field is being saved in the form');
    console.log('   - Check if nationality is required in the form');
    console.log('   - Check if nationality has a default value');
    
  } catch (err) {
    console.error('❌ Error checking additional visitor details:', err);
  } finally {
    await pool.end();
  }
}

// Run the check
checkAdditionalVisitorDetails();


