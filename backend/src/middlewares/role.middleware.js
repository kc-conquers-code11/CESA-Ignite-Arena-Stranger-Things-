import { supabase } from "../config/supabaseClient.js";

export const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error || !data) {
        return res.status(403).json({ message: "Role not found" });
      }

      if (data.role !== role) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ message: "Forbidden" });
    }
  };
};
