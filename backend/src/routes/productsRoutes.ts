import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  upload,
  uploadImage
} from '../controllers/productsController.js';

const router = Router();

router.get('/', getAllProducts);
router.post('/upload', upload.single('image'), uploadImage);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;

