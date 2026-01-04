import { Router } from 'express';
import { getBanners } from '../controllers/bannersController.js';

const router = Router();

router.get('/', getBanners);

export default router;

