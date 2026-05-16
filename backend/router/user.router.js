import express from 'express'
import { deleteUser, getAdmins, getAllUsers, getManagers, updateUser, updateUserRole } from '../controllers/user/user.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
const router = express.Router();
router.get('/', verifyToken, isAdmin, getAllUsers);
router.get('/role/manager', verifyToken, isAdmin, getManagers);
router.get('/role/admin', verifyToken, isAdmin, getAdmins);
router.put('/:id', verifyToken, isAdmin, updateUser);
router.patch('/:id', verifyToken, isAdmin, updateUserRole);
router.delete('/:id', verifyToken, isAdmin, deleteUser);
export default router;
