import { json, error, generateVerificationCode, sendEmailConfirmation } from "../utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return error("Cloudflare D1 database binding 'DB' is missing.", 500);
  }

  try {
    const { email } = await request.json();
    if (!email) return error("Email address is required.");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith("@gmail.com") && !trimmedEmail.endsWith("@googlemail.com")) {
      return error("Only Gmail addresses (@gmail.com) are allowed.", 400);
    }

    const user = await env.DB.prepare(`
      SELECT id, email, email_verified FROM users WHERE email = ?
    `).bind(trimmedEmail).first();

    if (!user) {
      return error("This email address is not registered. Please create an account first.", 404);
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

    let emailResult = { sent: false };
    try {
      emailResult = await sendEmailConfirmation(trimmedEmail, newCode, env);
    } catch (e) {}

    return json({
      success: true,
      email: trimmedEmail,
      email_sent: emailResult.sent,
      code_preview: !emailResult.sent ? newCode : undefined,
      message: emailResult.sent
        ? "New confirmation code has been sent to your email."
        : "Email service not configured; new code is: " + newCode
    });
  } catch (err) {
    return error(err.message || "Failed to resend confirmation code", 500);
  }
}

