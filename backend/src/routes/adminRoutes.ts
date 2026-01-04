import { Router } from 'express';
import {
  adminLogin,
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from '../controllers/adminController.js';

const router = Router();

// Admin authentication
router.post('/login', adminLogin);

// Admin CRUD routes
router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;

