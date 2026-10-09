import { json, error, getSessionUser } from "../utils.js";

export async function onRequestGet({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) {
      return error("Unauthorized", 401);
    }

    const row = await env.DB.prepare(`
      SELECT data, updated_at FROM workspaces WHERE user_id = ?
    `).bind(user.id).first();

    if (!row || !row.data) {
      return json({
        data: { entities: [], links: [] },
        updated_at: null
      });
    }

    let parsed = { entities: [], links: [] };
    try {
      parsed = JSON.parse(row.data);
    } catch (e) {}

    return json({
      data: parsed,
      updated_at: row.updated_at
    });
  } catch (err) {
    return error(err.message || "Failed to load workspace", 500);
  }
}

