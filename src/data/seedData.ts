import { Product, Customer, User, SaleInvoice, ExpenseEntry, CashBookEntry, StaffAttendance, StaffSalaryPayment, JournalEntry, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    loginId: 'admin',
    name: 'Proprietor / Store Manager',
    role: 'admin',
    pin: 'admin123',
    active: true,
    phone: '9876543210',
    baseSalary: 45000,
    permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
    createdAt: '2026-08-01',
    lastLogin: '2026-09-04 09:15',
  },
  {
    id: 'USR-002',
    loginId: 'staff1',
    name: 'Rahul V. (Senior Cashier)',
    role: 'staff',
    pin: 'staff123',
    active: true,
    phone: '9876543211',
    baseSalary: 18000,
    permissions: {
      ...DEFAULT_STAFF_PERMISSIONS,
      salesLedger: true,       // Sales ledger enabled for Rahul V.
      customerLedger: true,    // Customer khata enabled
      inventoryView: true,     // Stock inquiry enabled
      canApplyDiscount: true,
    },
    createdAt: '2026-08-10',
    lastLogin: '2026-09-04 08:30',
  },
  {
    id: 'USR-003',
    loginId: 'staff2',
    name: 'Priya Nair (Billing Counter)',
    role: 'staff',
    pin: 'staff123',
    active: true,
    phone: '9876543212',
    baseSalary: 16500,
    permissions: {
      ...DEFAULT_STAFF_PERMISSIONS,
    },
    createdAt: '2026-08-15',
    lastLogin: '2026-09-03 18:45',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'PRD-101', code: 'BC01', barcode: '890101001011', name: 'Kerala Banana Chips', category: 'Snacks', rate: 260, wholesaleRate: 210, costPrice: 180, unit: 'kg', stock: 35.5, minStockAlert: 10 },
  { id: 'PRD-102', code: 'CK01', barcode: '890101001028', name: 'Rich Plum Cake', category: 'Cakes & Pastries', rate: 360, wholesaleRate: 290, costPrice: 240, unit: 'kg', stock: 24, minStockAlert: 5 },
  { id: 'PRD-103', code: 'TR01', barcode: '890101001035', name: 'Butter Tea Rusk (Pack)', category: 'Biscuits & Rusk', rate: 65, wholesaleRate: 50, costPrice: 42, unit: 'pack', stock: 80, minStockAlert: 20 },
  { id: 'PRD-104', code: 'MX01', barcode: '890101001042', name: 'Spicy Kerala Mixture', category: 'Snacks', rate: 220, wholesaleRate: 180, costPrice: 150, unit: 'kg', stock: 42, minStockAlert: 10 },
  { id: 'PRD-105', code: 'SM01', barcode: '890101001059', name: 'Crispy Veg Samosa', category: 'Hot Savouries', rate: 15, wholesaleRate: 11, costPrice: 8, unit: 'pcs', stock: 120, minStockAlert: 25 },
  { id: 'PRD-106', code: 'PF01', barcode: '890101001066', name: 'Egg Puff (Fresh Baked)', category: 'Hot Savouries', rate: 25, wholesaleRate: 18, costPrice: 14, unit: 'pcs', stock: 65, minStockAlert: 15 },
  { id: 'PRD-107', code: 'GJ01', barcode: '890101001073', name: 'Gulab Jamun (Sweet Box)', category: 'Sweets', rate: 190, wholesaleRate: 155, costPrice: 130, unit: 'box', stock: 30, minStockAlert: 8 },
  { id: 'PRD-108', code: 'HL01', barcode: '890101001080', name: 'Black Halwa (Calicut Special)', category: 'Sweets', rate: 320, wholesaleRate: 260, costPrice: 220, unit: 'kg', stock: 28, minStockAlert: 8 },
  { id: 'PRD-109', code: 'LD01', barcode: '890101001097', name: 'Motichoor Laddoo', category: 'Sweets', rate: 240, wholesaleRate: 195, costPrice: 160, unit: 'kg', stock: 20, minStockAlert: 5 },
  { id: 'PRD-110', code: 'BR01', barcode: '890101001103', name: 'Milk Bread (400g Loaf)', category: 'Bakery Staples', rate: 45, wholesaleRate: 35, costPrice: 30, unit: 'pack', stock: 50, minStockAlert: 15 },
  { id: 'PRD-111', code: 'CK02', barcode: '890101001110', name: 'Black Forest Pastry', category: 'Cakes & Pastries', rate: 80, wholesaleRate: 65, costPrice: 48, unit: 'pcs', stock: 40, minStockAlert: 10 },
  { id: 'PRD-112', code: 'CK03', barcode: '890101001127', name: 'Vanilla Sponge Cake (500g)', category: 'Cakes & Pastries', rate: 160, wholesaleRate: 125, costPrice: 100, unit: 'box', stock: 18, minStockAlert: 5 },
  { id: 'PRD-113', code: 'SN02', barcode: '890101001134', name: 'Tapioca Chips (Kappalandi)', category: 'Snacks', rate: 200, wholesaleRate: 160, costPrice: 135, unit: 'kg', stock: 25, minStockAlert: 8 },
  { id: 'PRD-114', code: 'DR01', barcode: '890101001141', name: 'Premium Roasted Cashews', category: 'Dry Fruits', rate: 850, wholesaleRate: 720, costPrice: 650, unit: 'kg', stock: 15, minStockAlert: 5 },
  { id: 'PRD-115', code: 'BV01', barcode: '890101001158', name: 'Special Cold Coffee (Bottle)', category: 'Beverages', rate: 60, wholesaleRate: 45, costPrice: 35, unit: 'pcs', stock: 45, minStockAlert: 12 },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-1001',
    name: 'Anil Kumar',
    phone: '9847123456',
    totalPurchases: 4850,
    totalPaid: 4850,
    balanceDue: 0,
    lastVisit: '2026-09-03',
  },
  {
    id: 'CUST-1002',
    name: 'Suresh Menon (Local Cafe)',
    phone: '9446987123',
    totalPurchases: 12400,
    totalPaid: 10200,
    balanceDue: 2200,
    lastVisit: '2026-09-02',
  },
  {
    id: 'CUST-1003',
    name: 'Lakshmi Narayanan',
    phone: '9895112233',
    totalPurchases: 3200,
    totalPaid: 3200,
    balanceDue: 0,
    lastVisit: '2026-09-01',
  },
  {
    id: 'CUST-1004',
    name: 'Mohammed Shafi',
    phone: '9744556677',
    totalPurchases: 7600,
    totalPaid: 6500,
    balanceDue: 1100,
    lastVisit: '2026-08-30',
  },
  {
    id: 'CUST-1005',
    name: 'Dr. Radhika Pillai',
    phone: '9497001122',
    totalPurchases: 1850,
    totalPaid: 1850,
    balanceDue: 0,
    lastVisit: '2026-08-28',
  }
];

