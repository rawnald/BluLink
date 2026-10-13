import { json, error, randomHex, hashPassword, generateVerificationCode, sendEmailConfirmation } from "../utils.js";

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
    if (!trimmedEmail.endsWith("@gmail.com") && !trimmedEmail.endsWith("@googlemail.com")) {
      return error("Only Gmail addresses (@gmail.com) are allowed. Please register using your Gmail account.", 400);
    }
    if (password.length < 6) {
      return error("Password must be at least 6 characters long.", 400);
    }

    // Check if user is already verified and registered
    const existing = await env.DB.prepare("SELECT id, email_verified, auth_provider FROM users WHERE email = ?").bind(trimmedEmail).first();
    if (existing) {
      if (existing.auth_provider === "google") {
        return error("This email address is already registered via Google. Please click 'Continue with Google'.", 409);
      }
      if (existing.email_verified === 1) {
        return error("This email address is already registered. Please sign in instead.", 409);
      }
      // If legacy unverified row exists in users, clean it up so users table only has verified accounts
      await env.DB.prepare("DELETE FROM users WHERE id = ? AND email_verified = 0").bind(existing.id).run().catch(() => {});
    }

    // Ensure pending_verifications table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS pending_verifications (
        email TEXT PRIMARY KEY COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);
    const verificationCode = generateVerificationCode();

    // Store ONLY in pending_verifications (do NOT save to users table until verified)
    await env.DB.prepare(`
      INSERT INTO pending_verifications (email, password_hash, salt, code, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '+15 minutes'))
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        salt = excluded.salt,
        code = excluded.code,
        expires_at = excluded.expires_at,
        created_at = CURRENT_TIMESTAMP
    `).bind(trimmedEmail, passwordHash, salt, verificationCode).run();

    // Send confirmation code to user's email
    let emailResult = { sent: false };
    try {
      emailResult = await sendEmailConfirmation(trimmedEmail, verificationCode, env);
    } catch (e) {
      console.warn("Email send failed:", e);
    }

    // Notice: NO session token is issued until email is confirmed!
    return json({
      require_verification: true,
      email: trimmedEmail,
      message: "Account created! A 6-digit confirmation code was sent to your email."
    }, 201);
  } catch (err) {
    return error(err.message || "Sign up failed", 500);
  }
}
