import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { requireRole } from "./middlewares/role.middleware.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// ✅ ADD THIS ROUTE
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    message: "You are authenticated",
    userId: req.user.id,
  });
});
// Admin-only
app.get(
  "/api/admin/dashboard",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

// Student-only
app.get(
  "/api/student/dashboard",
  requireAuth,
  requireRole("student"),
  (req, res) => {
    res.json({ message: "Welcome Student" });
  }
);

app.get("/", (req, res) => {
  res.send("Backend running fine");
});

export default app;
