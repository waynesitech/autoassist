import { Router } from 'express';
import {
  getUserVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehiclesController.js';

const router = Router();

router.get('/:userId/vehicles', getUserVehicles);
router.get('/:userId/vehicles/:vehicleId', getVehicleById);
router.post('/:userId/vehicles', createVehicle);
router.put('/:userId/vehicles/:vehicleId', updateVehicle);
router.delete('/:userId/vehicles/:vehicleId', deleteVehicle);

export default router;

