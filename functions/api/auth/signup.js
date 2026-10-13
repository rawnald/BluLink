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

    // Check if user already exists
    const existing = await env.DB.prepare("SELECT id, email_verified, auth_provider FROM users WHERE email = ?").bind(trimmedEmail).first();
    if (existing) {
      if (existing.auth_provider === "google") {
        return error("This email address is already registered via Google. Please click 'Continue with Google'.", 409);
      }
      if (existing.email_verified === 1) {
        return error("This email address is already registered. Please sign in instead.", 409);
      }
      return error("This email address is already registered. Please sign in to enter or verify your account.", 409);
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
      email_sent: emailResult.sent,
      // If email delivery was not possible (no email service configured on Cloudflare), provide fallback preview
      code_preview: !emailResult.sent ? verificationCode : undefined,
      message: emailResult.sent
        ? "Account created! A 6-digit confirmation code was sent to your email."
        : "Account created! Please check your email for the 6-digit verification code."
    }, 201);
  } catch (err) {
    return error(err.message || "Sign up failed", 500);
  }
}
