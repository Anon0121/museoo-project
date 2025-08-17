const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEvents() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking for events in database...');
    
    // Check activities table for events
    const [activities] = await pool.query('SELECT * FROM activities WHERE type = "event"');
    console.log(`📅 Found ${activities.length} events in activities table:`);
    
    if (activities.length > 0) {
      activities.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title} (Date: ${event.start_date})`);
      });
    } else {
      console.log('  ❌ No events found in activities table');
    }

    // Check event_details table
    const [eventDetails] = await pool.query('SELECT * FROM event_details');
    console.log(`\n📋 Found ${eventDetails.length} records in event_details table:`);
    
    if (eventDetails.length > 0) {
      eventDetails.forEach((detail, index) => {
        console.log(`  ${index + 1}. Activity ID: ${detail.activity_id} (Date: ${detail.start_date}, Time: ${detail.time})`);
      });
    } else {
      console.log('  ❌ No event details found');
    }

    // Check if there are any activities at all
    const [allActivities] = await pool.query('SELECT * FROM activities');
    console.log(`\n📊 Total activities in database: ${allActivities.length}`);
    
    if (allActivities.length > 0) {
      console.log('Activities found:');
      allActivities.forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.title} (Type: ${activity.type})`);
      });
    }

  } catch (err) {
    console.error('❌ Error checking events:', err);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkEvents(); 