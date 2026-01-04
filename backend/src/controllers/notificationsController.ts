import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get notification settings for a user
export const getNotificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);

    const [rows] = await pool.query(
      'SELECT push_notifications as pushNotifications, email_notifications as emailNotifications, sms_notifications as smsNotifications, order_updates as orderUpdates, service_reminders as serviceReminders, promotions FROM notification_settings WHERE user_id = ?',
      [userId]
    ) as any;

    if (rows.length === 0) {
      // Return default settings if none exist
      res.json({
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        orderUpdates: true,
        serviceReminders: true,
        promotions: false,
      });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    next(error);
  }
};

// Update notification settings for a user
export const updateNotificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const { pushNotifications, emailNotifications, smsNotifications, orderUpdates, serviceReminders, promotions } = req.body;

    // Check if settings exist
    const [existing] = await pool.query(
      'SELECT id FROM notification_settings WHERE user_id = ?',
      [userId]
    ) as any;

    if (existing.length === 0) {
      // Create new settings
      await pool.query(
        'INSERT INTO notification_settings (user_id, push_notifications, email_notifications, sms_notifications, order_updates, service_reminders, promotions) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, pushNotifications ?? true, emailNotifications ?? true, smsNotifications ?? false, orderUpdates ?? true, serviceReminders ?? true, promotions ?? false]
      );
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE notification_settings SET push_notifications = ?, email_notifications = ?, sms_notifications = ?, order_updates = ?, service_reminders = ?, promotions = ? WHERE user_id = ?',
        [pushNotifications ?? true, emailNotifications ?? true, smsNotifications ?? false, orderUpdates ?? true, serviceReminders ?? true, promotions ?? false, userId]
      );
    }

    const [updated] = await pool.query(
      'SELECT push_notifications as pushNotifications, email_notifications as emailNotifications, sms_notifications as smsNotifications, order_updates as orderUpdates, service_reminders as serviceReminders, promotions FROM notification_settings WHERE user_id = ?',
      [userId]
    ) as any;

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
};

