import { Router } from 'express';
import {
  getAllWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getAvailableImages
} from '../controllers/workshopsController.js';

const router = Router();

router.get('/', getAllWorkshops);
router.get('/images', getAvailableImages);
router.get('/:id', getWorkshopById);
router.post('/', createWorkshop);
router.put('/:id', updateWorkshop);
router.delete('/:id', deleteWorkshop);

export default router;

