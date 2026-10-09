// Cloudflare Pages Functions Utility Library
// Uses Web Crypto API natively supported on Cloudflare Workers/Pages

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers
    }
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

// Generate random hex string for salt and IDs
export function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// Generate random 6-digit confirmation code
export function generateVerificationCode() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (100000 + (arr[0] % 900000)).toString();
}

// Secure SHA-256 password hash with salt
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(password + ":" + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Extract and verify session token from Authorization header
export async function getSessionUser(request, env) {
  if (!env.DB) {
    throw new Error("D1 database binding 'DB' is missing. Please bind your D1 database in Cloudflare Pages settings.");
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const row = await env.DB.prepare(`
    SELECT s.token, s.user_id, s.expires_at, u.email, u.email_verified 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).bind(token).first();

  if (!row) return null;

  // Block session if email is unconfirmed
  if (row.email_verified === 0) return null;

  return {
    id: row.user_id,
    email: row.email,
    token: row.token
  };
}

// Send verification email via Resend API (if env.RESEND_API_KEY is configured)
export async function sendEmailConfirmation(email, code, env) {
  if (!env.RESEND_API_KEY) {
    console.log(`[BluLink Email Service] No RESEND_API_KEY provided. Verification code for ${email} is: ${code}`);
    return { sent: false, note: "Email service not configured. Code logged." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "BluLink Security <auth@blulink.app>",
        to: [email],
        subject: "Confirm your BluLink Account",
        html: `
          <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
            <h2 style="color:#000000;margin-top:0">Welcome to BluLink</h2>
            <p style="color:#334155;font-size:14px;line-height:1.5">Please confirm your email address to activate your workspace and access your Cloudflare D1 database.</p>
            <div style="margin:24px 0;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;text-align:center">
              <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#2563eb">${code}</span>
            </div>
            <p style="color:#64748b;font-size:12px">This code expires in 15 minutes. If you did not request this account, please ignore this email.</p>
          </div>
        `
      })
    });
    return { sent: res.ok };
  } catch (err) {
    console.error("Failed to send email via Resend:", err);
    return { sent: false, error: err.message };
  }
}
