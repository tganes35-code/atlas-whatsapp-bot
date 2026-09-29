// ─── Auth ─────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// ─── Company ──────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  country: string;
  currency: string;
  logo?: string;
  schedules?: string;
  policies?: string;
  extraInfo?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Category ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  createdAt: string;
  _count?: { products: number };
}

// ─── Product ──────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceModifier: number;
  stock: number;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
  active: boolean;
  createdAt: string;
  category?: { id: string; name: string };
  variants?: ProductVariant[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Customer ─────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  _count?: { orders: number; conversations: number };
}

// ─── Cart ─────────────────────────────────────────────────

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: { id: string; name: string; price: number; image?: string };
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  customerId: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// ─── Order ────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'CONTRA_ENTREGA';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string;
  changedBy?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone: string };
  items?: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

// ─── Conversation ─────────────────────────────────────────

export type ConversationStatus = 'OPEN' | 'WAITING' | 'HUMAN' | 'CLOSED';
export type MessageSender = 'CUSTOMER' | 'BOT' | 'AGENT' | 'SYSTEM';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  type: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  status: ConversationStatus;
  channel: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone: string };
  assignedUser?: { id: string; name: string; email: string };
  messages?: Message[];
  _count?: { messages: number };
}

// ─── Dashboard ────────────────────────────────────────────

export interface DashboardStats {
  totals: {
    customers: number;
    products: number;
    pendingOrders: number;
    ordersToday: number;
    openConversations: number;
    humanConversations: number;
    salesToday: number;
  };
  latestOrders: Order[];
  latestConversations: Conversation[];
}

// ─── API Response ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}
