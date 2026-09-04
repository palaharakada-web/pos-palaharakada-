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
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CASHBOOK,
} from '../data/seedData';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  customers: Customer[];
  invoices: SaleInvoice[];
  expenses: ExpenseEntry[];
  cashBook: CashBookEntry[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (loginId: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (loginId: string) => void;
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
  addStaff: (staffData: { loginId: string; name: string; pin: string; phone?: string; role: 'admin' | 'staff' }) => { success: boolean; message?: string };
  toggleStaffStatus: (id: string) => void;
  updateStaffPin: (id: string, newPin: string) => void;
  // Customer & Credit
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'balanceDue' | 'lastVisit'>) => Customer;
  recordCustomerPayment: (customerId: string, amount: number, paymentMode: 'Cash' | 'UPI', note?: string) => void;
  // Expenses
  addExpense: (expense: Omit<ExpenseEntry, 'id' | 'recordedBy'>) => void;
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

  const [activeTab, setActiveTabState] = useState<string>('pos');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

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

    return newInvoice;
  };

  // Inventory actions
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const id = `PRD-${Date.now().toString().slice(-4)}`;
    const newProduct: Product = { ...productData, id };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, changes: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Staff management
  const addStaff = (staffData: {
    loginId: string;
    name: string;
    pin: string;
    phone?: string;
    role: 'admin' | 'staff';
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
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newStaff]);
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

    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setCashBook(INITIAL_CASHBOOK);
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
        activeTab,
        setActiveTab,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        switchUser,
        createSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addStaff,
        toggleStaffStatus,
        updateStaffPin,
        addCustomer,
        recordCustomerPayment,
        addExpense,
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
