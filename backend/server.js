const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Supabase client
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// URL Normalization Middleware to handle reverse proxy prefix stripping (e.g. Vercel)
app.use((req, res, next) => {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

const { Client } = require('pg');

app.get('/api/migrate', async (req, res) => {
  const connectionString = 'postgresql://postgres:Punoloana21351.@db.icbmbzmbbtscsigwvcii.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    const sql = `
      -- 0. Create Public Storage Bucket
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('yami-media', 'yami-media', true)
      ON CONFLICT (id) DO NOTHING;

      -- 1. Users Table
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('user', 'provider')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Restaurants Table
      CREATE TABLE IF NOT EXISTS restaurants (
        id BIGSERIAL PRIMARY KEY,
        provider_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Menu Items Table
      CREATE TABLE IF NOT EXISTS menu_items (
        id BIGSERIAL PRIMARY KEY,
        restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price DOUBLE PRECISION NOT NULL,
        image_url TEXT
      );

      -- 4. Reels Table
      CREATE TABLE IF NOT EXISTS reels (
        id BIGSERIAL PRIMARY KEY,
        restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
        menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE CASCADE,
        video_url TEXT,
        description TEXT,
        likes INTEGER DEFAULT 0
      );

      -- 5. Orders Table
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
        total DOUBLE PRECISION NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await client.query(sql);
    await client.end();
    res.json({ success: true, message: 'Database migrated and storage bucket created successfully!' });
  } catch (err) {
    try { await client.end(); } catch (e) {}
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'yami_super_secret_key_123';

// Configure multer for file uploads in-memory (since serverless environments don't support disk writes)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload file to Supabase Storage
async function uploadToSupabase(file, folder = 'uploads') {
  if (!file) return null;
  
  // Generate a unique filename using timestamp and random string
  const uniqueName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
  
  const { data, error } = await db.storage
    .from('yami-media')
    .upload(uniqueName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
  
  if (error) {
    console.error('Supabase storage upload error:', error);
    throw error;
  }
  
  // Get the public URL for the uploaded file
  const { data: publicUrlData } = db.storage
    .from('yami-media')
    .getPublicUrl(uniqueName);
    
  return publicUrlData.publicUrl;
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
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'provider' ? 'provider' : 'user';

    const { data, error } = await db.from('users')
      .insert({ name, email, password: hashedPassword, role: userRole })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const token = jwt.sign({ id: data.id, role: userRole }, JWT_SECRET);
    res.json({ token, user: { id: data.id, name, email, role: userRole } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const { data: user, error } = await db.from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await db.from('users')
      .select('id, name, email, role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RESTAURANT (PROVIDER) ROUTES
// ==========================================
app.post('/api/restaurants', authenticate, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { name, description } = req.body;
    const image_url = req.file ? await uploadToSupabase(req.file, 'restaurants') : null;

    const { data, error } = await db.from('restaurants')
      .insert({ provider_id: req.user.id, name, description, image_url })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/provider/restaurants', authenticate, async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { data, error } = await db.from('restaurants')
      .select('*')
      .eq('provider_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', authenticate, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  const { restaurant_id, name, description, price } = req.body;

  try {
    // Verify ownership
    const { data: rest, error: restErr } = await db.from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .eq('provider_id', req.user.id)
      .maybeSingle();

    if (restErr || !rest) return res.status(403).json({ error: 'Not your restaurant' });

    const image_url = req.file ? await uploadToSupabase(req.file, 'menu') : null;

    const { data, error } = await db.from('menu_items')
      .insert({ restaurant_id, name, description, price: parseFloat(price), image_url })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reels', authenticate, upload.single('video'), async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'Forbidden' });
  
  const { restaurant_id, menu_item_id, description } = req.body;

  try {
    const video_url = req.file ? await uploadToSupabase(req.file, 'reels') : null;

    const { data, error } = await db.from('reels')
      .insert({ restaurant_id, menu_item_id, video_url, description })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUBLIC/USER ROUTES
// ==========================================
app.get('/api/reels', async (req, res) => {
  try {
    const { data, error } = await db.from('reels')
      .select(`
        *,
        menu_items:menu_item_id (name, price, image_url),
        restaurants:restaurant_id (name)
      `);

    if (error) return res.status(500).json({ error: error.message });

    // Format fields to match SQLite endpoint response exactly for frontend compatibility
    const formatted = (data || []).map(r => ({
      id: r.id,
      restaurant_id: r.restaurant_id,
      menu_item_id: r.menu_item_id,
      video_url: r.video_url,
      description: r.description,
      likes: r.likes,
      item_name: r.menu_items?.name,
      item_price: r.menu_items?.price,
      item_image: r.menu_items?.image_url,
      restaurant_name: r.restaurants?.name
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants', async (req, res) => {
  try {
    const { data, error } = await db.from('restaurants').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id/menu', async (req, res) => {
  try {
    const { data, error } = await db.from('menu_items')
      .select('*')
      .eq('restaurant_id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  const { restaurant_id, total } = req.body;
  try {
    const { data, error } = await db.from('orders')
      .insert({ user_id: req.user.id, restaurant_id, total })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, status: data.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'provider') {
      // 1. Get all restaurants managed by this provider
      const { data: providerRests, error: restErr } = await db.from('restaurants')
        .select('id')
        .eq('provider_id', req.user.id);

      if (restErr) return res.status(500).json({ error: restErr.message });
      
      const restIds = (providerRests || []).map(r => r.id);
      if (restIds.length === 0) return res.json([]);

      // 2. Fetch orders placed at these restaurants
      const { data, error } = await db.from('orders')
        .select(`
          *,
          users:user_id (name),
          restaurants:restaurant_id (name)
        `)
        .in('restaurant_id', restIds);

      if (error) return res.status(500).json({ error: error.message });

      const formatted = (data || []).map(o => ({
        id: o.id,
        user_id: o.user_id,
        restaurant_id: o.restaurant_id,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
        user_name: o.users?.name,
        restaurant_name: o.restaurants?.name
      }));

      res.json(formatted);
    } else {
      // Fetch user's own orders
      const { data, error } = await db.from('orders')
        .select(`
          *,
          restaurants:restaurant_id (name)
        `)
        .eq('user_id', req.user.id);

      if (error) return res.status(500).json({ error: error.message });

      const formatted = (data || []).map(o => ({
        id: o.id,
        user_id: o.user_id,
        restaurant_id: o.restaurant_id,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
        restaurant_name: o.restaurants?.name
      }));

      res.json(formatted);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For local testing:
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Function deployment
module.exports = app;
