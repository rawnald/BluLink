-- ============================================================
-- Cloudflare D1 Database Schema for DataLink
-- Run this in Cloudflare Dashboard (D1 Console) or via Wrangler CLI:
-- npx wrangler d1 execute datalink-db --remote --file=./schema.sql
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions table (JWT / Bearer Token store)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- 3. Workspaces table (stores link analysis entities & links per user)
CREATE TABLE IF NOT EXISTS workspaces (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{"entities":[],"links":[]}',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-speed queries on Cloudflare Edge
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

