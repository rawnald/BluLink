-- ============================================================
-- Cloudflare D1 Database Schema for BluLink
-- Run this in Cloudflare Dashboard (D1 Console) or via Wrangler CLI:
-- npx wrangler d1 execute datalink-db --remote --file=./schema.sql
-- ============================================================

-- 1. Users table (stores only verified and confirmed accounts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT,
  salt TEXT,
  auth_provider TEXT DEFAULT 'local', -- 'local' or 'google'
  google_id TEXT,
  email_verified INTEGER DEFAULT 1,   -- 1: confirmed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pending Verifications table (unverified registrations; purged upon verification)
CREATE TABLE IF NOT EXISTS pending_verifications (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sessions table (JWT / Bearer Token store)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- 3. Workspaces table (legacy fallback)
CREATE TABLE IF NOT EXISTS workspaces (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{"entities":[],"links":[]}',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Multi-Project Support (stored in Cloudflare R2 bucket + D1 catalog)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  data TEXT DEFAULT '{"entities":[],"links":[]}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-speed queries on Cloudflare Edge
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(email, verification_code);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
