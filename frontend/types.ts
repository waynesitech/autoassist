
export enum JobStatus {
  PENDING = 'Pending',
  DISPATCHED = 'Dispatched',
  ON_SITE = 'On Site',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface TowingJob {
  id: string;
  customerName: string;
  vehicleModel: string;
  location: string;
  status: JobStatus;
  timestamp: string;
  driver?: string;
  priority: 'High' | 'Normal' | 'Low';
}

export interface Quotation {
  id: string;
  title: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Paid';
  date: string;
  customer: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
