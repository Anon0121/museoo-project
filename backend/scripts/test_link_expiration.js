const mysql = require('mysql2/promise');
const pool = require('../db');

async function testLinkExpiration() {
  try {
    console.log('🧪 Testing link expiration functionality...\n');
    
    // Check if we have any additional visitors
    const [visitors] = await pool.query(`
      SELECT token_id, email, status, link_expires_at, details_completed_at
      FROM additional_visitors 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (visitors.length === 0) {
      console.log('❌ No additional visitors found. Please create a test booking first.');
      return;
    }
    
    console.log('📋 Current additional visitors:');
    visitors.forEach((visitor, index) => {
      console.log(`   ${index + 1}. Token: ${visitor.token_id}`);
      console.log(`      Email: ${visitor.email}`);
      console.log(`      Status: ${visitor.status}`);
      console.log(`      Link Expires: ${visitor.link_expires_at || 'Not set'}`);
      console.log(`      Details Completed: ${visitor.details_completed_at || 'Not completed'}`);
      console.log('');
    });
    
    // Test the expiration logic
    console.log('🔍 Testing expiration scenarios:');
    
    // Find a completed visitor to test
    const completedVisitor = visitors.find(v => v.status === 'completed');
    if (completedVisitor) {
      console.log(`✅ Found completed visitor: ${completedVisitor.token_id}`);
      console.log(`   Link expired at: ${completedVisitor.link_expires_at}`);
      
      const isExpired = completedVisitor.link_expires_at && new Date() > new Date(completedVisitor.link_expires_at);
      console.log(`   Is currently expired: ${isExpired ? 'Yes' : 'No'}`);
    }
    
    // Find a pending visitor to test
    const pendingVisitor = visitors.find(v => v.status === 'pending');
    if (pendingVisitor) {
      console.log(`✅ Found pending visitor: ${pendingVisitor.token_id}`);
      console.log(`   Link expired at: ${pendingVisitor.link_expires_at || 'Not set'}`);
      console.log(`   Is currently expired: ${pendingVisitor.link_expires_at ? 'Yes' : 'No'}`);
    }
    
    console.log('\n🎉 Link expiration test completed!');
    console.log('📋 How expiration works:');
    console.log('   - Links start as active (link_expires_at = NULL)');
    console.log('   - After form submission, link_expires_at = NOW()');
    console.log('   - Expired links show "Link has expired" message');
    console.log('   - QR codes still work for check-in');
    
  } catch (err) {
    console.error('❌ Error testing link expiration:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testLinkExpiration();


