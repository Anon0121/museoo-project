const pool = require('../db');

async function ensureActivityLogTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT NULL,
      ip_address VARCHAR(64) NULL,
      user_agent VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (user_id),
      FOREIGN KEY (user_id) REFERENCES system_user(user_ID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || null;
}

async function logActivity(req, action, detailsObj) {
  try {
    const userId = req.session?.user?.id || null;
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || null;
    const details = detailsObj ? JSON.stringify(detailsObj) : null;
    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [userId, action, details, ip, ua]
    );
  } catch (e) {
    console.error('⚠️ Failed to log activity:', e.message);
  }
}

module.exports = { ensureActivityLogTable, logActivity };









