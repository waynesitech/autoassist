
export type AppTab = 'home' | 'quotation' | 'towing' | 'shop' | 'profile';

export type ProfileSubView = 
  | 'main' 
  | 'edit-profile' 
  | 'payment-methods' 
  | 'my-vehicles' 
  | 'notifications' 
  | 'locations' 
  | 'terms' 
  | 'help';

export interface CarInfo {
  model: string;
  year: string;
  chassis: string;
  engine: string;
}

export type TransactionStatus = 'pending' | 'completed' | 'ongoing' | 'cancelled';

export interface Transaction {
  id: string;
  type: 'Quotation' | 'Towing' | 'Shop';
  title: string;
  date: string;
  amount: number;
  status: TransactionStatus;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AdSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export interface Workshop {
  id: number;
  name: string;
  rating: number;
  location: string;
  icon: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  created_at: string;
}
