const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugEventDates() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Debugging Event Dates...');
    
    // Get current time
    const now = new Date();
    console.log('🕐 Current time:', now);
    console.log('📅 Current date string:', now.toISOString());
    
    // Get events from database
    const [events] = await pool.query(
      "SELECT a.id, a.title, ed.start_date, ed.time FROM activities a JOIN event_details ed ON a.id = ed.activity_id WHERE a.type = 'event'"
    );

    console.log(`📊 Found ${events.length} events:`);
    
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.title}`);
      console.log(`   Start Date: ${event.start_date}`);
      console.log(`   Time: ${event.time}`);
      
      // Test the same logic as frontend
      const eventDateTime = new Date(`${event.start_date}T${event.time || '00:00'}`);
      console.log(`   Combined DateTime: ${eventDateTime}`);
      console.log(`   Is Future: ${eventDateTime > now}`);
      console.log(`   Is Past: ${eventDateTime <= now}`);
      
      // Check if date is valid
      console.log(`   Is Valid Date: ${!isNaN(eventDateTime.getTime())}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

debugEventDates(); 