import { json, error, randomHex } from "../utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return error("Cloudflare D1 database binding 'DB' is missing. Bind D1 in Cloudflare Pages settings.", 500);
  }

  try {
    const { credential } = await request.json();
    if (!credential || typeof credential !== "string") {
      return error("Valid Google ID credential token is required.");
    }

    // Verify token with Google's public tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return error("Google authentication token verification failed.", 401);
    }

    const payload = await googleRes.json();
    const { email, sub: googleId } = payload;

    if (!email) {
      return error("Google profile did not provide an email address.", 400);
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists in Cloudflare D1
    let user = await env.DB.prepare(`
      SELECT id, email, auth_provider FROM users WHERE email = ? OR google_id = ?
    `).bind(trimmedEmail, googleId).first();

    let userId;
    if (!user) {
      // Create new user in Cloudflare D1 (Google accounts are automatically email_verified = 1)
      userId = "g_" + randomHex(8);
      await env.DB.prepare(`
        INSERT INTO users (id, email, auth_provider, google_id, email_verified) VALUES (?, ?, 'google', ?, 1)
      `).bind(userId, trimmedEmail, googleId).run();

      // Initialize empty workspace for new Google user in D1
      await env.DB.prepare(`
        INSERT INTO workspaces (user_id, data) VALUES (?, ?)
      `).bind(userId, JSON.stringify({ entities: [], links: [] })).run();
    } else {
      userId = user.id;
      // Update google_id and mark email as verified
      await env.DB.prepare(`
        UPDATE users SET google_id = ?, auth_provider = 'google', email_verified = 1 WHERE id = ?
      `).bind(googleId, userId).run();
    }

    // Create session token valid for 30 days
    const token = "tok_" + randomHex(24);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)
    `).bind(token, userId, expiresAt).run();

    return json({
      token,
      user: {
        id: userId,
        email: trimmedEmail
      }
    });
  } catch (err) {
    return error(err.message || "Google authentication failed", 500);
  }
}
