import { json, getSessionUser } from "../utils.js";

export async function onRequestPost({ request, env }) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ") && env.DB) {
      const token = authHeader.slice(7).trim();
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }
  } catch (e) {}

  return json({ success: true });
}
