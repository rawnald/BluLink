import { json, error, getSessionUser } from "../utils.js";

export async function onRequestGet({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) {
      return error("Unauthorized", 401);
    }
    return json({ user });
  } catch (err) {
    return error(err.message || "Failed to authenticate", 500);
  }
}

