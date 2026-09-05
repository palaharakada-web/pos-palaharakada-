export type UserRole = 'admin' | 'staff';

export interface StaffPermissions {
  posBilling: boolean;           // Counter POS billing terminal
  salesLedger: boolean;          // View Sales Ledger, invoice audits & reprint
  billSearch: boolean;           // Search bills by customer/date/invoice #
  customerLedger: boolean;       // Customer Ledger / Credit khata & receive debt payments
  inventoryView: boolean;        // View stock levels & product catalog
  inventoryManage: boolean;      // Edit stock, add new items, modify retail/wholesale prices
  cashBookView: boolean;         // View Day-End Cash Book & register balances
  expenseEntry: boolean;         // Record store expenses & cash payouts
  attendancePunch: boolean;      // Log daily attendance & view duty shifts
  salaryView: boolean;           // View salary payments & disbursements
  accountingView: boolean;       // View Accounts, Journal Vouchers & Trial Balance
  canApplyDiscount: boolean;     // Can apply custom discount on POS bills
  canWholesalePrice: boolean;    // Can toggle wholesale pricing on POS bills
  canVoidCart: boolean;          // Can clear cart / cancel active orders
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  posBilling: true,
  salesLedger: false,
  billSearch: true,
  customerLedger: false,
  inventoryView: false,
  inventoryManage: false,
  cashBookView: false,
  expenseEntry: false,
  attendancePunch: true,
  salaryView: false,
  accountingView: false,
  canApplyDiscount: true,
  canWholesalePrice: false,
  canVoidCart: true,
};

export const DEFAULT_ADMIN_PERMISSIONS: StaffPermissions = {
  posBilling: true,
  salesLedger: true,
  billSearch: true,
  customerLedger: true,
  inventoryView: true,
  inventoryManage: true,
  cashBookView: true,
  expenseEntry: true,
  attendancePunch: true,
  salaryView: true,
  accountingView: true,
  canApplyDiscount: true,
  canWholesalePrice: true,
  canVoidCart: true,
};

export interface User {
  id: string;
  loginId: string;
  name: string;
  role: UserRole;
  pin: string;
  active: boolean;
  phone?: string;
  baseSalary?: number;   // Monthly base wage
  permissions?: StaffPermissions;
  createdAt: string;
  lastLogin?: string;
}

export type ProductUnit = 'kg' | 'gram' | 'pack' | 'box' | 'pcs';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  rate: number;          // Retail selling rate per base unit (e.g. per kg or per pcs)
  wholesaleRate?: number;// Wholesale selling rate per base unit
  costPrice: number;     // Purchase cost
  unit: ProductUnit;     // Base unit: 'kg', 'pcs', 'pack', 'box'
  stock: number;         // Current in-stock quantity
  minStockAlert: number; // Low stock threshold
  barcode?: string;      // Standard EAN/Code128 barcode or custom SKU barcode
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
  isWholesale?: boolean; // If wholesale rate was applied
  scannedWeightGrams?: number; // If read from weight-embedded barcode (e.g. 350g)
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
  mode: 'Cash' | 'UPI' | 'Bank Transfer';
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

export interface StaffAttendance {
  id: string;
  date: string;          // YYYY-MM-DD
  userId: string;
  userName: string;
  status: 'Present' | 'Absent' | 'Half-Day' | 'Leave';
  checkIn?: string;      // HH:MM
  checkOut?: string;     // HH:MM
  notes?: string;
}

export interface StaffSalaryPayment {
  id: string;
  date: string;
  userId: string;
  userName: string;
  month: string;         // e.g. '2026-08'
  monthlyBaseSalary: number;
  daysPresent: number;
  overtimeHours?: number;
  bonus?: number;
  deductions?: number;
  netPaid: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  voucherNo: string;
  paidBy: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  voucherNo: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  referenceType?: 'Sale' | 'Expense' | 'Salary' | 'Payment' | 'Manual';
  referenceId?: string;
  createdBy: string;
}
