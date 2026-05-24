import express from "express";
import { chatWithCoffeeAssistant, recommendProducts } from "../controllers/ai/ai.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/recommend-products", verifyToken, recommendProducts);
router.post("/chat", verifyToken, chatWithCoffeeAssistant);

export default router;
