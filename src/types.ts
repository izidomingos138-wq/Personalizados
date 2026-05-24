export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  category: 'Agenda' | 'Harpa Cristã' | 'Lembrancinhas' | 'Outros';
  imageUrl: string;
  stock: number;
  featured: boolean;
  rating: number;
  reviewsCount: number;
  details?: { name: string; value: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  customName?: string; // e.g., "Nome para personalizar a capa"
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
  notes?: string;
  customName?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalPrice: number;
  discount: number;
  finalPrice: number;
  couponCode?: string;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  deliveryStatus: 'pending' | 'shipped' | 'delivered';
  createdAt: string;
  pixCode: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minPurchase: number;
  active: boolean;
}

export interface PromoBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
