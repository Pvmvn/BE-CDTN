import express from 'express'
import { completeOrder, createOrderOffline, getAllOrdersByUserId, getOrderById, getOrders, confirmPaymentOrder, cancelOrder, updateOfflineOrderTableCount, returnPager } from '../controllers/order/order.controller.js';
import { verifyToken, isAdminOrStaff } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get('/', verifyToken, isAdminOrStaff, getOrders);
// Cho phép admin/staff và chính chủ đơn hàng xem chi tiết
router.get('/:orderId', verifyToken, getOrderById);
router.get('/user/:userId', verifyToken, getAllOrdersByUserId);
router.post('/', verifyToken, isAdminOrStaff, createOrderOffline); 
router.patch("/:id/complete", verifyToken, isAdminOrStaff, completeOrder);
router.patch("/:id/confirm-payment", verifyToken, isAdminOrStaff, confirmPaymentOrder);
router.patch("/:id/cancel", verifyToken, isAdminOrStaff, cancelOrder);
router.patch("/:id/table-count", verifyToken, isAdminOrStaff, updateOfflineOrderTableCount);
router.patch("/:id/return-pager", verifyToken, isAdminOrStaff, returnPager);
export default router;
