export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  loginId: string;
  name: string;
  role: UserRole;
  pin: string;
  active: boolean;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export type ProductUnit = 'kg' | 'gram' | 'pack' | 'box' | 'pcs';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  rate: number;          // Default selling rate per base unit (e.g. per kg or per pcs)
  costPrice: number;     // Purchase cost
  unit: ProductUnit;     // Base unit: 'kg', 'pcs', 'pack', 'box'
  stock: number;         // Current in-stock quantity
  minStockAlert: number; // Low stock threshold
}

export interface CartItem {
  id: string;
  productId: string;
  code?: string;
  name: string;
  qty: number;           // Quantity entered (e.g., 2 or 500)
  unit: ProductUnit;     // Unit selected ('kg', 'gram', 'pcs', etc.)
  rate: number;          // Rate per selected unit
  amount: number;        // Calculated line total
}

export type PaymentMode = 'Cash' | 'UPI' | 'Credit' | 'Card';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
  lastVisit: string;
}

export interface SaleInvoice {
  invoiceNo: string;
  date: string;
  time: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  cashierId: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  amountReceived: number;
  balanceDue: number;
  paymentMode: PaymentMode;
  notes?: string;
}

export interface CashBookEntry {
  id: string;
  date: string;
  voucherNo: string;
  particulars: string;
  account: string;
  mode: 'Cash' | 'UPI';
  receipt: number;
  payment: number;
  balance: number;
  staffName: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: 'Rent' | 'Electricity' | 'Raw Materials' | 'Staff Wages' | 'Packaging' | 'Maintenance' | 'Other';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI';
  recordedBy: string;
}
