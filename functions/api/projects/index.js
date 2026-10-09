import { json, error, getSessionUser, randomHex } from "../utils.js";

// Helper to get project data: first check R2 (if bound), fallback to D1 projects table
async function getProjectData(env, userId, projectId, d1FallbackData) {
  if (env.PROJECTS_BUCKET) {
    try {
      const objKey = `users/${userId}/projects/${projectId}.json`;
      const obj = await env.PROJECTS_BUCKET.get(objKey);
      if (obj) {
        const text = await obj.text();
        return JSON.parse(text);
      }
    } catch (e) {
      console.warn("R2 get project error, falling back to D1:", e);
    }
  }
  if (d1FallbackData) {
    try {
      return typeof d1FallbackData === "string" ? JSON.parse(d1FallbackData) : d1FallbackData;
    } catch (e) {}
  }
  return { entities: [], links: [] };
}

// Helper to save project data: write to R2 (if bound) and update D1 index/metadata
async function putProjectData(env, userId, projectId, dataObj) {
  const dataString = typeof dataObj === "string" ? dataObj : JSON.stringify(dataObj || { entities: [], links: [] });
  
  // 1. If R2 bucket is bound, write to R2
  if (env.PROJECTS_BUCKET) {
    try {
      const objKey = `users/${userId}/projects/${projectId}.json`;
      await env.PROJECTS_BUCKET.put(objKey, dataString, {
        httpMetadata: { contentType: "application/json" },
        customMetadata: { userId, projectId, updatedAt: new Date().toISOString() }
      });
    } catch (e) {
      console.warn("R2 save project error:", e);
    }
  }

  // 2. Also keep D1 metadata & backup sync
  try {
    await env.DB.prepare(`
      UPDATE projects 
      SET data = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(dataString, projectId, userId).run();
  } catch (e) {
    console.warn("D1 project data backup update error:", e);
  }
}

// GET /api/projects - List all projects for authenticated user
export async function onRequestGet({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return error("Unauthorized", 401);

    // Ensure projects table exists in D1
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        data TEXT DEFAULT '{"entities":[],"links":[]}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Query projects
    let { results } = await env.DB.prepare(`
      SELECT id, name, description, created_at, updated_at 
      FROM projects 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `).bind(user.id).all();

    return json({ projects: results || [] });
  } catch (err) {
    return error(err.message || "Failed to list projects", 500);
  }
}

// POST /api/projects - Create a new project
export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return error("Unauthorized", 401);

    const body = await request.json().catch(() => ({}));
    const name = (body.name || "Untitled Project").trim();
    const description = (body.description || "").trim();
    const projectId = "proj_" + randomHex(8);
    const initialData = { entities: [], links: [] };
    const dataString = JSON.stringify(initialData);

    // Save to D1
    await env.DB.prepare(`
      INSERT INTO projects (id, user_id, name, description, data)
      VALUES (?, ?, ?, ?, ?)
    `).bind(projectId, user.id, name, description, dataString).run();

    // Save to R2 bucket if bound
    if (env.PROJECTS_BUCKET) {
      await env.PROJECTS_BUCKET.put(`users/${user.id}/projects/${projectId}.json`, dataString, {
        httpMetadata: { contentType: "application/json" },
        customMetadata: { userId: user.id, projectId, name }
      }).catch(e => console.warn("R2 save failed on create:", e));
    }

    return json({
      success: true,
      project: {
        id: projectId,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    return error(err.message || "Failed to create project", 500);
  }
}

