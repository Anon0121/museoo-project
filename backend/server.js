const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const pool = require('./db'); // Import the pool from db.js

const app = express();
const PORT = process.env.PORT || 3000;

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// ✅ Middleware
app.use(bodyParser.json());

// Allow both local and Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://museoo-project.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // if you use cookies or authentication
}));

app.use(session({
  secret: 'your_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none', // Important for cross-site cookies
    secure: true      // Important for HTTPS (Vercel/Railway)
  }
}));

// ✅ Middleware for session authentication
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Not authenticated' });
};

// ✅ Signup route
app.post('/api/signup', async (req, res) => {
  const { username, firstname, lastname, password, role } = req.body;

  if (!username || !firstname || !lastname || !password || role === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const sql = `INSERT INTO system_user (username, firstname, lastname, password, role, status)
                 VALUES (?, ?, ?, ?, ?, 'active')`;
    await pool.query(sql, [username, firstname, lastname, password, role]);
    res.json({ success: true, message: 'Account created successfully!' });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await pool.query(`SELECT * FROM system_user WHERE username = ?`, [username]);
    
    if (results.length === 0) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    const user = results[0];
    if (user.password !== password) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    if (user.status === 'deactivated') {
      return res.json({ success: false, message: 'Account is deactivated.' });
    }

    req.session.user = {
      id: user.user_ID,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role
    };

    res.json({ success: true, message: 'Login successful', user: req.session.user });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Current logged-in user
app.get('/api/user', isAuthenticated, (req, res) => {
  res.json({ success: true, user: req.session.user });
});

// ✅ Get all users
app.get('/api/users', async (req, res) => {
  try {
    const sql = `
      SELECT 
        user_ID AS id,
        username,
        firstname,
        lastname,
        role,
        status
      FROM system_user
    `;

    const [results] = await pool.query(sql);
    res.json({ success: true, users: results });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ✅ Logout
app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out' });
  });
});

// ✅ Change password
app.post('/api/change-password', isAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  try {
    const [results] = await pool.query(`SELECT password FROM system_user WHERE user_ID = ?`, [userId]);
    
    const user = results[0];
    if (!user || user.password !== currentPassword) {
      return res.json({ success: false, message: 'Current password incorrect' });
    }

    await pool.query(`UPDATE system_user SET password = ? WHERE user_ID = ?`, [newPassword, userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('❌ Change password error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Deactivate user
app.post('/api/users/:id/deactivate', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE system_user SET status = 'deactivated' WHERE user_ID = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Deactivate user error:', err);
    res.status(500).json({ success: false, message: 'Deactivate failed' });
  }
});

// ✅ Activate user
app.post('/api/users/:id/activate', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE system_user SET status = 'active' WHERE user_ID = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Activate user error:', err);
    res.status(500).json({ success: false, message: 'Activate failed' });
  }
});

// ✅ Delete user
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM system_user WHERE user_ID = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

app.use('/api/slots', require('./routes/slots'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/cultural-objects', require('./routes/cultural-objects'));

const archiveRoutes = require('./routes/archive');
app.use('/api/archives', archiveRoutes);
app.use('/uploads/archives', express.static(__dirname + '/uploads/archives'));

app.use('/api/donations', require('./routes/donations'));

const statsRouter = require('./routes/stats');
app.use('/api/stats', statsRouter);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
