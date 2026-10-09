// Cloudflare Pages Functions Utility Library
// Uses Web Crypto API natively supported on Cloudflare Workers/Pages

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers
    }
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

// Generate random hex string for salt and IDs
export function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// Secure SHA-256 password hash with salt
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(password + ":" + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Extract and verify session token from Authorization header
export async function getSessionUser(request, env) {
  if (!env.DB) {
    throw new Error("D1 database binding 'DB' is missing. Please bind your D1 database in Cloudflare Pages settings.");
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const row = await env.DB.prepare(`
    SELECT s.token, s.user_id, s.expires_at, u.email 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).bind(token).first();

  if (!row) return null;

  return {
    id: row.user_id,
    email: row.email,
    token: row.token
  };
}