export const INITIAL_INVOICES: SaleInvoice[] = [
  {
    invoiceNo: 'INV-1045',
    date: '2026-09-03',
    time: '18:30:15',
    customerId: 'CUST-1001',
    customerName: 'Anil Kumar',
    customerPhone: '9847123456',
    cashierId: 'staff1',
    cashierName: 'Rahul V.',
    items: [
      { id: '1', productId: 'PRD-101', name: 'Kerala Banana Chips', qty: 0.5, unit: 'kg', rate: 260, amount: 130 },
      { id: '2', productId: 'PRD-102', name: 'Rich Plum Cake', qty: 1, unit: 'kg', rate: 360, amount: 360 },
      { id: '3', productId: 'PRD-105', name: 'Crispy Veg Samosa', qty: 4, unit: 'pcs', rate: 15, amount: 60 }
    ],
    subtotal: 550,
    discount: 0,
    tax: 0,
    grandTotal: 550,
    amountReceived: 550,
    balanceDue: 0,
    paymentMode: 'UPI'
  },
  {
    invoiceNo: 'INV-1046',
    date: '2026-09-03',
    time: '19:15:40',
    customerId: 'CUST-1002',
    customerName: 'Suresh Menon (Local Cafe)',
    customerPhone: '9446987123',
    cashierId: 'staff1',
    cashierName: 'Rahul V.',
    items: [
      { id: '4', productId: 'PRD-103', name: 'Butter Tea Rusk (Pack)', qty: 10, unit: 'pack', rate: 65, amount: 650 },
      { id: '5', productId: 'PRD-110', name: 'Milk Bread (400g Loaf)', qty: 8, unit: 'pack', rate: 45, amount: 360 },
      { id: '6', productId: 'PRD-106', name: 'Egg Puff (Fresh Baked)', qty: 10, unit: 'pcs', rate: 25, amount: 250 }
    ],
    subtotal: 1260,
    discount: 60,
    tax: 0,
    grandTotal: 1200,
    amountReceived: 400,
    balanceDue: 800,
    paymentMode: 'Credit',
    notes: 'Partial payment made, Rs. 800 on account.'
  },
  {
    invoiceNo: 'INV-1047',
    date: '2026-09-04',
    time: '08:45:10',
    customerId: 'CUST-GUEST',
    customerName: 'Walk-in Customer',
    customerPhone: '',
    cashierId: 'staff2',
    cashierName: 'Priya Nair',
    items: [
      { id: '7', productId: 'PRD-106', name: 'Egg Puff (Fresh Baked)', qty: 2, unit: 'pcs', rate: 25, amount: 50 },
      { id: '8', productId: 'PRD-115', name: 'Special Cold Coffee (Bottle)', qty: 2, unit: 'pcs', rate: 60, amount: 120 }
    ],
    subtotal: 170,
    discount: 0,
    tax: 0,
    grandTotal: 170,
    amountReceived: 200,
    balanceDue: 0,
    paymentMode: 'Cash'
  }
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  { id: 'EXP-101', date: '2026-09-01', category: 'Rent', description: 'Bakery Shop September Rent', amount: 22000, paymentMode: 'UPI', recordedBy: 'Admin' },
  { id: 'EXP-102', date: '2026-09-02', category: 'Electricity', description: 'KSEB Commercial Power Bill', amount: 4850, paymentMode: 'UPI', recordedBy: 'Admin' },
  { id: 'EXP-103', date: '2026-09-03', category: 'Packaging', description: 'Cake boxes, brown paper bags, butter paper', amount: 2100, paymentMode: 'Cash', recordedBy: 'Admin' },
  { id: 'EXP-104', date: '2026-09-04', category: 'Raw Materials', description: '50kg Maida, Sugar, Butter consignment', amount: 8500, paymentMode: 'UPI', recordedBy: 'Admin' },
];

