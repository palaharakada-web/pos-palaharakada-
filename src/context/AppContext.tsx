import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Product,
  Customer,
  SaleInvoice,
  CashBookEntry,
  ExpenseEntry,
  CartItem,
  PaymentMode,
  StaffAttendance,
  StaffSalaryPayment,
  JournalEntry,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CASHBOOK,
  INITIAL_ATTENDANCE,
  INITIAL_SALARIES,
  INITIAL_JOURNALS,
} from '../data/seedData';
import { syncStoreToAppsScriptWebhook } from '../services/googleSheetsService';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  customers: Customer[];
  invoices: SaleInvoice[];
  expenses: ExpenseEntry[];
  cashBook: CashBookEntry[];
  attendance: StaffAttendance[];
  salaries: StaffSalaryPayment[];
  journals: JournalEntry[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (loginId: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (loginId: string) => void;
  changePassword: (oldPin: string, newPin: string) => { success: boolean; message?: string };
  // POS & Sales
  createSale: (data: {
    customerName: string;
    customerPhone: string;
    items: CartItem[];
    paymentMode: PaymentMode;
    amountReceived: number;
    discount?: number;
    tax?: number;
    notes?: string;
    customDate?: string;
  }) => SaleInvoice;
  // Inventory
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // Staff
  addStaff: (staffData: { loginId: string; name: string; pin: string; phone?: string; role: 'admin' | 'staff'; baseSalary?: number }) => { success: boolean; message?: string };
  toggleStaffStatus: (id: string) => void;
  updateStaffPin: (id: string, newPin: string) => void;
  updateStaffSalaryRate: (id: string, baseSalary: number) => void;
  // Staff Attendance & Salary
  markAttendance: (record: Omit<StaffAttendance, 'id'>) => void;
  recordSalaryPayment: (salary: Omit<StaffSalaryPayment, 'id' | 'voucherNo' | 'paidBy'>) => void;
  // Accounts Department
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'voucherNo' | 'createdBy'>) => void;
  // Customer & Credit
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'balanceDue' | 'lastVisit'>) => Customer;
  recordCustomerPayment: (customerId: string, amount: number, paymentMode: 'Cash' | 'UPI', note?: string) => void;
  // Expenses
  addExpense: (expense: Omit<ExpenseEntry, 'id' | 'recordedBy'>) => void;
  // Auto-backup configuration
  autoBackupEnabled: boolean;
  setAutoBackupEnabled: (enabled: boolean) => void;
  autoBackupInterval: number; // in minutes (0 = only on sale, 5, 15, 30, 60)
  setAutoBackupInterval: (interval: number) => void;
  appsScriptWebhookUrl: string;
  setAppsScriptWebhookUrl: (url: string) => void;
  triggerAutoBackup: () => Promise<void>;
  isAutoBackingUp: boolean;
  lastAutoBackupTime: string | null;
  // System
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USERS[0];
      }
    }
    // Default to admin for immediate exploration, but user switcher is always visible
    return INITIAL_USERS[0];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => {
    const saved = localStorage.getItem('pos_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    const saved = localStorage.getItem('pos_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [cashBook, setCashBook] = useState<CashBookEntry[]>(() => {
    const saved = localStorage.getItem('pos_cashbook');
    return saved ? JSON.parse(saved) : INITIAL_CASHBOOK;
  });

  const [attendance, setAttendance] = useState<StaffAttendance[]>(() => {
    const saved = localStorage.getItem('pos_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [salaries, setSalaries] = useState<StaffSalaryPayment[]>(() => {
    const saved = localStorage.getItem('pos_salaries');
    return saved ? JSON.parse(saved) : INITIAL_SALARIES;
  });

  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('pos_journals');
    return saved ? JSON.parse(saved) : INITIAL_JOURNALS;
  });

  const [activeTab, setActiveTabState] = useState<string>('pos');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Auto-backup states
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pos_auto_backup_enabled') !== 'false'; // default true
  });
  const [autoBackupInterval, setAutoBackupInterval] = useState<number>(() => {
    return Number(localStorage.getItem('pos_auto_backup_interval')) || 15; // default every 15 mins
  });
  const [appsScriptWebhookUrl, setAppsScriptWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('pos_appsscript_webhook_url') || '';
  });
  const [isAutoBackingUp, setIsAutoBackingUp] = useState<boolean>(false);
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('pos_last_auto_backup_time') || null;
  });

  useEffect(() => {
    localStorage.setItem('pos_auto_backup_enabled', String(autoBackupEnabled));
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem('pos_auto_backup_interval', String(autoBackupInterval));
  }, [autoBackupInterval]);

  useEffect(() => {
    localStorage.setItem('pos_appsscript_webhook_url', appsScriptWebhookUrl);
  }, [appsScriptWebhookUrl]);

  // Automated backup function
  const triggerAutoBackup = async () => {
    const payload = {
      users,
      products,
      customers,
      invoices,
      cashBook,
      expenses,
      attendance,
      salaries,
      journals,
    };

    // 1. Always save timestamped local snapshot in browser
    const nowIso = new Date().toISOString();
    localStorage.setItem('pos_auto_local_snapshot', JSON.stringify({
      timestamp: nowIso,
      payload,
    }));
    setLastAutoBackupTime(nowIso);
    localStorage.setItem('pos_last_auto_backup_time', nowIso);

    // 2. If Webhook URL is configured, push straight to Google Sheets
    if (appsScriptWebhookUrl.trim()) {
      try {
        setIsAutoBackingUp(true);
        await syncStoreToAppsScriptWebhook(payload, appsScriptWebhookUrl.trim());
      } catch (err) {
        console.warn('Background auto backup to Google Apps Script failed:', err);
      } finally {
        setIsAutoBackingUp(false);
      }
    }
  };

  // Timer-based automated backup
  useEffect(() => {
    if (!autoBackupEnabled || autoBackupInterval <= 0) return;

    const intervalMs = autoBackupInterval * 60 * 1000;
    const timer = setInterval(() => {
      triggerAutoBackup();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoBackupEnabled, autoBackupInterval, users, products, customers, invoices, cashBook, expenses, attendance, salaries, journals, appsScriptWebhookUrl]);

  // Auto enforce role boundaries: staff can ONLY access 'pos' or 'search'
  const setActiveTab = (tab: string) => {
    if (currentUser && currentUser.role === 'staff') {
      if (tab !== 'pos' && tab !== 'search') {
        setActiveTabState('pos');
        return;
      }
    }
    setActiveTabState(tab);
  };

  // Guard activeTab if user changes
  useEffect(() => {
    if (currentUser?.role === 'staff' && activeTab !== 'pos' && activeTab !== 'search') {
      setActiveTabState('pos');
    }
  }, [currentUser, activeTab]);

  // Persist states
  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pos_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pos_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pos_cashbook', JSON.stringify(cashBook));
  }, [cashBook]);

  useEffect(() => {
    localStorage.setItem('pos_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('pos_salaries', JSON.stringify(salaries));
  }, [salaries]);

  useEffect(() => {
    localStorage.setItem('pos_journals', JSON.stringify(journals));
  }, [journals]);

  // Authentication methods
  const login = (loginId: string, pin: string) => {
    const cleanId = loginId.trim().toLowerCase();
    const found = users.find(
      (u) => u.loginId.toLowerCase() === cleanId && u.pin === pin.trim()
    );

    if (!found) {
      return { success: false, message: 'Invalid Login ID or PIN / Password.' };
    }

    if (!found.active) {
      return { success: false, message: 'This account has been disabled by Admin.' };
    }

    const updatedUser = {
      ...found,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
    setIsLoginModalOpen(false);

    if (updatedUser.role === 'staff') {
      setActiveTabState('pos');
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const switchUser = (loginId: string) => {
    const found = users.find((u) => u.loginId.toLowerCase() === loginId.toLowerCase());
    if (found && found.active) {
      setCurrentUser(found);
      if (found.role === 'staff') {
        setActiveTabState('pos');
      }
    }
  };

  const changePassword = (oldPin: string, newPin: string) => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }
    if (currentUser.pin !== oldPin.trim()) {
      return { success: false, message: 'Current password/PIN is incorrect.' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'New password/PIN must be at least 4 digits/characters.' };
    }

    const updatedUser = { ...currentUser, pin: newPin.trim() };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    triggerAutoBackupAfterChange();
    return { success: true };
  };

  const triggerAutoBackupAfterChange = () => {
    if (autoBackupEnabled) {
      setTimeout(() => {
        triggerAutoBackup();
      }, 400);
    }
  };

  // Helper to find or create customer
  const getOrCreateCustomer = (name: string, phone: string): Customer => {
    const cleanName = (name || 'Walk-in Customer').trim();
    const cleanPhone = (phone || '').trim();

    if (cleanName === 'Walk-in Customer' && !cleanPhone) {
      return {
        id: 'CUST-GUEST',
        name: 'Walk-in Customer',
        phone: '',
        totalPurchases: 0,
        totalPaid: 0,
        balanceDue: 0,
        lastVisit: new Date().toISOString().split('T')[0],
      };
    }

    // Match by phone first
    if (cleanPhone) {
      const matchByPhone = customers.find((c) => c.phone === cleanPhone);
      if (matchByPhone) return matchByPhone;
    }

    // Match by exact name
    const matchByName = customers.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (matchByName) return matchByName;

    // Create new customer
    const nextNum = 1000 + customers.length + 1;
    const newCustomer: Customer = {
      id: `CUST-${nextNum}`,
      name: cleanName,
      phone: cleanPhone,
      totalPurchases: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastVisit: new Date().toISOString().split('T')[0],
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  // Create Sale
  const createSale = (data: {
    customerName: string;
    customerPhone: string;
    items: CartItem[];
    paymentMode: PaymentMode;
    amountReceived: number;
    discount?: number;
    tax?: number;
    notes?: string;
    customDate?: string;
  }): SaleInvoice => {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const discount = Number(data.discount) || 0;
    const tax = Number(data.tax) || 0;
    const grandTotal = Math.max(0, subtotal - discount + tax);
    const amountReceived = Number(data.amountReceived) || 0;
    const balanceDue = Math.max(0, grandTotal - amountReceived);

    // Generate next invoice ID
    let maxNum = 1000;
    invoices.forEach((inv) => {
      const match = inv.invoiceNo.match(/INV-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    const nextInvoiceNo = `INV-${maxNum + 1}`;

    const now = new Date();
    const dateStr = data.customDate || now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const customer = getOrCreateCustomer(data.customerName, data.customerPhone);

    const newInvoice: SaleInvoice = {
      invoiceNo: nextInvoiceNo,
      date: dateStr,
      time: timeStr,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      cashierId: currentUser?.loginId || 'staff',
      cashierName: currentUser?.name || 'Staff Counter',
      items: data.items,
      subtotal,
      discount,
      tax,
      grandTotal,
      amountReceived,
      balanceDue,
      paymentMode: data.paymentMode,
      notes: data.notes,
    };

    // 1. Add invoice
    setInvoices((prev) => [newInvoice, ...prev]);

    // 2. Update Product Inventory Stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = data.items.find((item) => item.productId === p.id);
        if (cartMatch) {
          // If sold in grams and base unit is kg, deduct qty / 1000
          const deductQty =
            cartMatch.unit === 'gram' && p.unit === 'kg'
              ? cartMatch.qty / 1000
              : cartMatch.qty;
          return {
            ...p,
            stock: Math.max(0, parseFloat((p.stock - deductQty).toFixed(3))),
          };
        }
        return p;
      })
    );

    // 3. Update Customer records
    if (customer.id !== 'CUST-GUEST') {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + grandTotal,
              totalPaid: c.totalPaid + Math.min(grandTotal, amountReceived),
              balanceDue: c.balanceDue + balanceDue,
              lastVisit: dateStr,
            };
          }
          return c;
        })
      );
    }

    // 4. Record received amount into Cash Book
    if (amountReceived > 0) {
      const mode = data.paymentMode === 'UPI' ? 'UPI' : 'Cash';
      const lastEntry = cashBook[cashBook.length - 1];
      const previousBal = lastEntry ? lastEntry.balance : 0;
      const newBal = previousBal + amountReceived;

      const newCashEntry: CashBookEntry = {
        id: `CB-${Date.now()}`,
        date: dateStr,
        voucherNo: nextInvoiceNo,
        particulars: `Sale: ${customer.name} [${customer.id}]`,
        account: 'Sales Revenue',
        mode: mode,
        receipt: amountReceived,
        payment: 0,
        balance: newBal,
        staffName: currentUser?.name || 'Staff',
      };

      setCashBook((prev) => [...prev, newCashEntry]);
    }

    // 5. Automated Backup Trigger after sale completes
    if (autoBackupEnabled) {
      setTimeout(() => {
        triggerAutoBackup();
      }, 500);
    }

    return newInvoice;
  };

  // Inventory actions
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const id = `PRD-${Date.now().toString().slice(-4)}`;
    const newProduct: Product = { ...productData, id };
    setProducts((prev) => [newProduct, ...prev]);
    triggerAutoBackupAfterChange();
  };

  const updateProduct = (id: string, changes: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    triggerAutoBackupAfterChange();
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    triggerAutoBackupAfterChange();
  };

  // Staff management
  const addStaff = (staffData: {
    loginId: string;
    name: string;
    pin: string;
    phone?: string;
    role: 'admin' | 'staff';
    baseSalary?: number;
  }) => {
    const cleanId = staffData.loginId.trim().toLowerCase();
    if (users.some((u) => u.loginId.toLowerCase() === cleanId)) {
      return { success: false, message: 'This Login ID already exists.' };
    }

    const newStaff: User = {
      id: `USR-${(users.length + 1).toString().padStart(3, '0')}`,
      loginId: cleanId,
      name: staffData.name.trim(),
      role: staffData.role,
      pin: staffData.pin.trim(),
      active: true,
      phone: staffData.phone?.trim(),
      baseSalary: staffData.baseSalary || 15000,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newStaff]);
    triggerAutoBackupAfterChange();
    return { success: true };
  };

  const toggleStaffStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, active: !u.active };
        }
        return u;
      })
    );
    triggerAutoBackupAfterChange();
  };

  const updateStaffPin = (id: string, newPin: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, pin: newPin.trim() };
        }
        return u;
      })
    );
    triggerAutoBackupAfterChange();
  };

  const updateStaffSalaryRate = (id: string, baseSalary: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, baseSalary: Math.max(0, baseSalary) };
        }
        return u;
      })
    );
    triggerAutoBackupAfterChange();
  };

  // Staff Attendance & Salary Payments
  const markAttendance = (record: Omit<StaffAttendance, 'id'>) => {
    const id = `ATT-${Date.now().toString().slice(-5)}`;
    const newRecord: StaffAttendance = { ...record, id };

    // Update if already marked for same user and same date, else append
    setAttendance((prev) => {
      const existsIndex = prev.findIndex((a) => a.userId === record.userId && a.date === record.date);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = { ...newRecord, id: prev[existsIndex].id };
        return copy;
      }
      return [newRecord, ...prev];
    });

    triggerAutoBackupAfterChange();
  };

  const recordSalaryPayment = (salaryData: Omit<StaffSalaryPayment, 'id' | 'voucherNo' | 'paidBy'>) => {
    const nextVch = `SAL-${Date.now().toString().slice(-4)}`;
    const id = `SAL-${Date.now()}`;
    const newPayment: StaffSalaryPayment = {
      ...salaryData,
      id,
      voucherNo: nextVch,
      paidBy: currentUser?.name || 'Admin',
    };

    setSalaries((prev) => [newPayment, ...prev]);

    // 1. Post into Cash Book
    const lastEntry = cashBook[cashBook.length - 1];
    const previousBal = lastEntry ? lastEntry.balance : 0;
    const newBal = previousBal - salaryData.netPaid;

    const cbEntry: CashBookEntry = {
      id: `CB-${Date.now()}`,
      date: salaryData.date,
      voucherNo: nextVch,
      particulars: `Staff Salary: ${salaryData.userName} (${salaryData.month})`,
      account: '5030 - Staff Wages & Salary',
      mode: salaryData.paymentMode,
      receipt: 0,
      payment: salaryData.netPaid,
      balance: newBal,
      staffName: currentUser?.name || 'Admin',
    };
    setCashBook((prev) => [...prev, cbEntry]);

    // 2. Post Journal Entry
    const jrn: JournalEntry = {
      id: `JRN-${Date.now()}`,
      date: salaryData.date,
      voucherNo: `JV-${nextVch}`,
      description: `Staff Salary Disbursed to ${salaryData.userName} for ${salaryData.month}`,
      debitAccount: '5030 - Staff Wages & Salary',
      creditAccount: salaryData.paymentMode === 'Cash' ? '1010 - Cash in Till' : '1020 - Bank / UPI Account',
      amount: salaryData.netPaid,
      referenceType: 'Salary',
      referenceId: id,
      createdBy: currentUser?.name || 'Admin',
    };
    setJournals((prev) => [jrn, ...prev]);

    triggerAutoBackupAfterChange();
  };

  // Accounts Journal Entries
  const addJournalEntry = (entryData: Omit<JournalEntry, 'id' | 'voucherNo' | 'createdBy'>) => {
    const id = `JRN-${Date.now().toString().slice(-5)}`;
    const voucherNo = `JV-${Date.now().toString().slice(-4)}`;
    const newJrn: JournalEntry = {
      ...entryData,
      id,
      voucherNo,
      createdBy: currentUser?.name || 'Admin',
    };
    setJournals((prev) => [newJrn, ...prev]);
    triggerAutoBackupAfterChange();
  };

  // Customer actions
  const addCustomer = (
    data: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'balanceDue' | 'lastVisit'>
  ): Customer => {
    const nextNum = 1000 + customers.length + 1;
    const newCustomer: Customer = {
      ...data,
      id: `CUST-${nextNum}`,
      totalPurchases: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastVisit: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    triggerAutoBackupAfterChange();
    return newCustomer;
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMode: 'Cash' | 'UPI',
    note?: string
  ) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust || amount <= 0) return;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            totalPaid: c.totalPaid + amount,
            balanceDue: Math.max(0, c.balanceDue - amount),
          };
        }
        return c;
      })
    );

    // Record in cash book
    const lastEntry = cashBook[cashBook.length - 1];
    const previousBal = lastEntry ? lastEntry.balance : 0;
    const newBal = previousBal + amount;

    const entry: CashBookEntry = {
      id: `CB-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      voucherNo: `RCT-${Date.now().toString().slice(-4)}`,
      particulars: `Credit Settlement: ${cust.name} (${note || 'Received'})`,
      account: 'Customer Debtors',
      mode: paymentMode,
      receipt: amount,
      payment: 0,
      balance: newBal,
      staffName: currentUser?.name || 'Admin',
    };

    setCashBook((prev) => [...prev, entry]);
    triggerAutoBackupAfterChange();
  };

  // Expenses
  const addExpense = (data: Omit<ExpenseEntry, 'id' | 'recordedBy'>) => {
    const newExpense: ExpenseEntry = {
      ...data,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      recordedBy: currentUser?.name || 'Admin',
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Record in cash book
    const lastEntry = cashBook[cashBook.length - 1];
    const previousBal = lastEntry ? lastEntry.balance : 0;
    const newBal = previousBal - data.amount;

    const cbEntry: CashBookEntry = {
      id: `CB-${Date.now()}`,
      date: data.date,
      voucherNo: newExpense.id,
      particulars: `${data.category}: ${data.description}`,
      account: `${data.category} Account`,
      mode: data.paymentMode,
      receipt: 0,
      payment: data.amount,
      balance: newBal,
      staffName: currentUser?.name || 'Admin',
    };

    setCashBook((prev) => [...prev, cbEntry]);
    triggerAutoBackupAfterChange();
  };

  // Reset demo data
  const resetAllData = () => {
    localStorage.removeItem('pos_users');
    localStorage.removeItem('pos_current_user');
    localStorage.removeItem('pos_products');
    localStorage.removeItem('pos_customers');
    localStorage.removeItem('pos_invoices');
    localStorage.removeItem('pos_expenses');
    localStorage.removeItem('pos_cashbook');
    localStorage.removeItem('pos_attendance');
    localStorage.removeItem('pos_salaries');
    localStorage.removeItem('pos_journals');

    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setCashBook(INITIAL_CASHBOOK);
    setAttendance(INITIAL_ATTENDANCE);
    setSalaries(INITIAL_SALARIES);
    setJournals(INITIAL_JOURNALS);
    setActiveTabState('pos');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        products,
        customers,
        invoices,
        expenses,
        cashBook,
        attendance,
        salaries,
        journals,
        activeTab,
        setActiveTab,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        switchUser,
        changePassword,
        createSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addStaff,
        toggleStaffStatus,
        updateStaffPin,
        updateStaffSalaryRate,
        markAttendance,
        recordSalaryPayment,
        addJournalEntry,
        addCustomer,
        recordCustomerPayment,
        addExpense,
        autoBackupEnabled,
        setAutoBackupEnabled,
        autoBackupInterval,
        setAutoBackupInterval,
        appsScriptWebhookUrl,
        setAppsScriptWebhookUrl,
        triggerAutoBackup,
        isAutoBackingUp,
        lastAutoBackupTime,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
