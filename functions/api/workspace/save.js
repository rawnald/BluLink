import { json, error, getSessionUser } from "../utils.js";

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
    const dataString = typeof body.data === "string" ? body.data : JSON.stringify(body.data || { entities: [], links: [] });

    await env.DB.prepare(`
      INSERT INTO workspaces (user_id, data, updated_at) 
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET 
        data = excluded.data, 
        updated_at = excluded.updated_at
    `).bind(user.id, dataString).run();

    return json({
      success: true,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    return error(err.message || "Failed to save workspace", 500);
  }
}
