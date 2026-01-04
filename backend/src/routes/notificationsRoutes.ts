import { Router } from 'express';
import {
  getNotificationSettings,
  updateNotificationSettings
} from '../controllers/notificationsController.js';

const router = Router();

router.get('/:userId/notification-settings', getNotificationSettings);
router.put('/:userId/notification-settings', updateNotificationSettings);

export default router;

