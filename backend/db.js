const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // <-- change this to your MySQL username
  password: '',      // <-- change this to your MySQL password
  database: 'museosmart',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Make sure MySQL is installed and running');
    console.log('2. Create a database called "museosmart"');
    console.log('3. Update the username/password in db.js');
    console.log('4. Or use: CREATE DATABASE museosmart;');
  });

module.exports = pool;
