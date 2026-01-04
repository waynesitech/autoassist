import { Router } from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createTowingRequest,
  createQuotation,
  checkout
} from '../controllers/transactionsController.js';

const router = Router();

// Special transaction endpoints (must be before /:id to avoid route conflicts)
router.post('/towing', createTowingRequest);
router.post('/quotation', createQuotation);
router.post('/checkout', checkout);

// Standard CRUD routes
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;