export const INITIAL_CASHBOOK: CashBookEntry[] = [
  { id: 'CB-1', date: '2026-09-01', voucherNo: 'VCH-01', particulars: 'Opening Cash Till Balance', account: 'Cash in Hand', mode: 'Cash', receipt: 5000, payment: 0, balance: 5000, staffName: 'Admin' },
  { id: 'CB-2', date: '2026-09-01', voucherNo: 'VCH-02', particulars: 'Rent Payment - Sept', account: 'Rent Expense', mode: 'UPI', receipt: 0, payment: 22000, balance: -17000, staffName: 'Admin' },
  { id: 'CB-3', date: '2026-09-03', voucherNo: 'INV-1045', particulars: 'Sale receipt: Anil Kumar', account: 'Sales Account', mode: 'UPI', receipt: 550, payment: 0, balance: -16450, staffName: 'Rahul V.' },
  { id: 'CB-4', date: '2026-09-03', voucherNo: 'INV-1046', particulars: 'Partial Payment: Suresh Menon', account: 'Sales Account', mode: 'Cash', receipt: 400, payment: 0, balance: -16050, staffName: 'Rahul V.' },
  { id: 'CB-5', date: '2026-09-03', voucherNo: 'EXP-103', particulars: 'Packaging materials cash purchase', account: 'Packaging Expense', mode: 'Cash', receipt: 0, payment: 2100, balance: -18150, staffName: 'Admin' },
  { id: 'CB-6', date: '2026-09-04', voucherNo: 'INV-1047', particulars: 'Sale: Walk-in Customer', account: 'Sales Account', mode: 'Cash', receipt: 170, payment: 0, balance: -17980, staffName: 'Priya Nair' },
];

export const INITIAL_ATTENDANCE: StaffAttendance[] = [
  { id: 'ATT-1', date: '2026-09-03', userId: 'USR-002', userName: 'Rahul V. (Cashier)', status: 'Present', checkIn: '08:30', checkOut: '20:30', notes: 'Full day shift' },
  { id: 'ATT-2', date: '2026-09-03', userId: 'USR-003', userName: 'Priya Nair (Billing Counter)', status: 'Present', checkIn: '09:00', checkOut: '21:00', notes: 'Full day shift' },
  { id: 'ATT-3', date: '2026-09-04', userId: 'USR-002', userName: 'Rahul V. (Cashier)', status: 'Present', checkIn: '08:30', checkOut: '20:30', notes: 'On time' },
  { id: 'ATT-4', date: '2026-09-04', userId: 'USR-003', userName: 'Priya Nair (Billing Counter)', status: 'Present', checkIn: '09:15', checkOut: '21:15', notes: 'Evening rush handled' },
  { id: 'ATT-5', date: '2026-09-05', userId: 'USR-002', userName: 'Rahul V. (Cashier)', status: 'Present', checkIn: '08:25', checkOut: '17:00' },
  { id: 'ATT-6', date: '2026-09-05', userId: 'USR-003', userName: 'Priya Nair (Billing Counter)', status: 'Present', checkIn: '08:50', checkOut: '18:00' },
];

