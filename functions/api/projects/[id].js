import { json, error, getSessionUser } from "../utils.js";

// GET /api/projects/[id] - Load a single project's entities and links
export async function onRequestGet({ request, env, params }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return error("Unauthorized", 401);

    const projectId = params.id;
    if (!projectId) return error("Missing project ID");

    // 1. Fetch metadata from D1
    const proj = await env.DB.prepare(`
      SELECT id, name, description, data, created_at, updated_at 
      FROM projects 
      WHERE id = ? AND user_id = ?
    `).bind(projectId, user.id).first();

    if (!proj) return error("Project not found", 404);

    let projectData = null;

    // 2. Try loading content from R2 bucket first
    if (env.PROJECTS_BUCKET) {
      try {
        const objKey = `users/${user.id}/projects/${projectId}.json`;
        const obj = await env.PROJECTS_BUCKET.get(objKey);
        if (obj) {
          const text = await obj.text();
          projectData = JSON.parse(text);
        }
      } catch (e) {
        console.warn("R2 load error, using D1 backup:", e);
      }
    }

    // 3. Fallback to D1 backup data
    if (!projectData && proj.data) {
      try {
        projectData = typeof proj.data === "string" ? JSON.parse(proj.data) : proj.data;
      } catch (e) {}
    }

    if (!projectData || !Array.isArray(projectData.entities)) {
      projectData = { entities: [], links: [] };
    }

    return json({
      project: {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        created_at: proj.created_at,
        updated_at: proj.updated_at
      },
      data: projectData
    });
  } catch (err) {
    return error(err.message || "Failed to load project", 500);
  }
}

// POST /api/projects/[id] - Save/Autosave project entities and links
export async function onRequestPost({ request, env, params }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return error("Unauthorized", 401);

    const projectId = params.id;
    if (!projectId) return error("Missing project ID");

    const body = await request.json().catch(() => ({}));
    const dataString = typeof body.data === "string" 
      ? body.data 
      : JSON.stringify(body.data || { entities: [], links: [] });

    // 1. Save to R2 bucket if bound
    if (env.PROJECTS_BUCKET) {
      try {
        const objKey = `users/${user.id}/projects/${projectId}.json`;
        await env.PROJECTS_BUCKET.put(objKey, dataString, {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { 
            userId: user.id, 
            projectId, 
            savedAt: new Date().toISOString() 
          }
        });
      } catch (e) {
        console.warn("R2 save error:", e);
      }
    }

    // 2. Update D1 metadata and backup storage
    const updateName = body.name ? body.name.trim() : null;
    if (updateName) {
      await env.DB.prepare(`
        UPDATE projects 
        SET name = ?, data = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).bind(updateName, dataString, projectId, user.id).run();
    } else {
      await env.DB.prepare(`
        UPDATE projects 
        SET data = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).bind(dataString, projectId, user.id).run();
    }

    return json({
      success: true,
      updated_at: new Date().toISOString(),
      storage: env.PROJECTS_BUCKET ? "r2" : "d1"
    });
  } catch (err) {
    return error(err.message || "Failed to save project", 500);
  }
}

// DELETE /api/projects/[id] - Delete project from both R2 and D1
export async function onRequestDelete({ request, env, params }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return error("Unauthorized", 401);

    const projectId = params.id;
    if (!projectId) return error("Missing project ID");

    // 1. Delete from R2
    if (env.PROJECTS_BUCKET) {
      try {
        await env.PROJECTS_BUCKET.delete(`users/${user.id}/projects/${projectId}.json`);
      } catch (e) {
        console.warn("R2 delete error:", e);
      }
    }

    // 2. Delete from D1
    await env.DB.prepare(`
      DELETE FROM projects WHERE id = ? AND user_id = ?
    `).bind(projectId, user.id).run();

    return json({ success: true });
  } catch (err) {
    return error(err.message || "Failed to delete project", 500);
  }
}
