import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CarInfo } from '../types';

const USER_SESSION_KEY = '@autoassist:user_session';
const HAS_SEEN_ONBOARDING_KEY = '@autoassist:has_seen_onboarding';
const NOTIFICATION_SETTINGS_KEY = '@autoassist:notification_settings';
const VEHICLES_KEY = '@autoassist:vehicles';
const READ_QUOTATION_MESSAGES_KEY = '@autoassist:read_quotation_messages';

export const sessionStorage = {
  // Save user session
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user session:', error);
      throw error;
    }
  },

  // Get saved user session
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_SESSION_KEY);
      if (userData) {
        return JSON.parse(userData) as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  },

  // Clear user session (logout)
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    } catch (error) {
      console.error('Error clearing user session:', error);
      throw error;
    }
  },

  // Check if user has seen onboarding
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as seen
  async setOnboardingSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error setting onboarding status:', error);
      throw error;
    }
  },

  // Save notification settings
  async saveNotificationSettings(settings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderUpdates: boolean;
    serviceReminders: boolean;
    promotions: boolean;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  },

  // Get notification settings
  async getNotificationSettings(): Promise<{
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderUpdates: boolean;
    serviceReminders: boolean;
    promotions: boolean;
  } | null> {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
      return null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  },

  // Save vehicles
  async saveVehicles(vehicles: CarInfo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error('Error saving vehicles:', error);
      throw error;
    }
  },

  // Get vehicles
  async getVehicles(): Promise<CarInfo[]> {
    try {
      const vehicles = await AsyncStorage.getItem(VEHICLES_KEY);
      if (vehicles) {
        return JSON.parse(vehicles) as CarInfo[];
      }
      return [];
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return [];
    }
  },

  // Save read quotation message IDs
  async saveReadQuotationMessages(messageIds: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(READ_QUOTATION_MESSAGES_KEY, JSON.stringify(messageIds));
    } catch (error) {
      console.error('Error saving read quotation messages:', error);
      throw error;
    }
  },

  // Get read quotation message IDs
  async getReadQuotationMessages(): Promise<string[]> {
    try {
      const readMessages = await AsyncStorage.getItem(READ_QUOTATION_MESSAGES_KEY);
      if (readMessages) {
        return JSON.parse(readMessages) as string[];
      }
      return [];
    } catch (error) {
      console.error('Error getting read quotation messages:', error);
      return [];
    }
  },
};

