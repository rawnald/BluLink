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
    if (trimmedEmail.length < 3 || !trimmedEmail.includes("@")) {
      return error("Please enter a valid email address.");
    }
    if (password.length < 6) {
      return error("Password must be at least 6 characters long.");
    }

    // Check if user already exists
    const existing = await env.DB.prepare("SELECT id, email_verified, auth_provider FROM users WHERE email = ?").bind(trimmedEmail).first();
    if (existing) {
      if (existing.email_verified === 0) {
        // Resend code to unconfirmed user
        const newCode = generateVerificationCode();
        await env.DB.prepare(`
          UPDATE users SET verification_code = ?, verification_expires = datetime('now', '+15 minutes') WHERE id = ?
        `).bind(newCode, existing.id).run();
        await sendEmailConfirmation(trimmedEmail, newCode, env);

        return json({
          require_verification: true,
          email: trimmedEmail,
          code_preview: newCode,
          message: "A confirmation code was sent to your email. Please verify to enter."
        });
      }
      if (existing.auth_provider === "google") {
        return error("This email is registered via Google. Please sign in with Google.");
      }
      return error("An account with this email already exists. Please sign in instead.");
    }

    const userId = "u_" + randomHex(8);
    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);
    const verificationCode = generateVerificationCode();

    // Insert user into D1 with email_verified = 0
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, salt, auth_provider, email_verified, verification_code, verification_expires)
      VALUES (?, ?, ?, ?, 'local', 0, ?, datetime('now', '+15 minutes'))
    `).bind(userId, trimmedEmail, passwordHash, salt, verificationCode).run();

    // Send confirmation email (or log if Resend API key not set)
    await sendEmailConfirmation(trimmedEmail, verificationCode, env);

    // Notice: NO session token is issued until email is confirmed!
    return json({
      require_verification: true,
      email: trimmedEmail,
      code_preview: verificationCode,
      message: "Account created! Please enter the 6-digit confirmation code sent to your email."
    }, 201);
  } catch (err) {
    return error(err.message || "Sign up failed", 500);
  }
}
