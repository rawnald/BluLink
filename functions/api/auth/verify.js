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

    // Query user by email
    const user = await env.DB.prepare(`
      SELECT id, email, email_verified, verification_code, verification_expires 
      FROM users WHERE email = ?
    `).bind(trimmedEmail).first();

    if (!user) {
      return error("Account not found with this email.", 404);
    }

    if (user.email_verified === 1) {
      return error("This account is already verified. Please sign in.", 400);
    }

    // Verify code and expiration
    if (user.verification_code !== trimmedCode) {
      return error("Invalid confirmation code. Please double check the code.", 400);
    }

    if (user.verification_expires && new Date(user.verification_expires).getTime() < Date.now()) {
      return error("Confirmation code has expired. Please request a new code.", 400);
    }

    // Mark as verified
    await env.DB.prepare(`
      UPDATE users 
      SET email_verified = 1, verification_code = NULL, verification_expires = NULL 
      WHERE id = ?
    `).bind(user.id).run();

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