export const INITIAL_SALARIES: StaffSalaryPayment[] = [
  {
    id: 'SAL-01',
    date: '2026-09-01',
    userId: 'USR-002',
    userName: 'Rahul V. (Cashier)',
    month: '2026-08',
    monthlyBaseSalary: 18000,
    daysPresent: 28,
    overtimeHours: 12,
    bonus: 1000,
    deductions: 500,
    netPaid: 18500,
    paymentMode: 'Bank Transfer',
    voucherNo: 'SAL-AUG-02',
    paidBy: 'Admin',
    notes: 'August salary cleared with festive bonus'
  },
  {
    id: 'SAL-02',
    date: '2026-09-01',
    userId: 'USR-003',
    userName: 'Priya Nair (Billing Counter)',
    month: '2026-08',
    monthlyBaseSalary: 16500,
    daysPresent: 27,
    overtimeHours: 6,
    bonus: 800,
    deductions: 0,
    netPaid: 17300,
    paymentMode: 'UPI',
    voucherNo: 'SAL-AUG-03',
    paidBy: 'Admin',
    notes: 'August salary cleared via GooglePay'
  },
];

export const INITIAL_JOURNALS: JournalEntry[] = [
  { id: 'JRN-1', date: '2026-09-01', voucherNo: 'JV-101', description: 'Opening Cash Introduced into Cash Till', debitAccount: '1010 - Cash in Till', creditAccount: '3010 - Owner Capital', amount: 5000, referenceType: 'Manual', createdBy: 'Admin' },
  { id: 'JRN-2', date: '2026-09-01', voucherNo: 'JV-102', description: 'Bakery Shop Rent paid for September', debitAccount: '5010 - Shop Rent Expense', creditAccount: '1020 - Bank / UPI Account', amount: 22000, referenceType: 'Expense', referenceId: 'EXP-101', createdBy: 'Admin' },
  { id: 'JRN-3', date: '2026-09-01', voucherNo: 'JV-103', description: 'Staff Salary Disbursed for Rahul V. (August)', debitAccount: '5030 - Staff Wages & Salary', creditAccount: '1020 - Bank / UPI Account', amount: 18500, referenceType: 'Salary', referenceId: 'SAL-01', createdBy: 'Admin' },
  { id: 'JRN-4', date: '2026-09-01', voucherNo: 'JV-104', description: 'Staff Salary Disbursed for Priya Nair (August)', debitAccount: '5030 - Staff Wages & Salary', creditAccount: '1020 - Bank / UPI Account', amount: 17300, referenceType: 'Salary', referenceId: 'SAL-02', createdBy: 'Admin' },
  { id: 'JRN-5', date: '2026-09-02', voucherNo: 'JV-105', description: 'KSEB Commercial Electricity Power Bill payment', debitAccount: '5020 - Electricity Expense', creditAccount: '1020 - Bank / UPI Account', amount: 4850, referenceType: 'Expense', referenceId: 'EXP-102', createdBy: 'Admin' },
  { id: 'JRN-6', date: '2026-09-03', voucherNo: 'JV-106', description: 'Counter Sale - Anil Kumar (Full UPI)', debitAccount: '1020 - Bank / UPI Account', creditAccount: '4010 - Sales Revenue', amount: 550, referenceType: 'Sale', referenceId: 'INV-1045', createdBy: 'Rahul V.' },
  { id: 'JRN-7', date: '2026-09-03', voucherNo: 'JV-107', description: 'Credit Sale - Suresh Menon (Cash 400, Due 180)', debitAccount: '1010 - Cash in Till', creditAccount: '4010 - Sales Revenue', amount: 400, referenceType: 'Sale', referenceId: 'INV-1046', createdBy: 'Rahul V.' },
  { id: 'JRN-8', date: '2026-09-03', voucherNo: 'JV-108', description: 'Customer Debtor Balance posted: Suresh Menon', debitAccount: '1030 - Accounts Receivable', creditAccount: '4010 - Sales Revenue', amount: 180, referenceType: 'Sale', referenceId: 'INV-1046', createdBy: 'Rahul V.' },
  { id: 'JRN-9', date: '2026-09-04', voucherNo: 'JV-109', description: 'Counter Sale - Walk-in Customer (Cash)', debitAccount: '1010 - Cash in Till', creditAccount: '4010 - Sales Revenue', amount: 170, referenceType: 'Sale', referenceId: 'INV-1047', createdBy: 'Priya Nair' },
];
