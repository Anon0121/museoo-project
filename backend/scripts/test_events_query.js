const mysql = require('mysql2/promise');
require('dotenv').config();

async function testEventsQuery() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Testing the exact events query from activities.js...');
    
    // Test the exact query from the API
    const [events] = await pool.query(
      "SELECT a.id, a.title, a.description, ed.start_date, ed.time, ed.location, ed.organizer \
       FROM activities a \
       JOIN event_details ed ON a.id = ed.activity_id \
       WHERE a.type = 'event'"
    );

    console.log(`📊 Events found with JOIN query: ${events.length}`);
    
    if (events.length > 0) {
      console.log('\n📅 Events with details:');
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}`);
        console.log(`     ID: ${event.id}`);
        console.log(`     Date: ${event.start_date}`);
        console.log(`     Time: ${event.time}`);
        console.log(`     Location: ${event.location}`);
        console.log(`     Organizer: ${event.organizer}`);
        console.log('');
      });
    } else {
      console.log('❌ No events found with JOIN query');
      
      // Let's check what's in each table separately
      console.log('\n🔍 Checking tables separately...');
      
      const [activities] = await pool.query("SELECT * FROM activities WHERE type = 'event'");
      console.log(`Activities table has ${activities.length} events`);
      
      const [eventDetails] = await pool.query("SELECT * FROM event_details");
      console.log(`Event_details table has ${eventDetails.length} records`);
      
      if (activities.length > 0 && eventDetails.length > 0) {
        console.log('\n🔍 Checking for mismatched IDs...');
        const activityIds = activities.map(a => a.id);
        const detailIds = eventDetails.map(ed => ed.activity_id);
        
        console.log('Activity IDs:', activityIds);
        console.log('Event detail IDs:', detailIds);
        
        const missingDetails = activityIds.filter(id => !detailIds.includes(id));
        const missingActivities = detailIds.filter(id => !activityIds.includes(id));
        
        if (missingDetails.length > 0) {
          console.log('❌ Activities without details:', missingDetails);
        }
        if (missingActivities.length > 0) {
          console.log('❌ Details without activities:', missingActivities);
        }
      }
    }

  } catch (err) {
    console.error('❌ Error testing query:', err);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

testEventsQuery(); 