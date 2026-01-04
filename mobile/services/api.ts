import { Workshop, Transaction, Product, CartItem, User, CarInfo, AdSlide } from '../types';

// For mobile devices, use your computer's local IP address instead of localhost
// You can find it by running: ifconfig | grep "inet " | grep -v 127.0.0.1
// On macOS: ifconfig | grep "inet " | grep -v 127.0.0.1
// Update this IP address to match your computer's local network IP
// You can also set EXPO_PUBLIC_API_URL in a .env file in the mobile directory
// API Base URL Configuration
// You can override this by setting EXPO_PUBLIC_API_URL in a .env file
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://autoassist.com.my:3002';

// Log API URL for debugging (only in development)
declare const __DEV__: boolean;
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('API Base URL:', API_BASE_URL);
}

class AutoAssistAPI {
  // Helper function to add timeout to fetch
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number = 10000): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout: Server did not respond in time')), timeout)
      )
    ]);
  }

  private async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`API Request: ${options?.method || 'GET'} ${url}`);
    }
    
    try {
      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      }, 10000); // 10 second timeout

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, use status text as error
          const errorMessage = response.statusText || 'Invalid response from server';
          throw new Error(errorMessage);
        }
      } else {
        // If response is not JSON, create a data object with status text
        data = { error: response.statusText || 'Invalid response format' };
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || response.statusText || 'API request failed';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Handle network errors and timeouts
      if (error.message === 'Network request failed' || error.message === 'Failed to fetch' || error.message.includes('timeout')) {
        let errorMsg = '';
        if (error.message.includes('timeout')) {
          errorMsg = `Connection timeout after 10 seconds.\n\nTrying to connect to: ${API_BASE_URL}\n\nTroubleshooting:\n1. Ensure backend server is running: cd backend && npm run dev\n2. Check if server is accessible: curl ${API_BASE_URL}/api/health\n3. Verify both devices are on the same network\n4. Check firewall settings`;
        } else {
          errorMsg = `Unable to connect to server.\n\nConnection URL: ${API_BASE_URL}\n\nPlease verify:\n1. Backend server is running on port 3002\n2. Server is accessible at: ${API_BASE_URL}/api/health\n3. Both devices are on the same Wi-Fi network\n4. No firewall blocking port 3002`;
        }
        throw new Error(errorMsg);
      }
      
      // Re-throw if it's already an Error with a message
      if (error instanceof Error) {
        throw error;
      }
      
      // Otherwise, wrap in Error
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  async getWorkshops(): Promise<Workshop[]> {
    return this.fetchAPI<Workshop[]>('/api/workshops');
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.fetchAPI<Transaction[]>('/api/transactions');
  }

  async getQuotationDetails(transactionId: string): Promise<Transaction & { adminMessage?: string; quoteType?: 'brief' | 'detailed'; workshopId?: number }> {
    return this.fetchAPI<Transaction & { adminMessage?: string; quoteType?: 'brief' | 'detailed'; workshopId?: number }>(`/api/transactions/${transactionId}`);
  }

  async getBanners(): Promise<AdSlide[]> {
    return this.fetchAPI<AdSlide[]>('/api/banners');
  }

  async getProducts(category?: string): Promise<Product[]> {
    const endpoint = category ? `/api/products?category=${category}` : '/api/products';
    const products = await this.fetchAPI<any[]>(endpoint);
    // Normalize products - ensure price and stock are numbers
    return products.map(p => ({
      ...p,
      price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
      stock: typeof p.stock === 'string' ? parseInt(p.stock, 10) : (p.stock || 0),
      id: typeof p.id === 'string' ? parseInt(p.id, 10) : p.id,
    }));
  }

  async saveTransaction(transaction: Omit<Transaction, 'id' | 'date' | 'status'>): Promise<Transaction> {
    return this.fetchAPI<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async createTowingRequest(data: any): Promise<boolean> {
    const response = await this.fetchAPI<{ success: boolean }>('/api/towing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.success;
  }

  async createQuotation(data: any): Promise<boolean> {
    const response = await this.fetchAPI<{ success: boolean }>('/api/quotation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.success;
  }

  async checkout(cart: CartItem[], workshop: Workshop, total: number, userId: number | null = null): Promise<boolean> {
    const response = await this.fetchAPI<{ success: boolean }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ cart, workshop, total, userId }),
    });
    return response.success;
  }

  async login(email: string, password: string): Promise<{ success: boolean; user: User }> {
    const response = await this.fetchAPI<{ success: boolean; user: User }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  }

  async register(email: string, password: string, name: string, phone?: string): Promise<{ success: boolean; user: User }> {
    const response = await this.fetchAPI<{ success: boolean; user: User }>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    });
    return response;
  }

  async updateUser(userId: number, data: { name: string; email: string; phone?: string; password?: string }): Promise<{ success: boolean; user: User }> {
    const response = await this.fetchAPI<{ success: boolean; user: User }>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  }

  async getVehicles(userId: number): Promise<CarInfo[]> {
    const vehicles = await this.fetchAPI<any[]>(`/api/users/${userId}/vehicles`);
    // Convert database IDs to strings for consistency with mobile app
    return vehicles.map(v => ({
      ...v,
      id: v.id.toString(),
    }));
  }

  async createVehicle(userId: number, vehicle: Omit<CarInfo, 'id'>): Promise<CarInfo> {
    const created = await this.fetchAPI<any>(`/api/users/${userId}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
    return {
      ...created,
      id: created.id.toString(),
    };
  }

  async updateVehicle(userId: number, vehicleId: string, vehicle: Omit<CarInfo, 'id'>): Promise<CarInfo> {
    const updated = await this.fetchAPI<any>(`/api/users/${userId}/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
    return {
      ...updated,
      id: updated.id.toString(),
    };
  }

  async deleteVehicle(userId: number, vehicleId: string): Promise<boolean> {
    const response = await this.fetchAPI<{ success: boolean }>(`/api/users/${userId}/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  async getNotificationSettings(userId: number): Promise<{
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderUpdates: boolean;
    serviceReminders: boolean;
    promotions: boolean;
  }> {
    return this.fetchAPI<{
      pushNotifications: boolean;
      emailNotifications: boolean;
      smsNotifications: boolean;
      orderUpdates: boolean;
      serviceReminders: boolean;
      promotions: boolean;
    }>(`/api/users/${userId}/notification-settings`);
  }

  async updateNotificationSettings(
    userId: number,
    settings: {
      pushNotifications: boolean;
      emailNotifications: boolean;
      smsNotifications: boolean;
      orderUpdates: boolean;
      serviceReminders: boolean;
      promotions: boolean;
    }
  ): Promise<{
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    orderUpdates: boolean;
    serviceReminders: boolean;
    promotions: boolean;
  }> {
    return this.fetchAPI<{
      pushNotifications: boolean;
      emailNotifications: boolean;
      smsNotifications: boolean;
      orderUpdates: boolean;
      serviceReminders: boolean;
      promotions: boolean;
    }>(`/api/users/${userId}/notification-settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new AutoAssistAPI();
