const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 5000;
const JWT_SECRET = 'yami_super_secret_key_123';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==========================================
// AUTH ROUTES
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const userRole = role === 'provider' ? 'provider' : 'user';

  db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
    [name, email, hashedPassword, userRole], 
    function(err) {
      if (err) return res.status(400).json({ error: 'Email already exists' });
      const token = jwt.sign({ id: this.lastID, role: userRole }, JWT_SECRET);
      res.json({ token, user: { id: this.lastID, name, email, role: userRole } });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// ==========================================
// RESTAURANT (PROVIDER) ROUTES
// ==========================================
app.post('/api/restaurants', authenticate, upload.single('image'), (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  const { name, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.run('INSERT INTO restaurants (provider_id, name, description, image_url) VALUES (?, ?, ?, ?)',
    [req.user.id, name, description, image_url],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, description, image_url });
    }
  );
});

app.get('/api/provider/restaurants', authenticate, (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  db.all('SELECT * FROM restaurants WHERE provider_id = ?', [req.user.id], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/menu', authenticate, upload.single('image'), (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  const { restaurant_id, name, description, price } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Verify ownership
  db.get('SELECT id FROM restaurants WHERE id = ? AND provider_id = ?', [restaurant_id, req.user.id], (err, rest) => {
    if (!rest) return res.status(403).json({ error: 'Not your restaurant' });

    db.run('INSERT INTO menu_items (restaurant_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)',
      [restaurant_id, name, description, price, image_url],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, restaurant_id, name, description, price, image_url });
      }
    );
  });
});

app.post('/api/reels', authenticate, upload.single('video'), (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  const { restaurant_id, menu_item_id, description } = req.body;
  const video_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.run('INSERT INTO reels (restaurant_id, menu_item_id, video_url, description) VALUES (?, ?, ?, ?)',
    [restaurant_id, menu_item_id, video_url, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, video_url });
    }
  );
});

// ==========================================
// PUBLIC/USER ROUTES
// ==========================================
app.get('/api/reels', (req, res) => {
  db.all(`
    SELECT r.*, m.name as item_name, m.price as item_price, m.image_url as item_image, rest.name as restaurant_name 
    FROM reels r
    JOIN menu_items m ON r.menu_item_id = m.id
    JOIN restaurants rest ON r.restaurant_id = rest.id
  `, (err, rows) => {
    res.json(rows || []);
  });
});

app.get('/api/restaurants', (req, res) => {
  db.all('SELECT * FROM restaurants', (err, rows) => {
    res.json(rows || []);
  });
});

app.get('/api/restaurants/:id/menu', (req, res) => {
  db.all('SELECT * FROM menu_items WHERE restaurant_id = ?', [req.params.id], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/orders', authenticate, (req, res) => {
  const { restaurant_id, total, items } = req.body;
  db.run('INSERT INTO orders (user_id, restaurant_id, total) VALUES (?, ?, ?)',
    [req.user.id, restaurant_id, total],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, status: 'pending' });
    }
  );
});

app.get('/api/orders', authenticate, (req, res) => {
  let query = 'SELECT o.*, r.name as restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.user_id = ?';
  let params = [req.user.id];

  if (req.user.role === 'provider') {
    query = 'SELECT o.*, u.name as user_name, r.name as restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id = r.id JOIN users u ON o.user_id = u.id WHERE r.provider_id = ?';
  }

  db.all(query, params, (err, rows) => {
    res.json(rows || []);
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
