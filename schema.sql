-- ============================================================
-- Cloudflare D1 Database Schema for BluLink
-- Run this in Cloudflare Dashboard (D1 Console) or via Wrangler CLI:
-- npx wrangler d1 execute datalink-db --remote --file=./schema.sql
-- ============================================================

-- 1. Users table (supports email/password, email verification, and Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT,
  salt TEXT,
  auth_provider TEXT DEFAULT 'local', -- 'local' or 'google'
  google_id TEXT,
  email_verified INTEGER DEFAULT 0,   -- 0: pending confirmation, 1: confirmed
  verification_code TEXT,
  verification_expires DATETIME,
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
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(email, verification_code);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
