import { AdSlide, Product, Transaction, Workshop } from './types';

export const PRIMARY_BLUE = '#0f172a'; // slate-900
export const ACCENT_ORANGE = '#f97316'; // orange-500

// Workshop banner image - using require for React Native local images
export const WORKSHOP_BANNER_IMAGE = require('./assets/img/soan-huat.jpeg');

export const AD_SLIDES: AdSlide[] = [
  {
    id: 1,
    title: "Premium Towing Service",
    subtitle: "24/7 Professional Car Recovery",
    image: "https://picsum.photos/id/1071/800/400"
  },
  {
    id: 2,
    title: "Expert Vehicle Inspection",
    subtitle: "Get a detailed valuation report today",
    image: "https://picsum.photos/id/1072/800/400"
  },
  {
    id: 3,
    title: "Genuine Auto Parts",
    subtitle: "Up to 20% off on monthly deals",
    image: "https://picsum.photos/id/1070/800/400"
  }
];

export const WORKSHOPS: Workshop[] = [
  { id: 1, name: 'Syarikat Bengkel Soan Huat Sdn. Bhd.', rating: 4.8, location: 'No.26, Persiaran Segambut Tengah, Segambut 51200 KL.', icon: 'construct' },
];

export const RECENT_TRANSACTIONS: Transaction[] = [
  { id: 'TX001', type: 'Towing', title: 'Towing to Bangsar', date: '2023-11-20', amount: 150.00, status: 'completed' },
  { id: 'TX002', type: 'Quotation', title: 'Detailed Valuation (Honda Civic)', date: '2023-11-19', amount: 15.00, status: 'completed' },
  { id: 'TX003', type: 'Shop', title: 'Engine Oil Filter', date: '2023-11-18', amount: 45.00, status: 'ongoing' },
  { id: 'TX004', type: 'Quotation', title: 'Brief Quotation (Toyota Vios)', date: '2023-11-17', amount: 5.00, status: 'cancelled' },
];

export const SHOP_PRODUCTS: Product[] = [
  { id: 1, name: 'Synthetic Engine Oil 5W-40', price: 185.00, category: 'Lubricants', stock: 12, image: 'https://picsum.photos/id/10/400/400' },
  { id: 2, name: 'High Performance Brake Pads', price: 220.00, category: 'Brakes', stock: 5, image: 'https://picsum.photos/id/11/400/400' },
  { id: 3, name: 'Premium Oil Filter', price: 35.00, category: 'Filters', stock: 40, image: 'https://picsum.photos/id/12/400/400' },
  { id: 4, name: 'LED Headlight Bulbs (Pair)', price: 150.00, category: 'Electrical', stock: 8, image: 'https://picsum.photos/id/13/400/400' },
  { id: 5, name: 'Car Battery (Maintenance Free)', price: 280.00, category: 'Electrical', stock: 15, image: 'https://picsum.photos/id/14/400/400' },
  { id: 6, name: 'Wiper Blade Set', price: 65.00, category: 'Accessories', stock: 25, image: 'https://picsum.photos/id/15/400/400' },
];
