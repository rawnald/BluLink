import { json, error, generateVerificationCode, sendEmailConfirmation } from "../utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return error("Cloudflare D1 database binding 'DB' is missing.", 500);
  }

  try {
    const { email } = await request.json();
    if (!email) return error("Email address is required.");

    const trimmedEmail = email.trim().toLowerCase();

    const user = await env.DB.prepare(`
      SELECT id, email, email_verified FROM users WHERE email = ?
    `).bind(trimmedEmail).first();

    if (!user) {
      return error("No account found with this email.", 404);
    }

    if (user.email_verified === 1) {
      return error("This account is already verified. Please sign in.", 400);
    }

    const newCode = generateVerificationCode();
    await env.DB.prepare(`
      UPDATE users 
      SET verification_code = ?, verification_expires = datetime('now', '+15 minutes') 
      WHERE id = ?
    `).bind(newCode, user.id).run();

    await sendEmailConfirmation(trimmedEmail, newCode, env);

    return json({
      success: true,
      email: trimmedEmail,
      code_preview: newCode,
      message: "New confirmation code has been sent to your email."
    });
  } catch (err) {
    return error(err.message || "Failed to resend confirmation code", 500);
  }
}
