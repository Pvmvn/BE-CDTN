import express from 'express';
import {
  createPayment,
  handleVnpayReturn,
  getPaymentResultByOrderId,
} from '../controllers/payment/payment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
const router = express.Router();
router.post("/create", verifyToken, createPayment);
router.get("/vnpay-return", handleVnpayReturn);
router.get("/result/:orderId", getPaymentResultByOrderId);
export default router;
