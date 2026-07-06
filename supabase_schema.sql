-- Yami Application Supabase Schema
-- Copy and paste this script into the Supabase SQL Editor

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

-- Note: Ensure you create a public bucket named "yami-media" in Supabase Storage 
-- and set its access policy to "Public" so uploaded images and videos can be fetched.
