import express from "express";
import { getDashboardSummary } from "../controllers/dashboard/dashboard.controller.js";
import { verifyToken, isAdminOrStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", verifyToken, isAdminOrStaff, getDashboardSummary);

export default router;
