import { json, error, randomHex } from "../utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return error("Cloudflare D1 database binding 'DB' is missing. Bind D1 in Cloudflare Pages settings.", 500);
  }

  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return error("Email address and 6-digit confirmation code are required.");
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.toString().trim();

    // Check pending_verifications table
    const pending = await env.DB.prepare(`
      SELECT email, password_hash, salt, code, expires_at 
      FROM pending_verifications WHERE email = ?
    `).bind(trimmedEmail).first();

    if (!pending) {
      const existingUser = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(trimmedEmail).first();
      if (existingUser) {
        return error("This account is already verified. Please sign in.", 400);
      }
      return error("No pending registration found for this email. Please create an account first.", 404);
    }

    // Verify code and expiration
    if (pending.code !== trimmedCode) {
      return error("Invalid confirmation code. Please double check the code.", 400);
    }

    if (pending.expires_at && new Date(pending.expires_at).getTime() < Date.now()) {
      return error("Confirmation code has expired. Please request a new code.", 400);
    }

    // ONLY NOW: Insert verified user into users table
    const userId = "u_" + randomHex(8);
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, salt, auth_provider, email_verified) 
      VALUES (?, ?, ?, ?, 'local', 1)
    `).bind(userId, trimmedEmail, pending.password_hash, pending.salt).run();

    // Clean up pending verification record
    await env.DB.prepare("DELETE FROM pending_verifications WHERE email = ?").bind(trimmedEmail).run().catch(() => {});

    // Ensure workspace exists in D1
    const existingWs = await env.DB.prepare("SELECT user_id FROM workspaces WHERE user_id = ?").bind(user.id).first();
    if (!existingWs) {
      await env.DB.prepare(`
        INSERT INTO workspaces (user_id, data) VALUES (?, ?)
      `).bind(user.id, JSON.stringify({ entities: [], links: [] })).run();
    }

    // Now issue session token
    const token = "tok_" + randomHex(24);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)
    `).bind(token, user.id, expiresAt).run();

    return json({
      token,
      user: {
        id: user.id,
        email: user.email
      },
      message: "Email successfully verified! Welcome to BluLink."
    });
  } catch (err) {
    return error(err.message || "Email verification failed", 500);
  }
}

