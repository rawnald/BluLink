import { json, error, randomHex, hashPassword } from "../utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return error("Cloudflare D1 database binding 'DB' is missing. Bind D1 in Cloudflare Pages settings.", 500);
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return error("Valid email and password are required.");
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length < 3 || !trimmedEmail.includes("@")) {
      return error("Please enter a valid email address.");
    }
    if (password.length < 6) {
      return error("Password must be at least 6 characters long.");
    }

    // Check if user already exists
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(trimmedEmail).first();
    if (existing) {
      return error("An account with this email already exists. Please sign in instead.");
    }

    const userId = "u_" + randomHex(8);
    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);

    // Insert user into D1
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)
    `).bind(userId, trimmedEmail, passwordHash, salt).run();

    // Create session token valid for 30 days
    const token = "tok_" + randomHex(24);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)
    `).bind(token, userId, expiresAt).run();

    // Initialize blank workspace for new user
    await env.DB.prepare(`
      INSERT INTO workspaces (user_id, data) VALUES (?, ?)
    `).bind(userId, JSON.stringify({ entities: [], links: [] })).run();

    return json({
      token,
      user: {
        id: userId,
        email: trimmedEmail
      }
    }, 201);
  } catch (err) {
    return error(err.message || "Sign up failed", 500);
  }
}
