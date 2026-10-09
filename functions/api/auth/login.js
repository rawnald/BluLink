import { json, error, randomHex, hashPassword } from "../utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return error("Cloudflare D1 database binding 'DB' is missing. Bind D1 in Cloudflare Pages settings.", 500);
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return error("Email and password are required.");
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user by email
    const user = await env.DB.prepare(`
      SELECT id, email, password_hash, salt, auth_provider, email_verified FROM users WHERE email = ?
    `).bind(trimmedEmail).first();

    if (!user) {
      return error("Invalid email or password.", 401);
    }

    if (user.auth_provider === "google" && !user.password_hash) {
      return error("This account was created with Google. Please click 'Sign in with Google'.", 400);
    }

    // Verify hash
    const computedHash = await hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return error("Invalid email or password.", 401);
    }

    // Check if email has been confirmed
    if (user.email_verified === 0) {
      return json({
        require_verification: true,
        email: user.email,
        error: "Please confirm your email first before entering the workspace."
      }, 403);
    }

    // Create session token valid for 30 days
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
      }
    });
  } catch (err) {
    return error(err.message || "Login failed", 500);
  }
}
