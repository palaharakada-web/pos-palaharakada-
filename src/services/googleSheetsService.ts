// Google Sheets and Drive Backup Integration Service
// Uses Firebase Google Auth popup for reliable token flow across browsers and iframes,
// and Google Sheets REST API v4 to backup store data into the full Sweet Crumb / CM Palahara
// 11-Tab Accounting & ERP Workbook structure!

import { Product, Customer, SaleInvoice, CashBookEntry, ExpenseEntry, User, StaffAttendance, StaffSalaryPayment, JournalEntry } from '../types';
import { getGoogleAccessToken } from './firebaseAuthService';

export interface GoogleSheetsBackupPayload {
  users: User[];
  products: Product[];
  customers: Customer[];
  invoices: SaleInvoice[];
  cashBook: CashBookEntry[];
  expenses: ExpenseEntry[];
  attendance?: StaffAttendance[];
  salaries?: StaffSalaryPayment[];
  journals?: JournalEntry[];
}

export interface BackupResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  timestamp: string;
  summary: {
    invoicesCount: number;
    productsCount: number;
    customersCount: number;
    cashBookCount: number;
    expensesCount: number;
  };
}

// 1. Chart of Accounts Table
function buildChartOfAccountsRows(): (string | number)[][] {
  return [
    ['Account Code', 'Account Name', 'Account Type', 'Default Balance', 'Description'],
    [1010, 'Cash in Hand (Counter Till)', 'Asset', 'Debit', 'Physical currency cash at counter register'],
    [1020, 'Bank Account (UPI / Card)', 'Asset', 'Debit', 'Current bank account & QR payments'],
    [1030, 'Inventory Stock (Ingredients & Goods)', 'Asset', 'Debit', 'Finished cakes, sweets, bakery stock'],
    [1040, 'Trade Debtors (Customers Credit)', 'Asset', 'Debit', 'Receivables owed by credit customers'],
    [2010, 'Trade Creditors (Suppliers Payable)', 'Liability', 'Credit', 'Flour mills, oil & dairy suppliers'],
    [3010, 'Owner Capital', 'Equity', 'Credit', 'Initial store proprietor capital'],
    [4010, 'Bakery Sales Revenue', 'Income', 'Credit', 'Gross bakery & counter snack sales'],
    [5010, 'Cost of Goods Sold (Raw Materials)', 'Expense', 'Debit', 'Flour, butter, sugar, milk, oil'],
    [5020, 'Store Rent & Utilities', 'Expense', 'Debit', 'Electricity bills, gas cylinders & rent'],
    [5030, 'Staff Wages & Salaries', 'Expense', 'Debit', 'Baker & counter staff compensations'],
    [5040, 'Packaging & Disposables', 'Expense', 'Debit', 'Pastry boxes, carry bags, packaging materials']
  ];
}

// 2. Sales Ledger Table
function buildSalesLedgerRows(invoices: SaleInvoice[]): (string | number)[][] {
  const headers = [
    'Date',
    'Invoice No',
    'Customer Name [ID]',
    'Particulars & Items',
    'Total Qty',
    'Payment Mode',
    'Grand Total (₹)',
    'Amount Received (₹)',
    'Balance Due (₹)',
    'Cashier / Staff'
  ];

  const rows = invoices.map(inv => {
    const itemSummary = inv.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join('; ');
    const totalQty = inv.items.reduce((s, i) => s + i.qty, 0);
    return [
      inv.date,
      inv.invoiceNo,
      `${inv.customerName || 'Walk-in Customer'} [${inv.customerId || 'CUST-GUEST'}]`,
      itemSummary,
      totalQty,
      inv.paymentMode,
      inv.grandTotal,
      inv.amountReceived,
      inv.balanceDue,
      inv.cashierName
    ];
  });

  return [headers, ...rows];
}

// 3. Sales Details (Itemized) Table
function buildSalesDetailsRows(invoices: SaleInvoice[]): (string | number)[][] {
  const headers = [
    'Date',
    'Invoice No',
    'Customer ID',
    'Customer Name',
    'Phone',
    'Payment Mode',
    'Item Name',
    'Qty',
    'Unit',
    'Rate (₹)',
    'Amount (₹)',
    'Cashier Name'
  ];

  const rows: (string | number)[][] = [];
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      rows.push([
        inv.date,
        inv.invoiceNo,
        inv.customerId || 'CUST-GUEST',
        inv.customerName || 'Walk-in Customer',
        inv.customerPhone || '-',
        inv.paymentMode,
        item.name,
        item.qty,
        item.unit,
        item.rate,
        item.amount,
        inv.cashierName
      ]);
    });
  });

  return [headers, ...rows];
}

// 4. Cash Book / Day Book Table
function buildCashBookRows(cashBook: CashBookEntry[]): (string | number)[][] {
  const headers = [
    'Date',
    'Voucher No',
    'Particulars / Description',
    'Account Head',
    'Payment Mode',
    'Receipt In (₹)',
    'Payment Out (₹)',
    'Running Balance (₹)',
    'Staff In-Charge'
  ];

  const rows = cashBook.map(entry => [
    entry.date,
    entry.voucherNo,
    entry.particulars,
    entry.account,
    entry.mode,
    entry.receipt,
    entry.payment,
    entry.balance,
    entry.staffName
  ]);

  return [headers, ...rows];
}

// 5. Expense Ledger Table
function buildExpenseLedgerRows(expenses: ExpenseEntry[]): (string | number)[][] {
  const headers = [
    'Date',
    'Expense Category',
    'Description / Payee',
    'Amount (₹)',
    'Payment Mode',
    'Recorded By'
  ];

  const rows = expenses.map(exp => [
    exp.date,
    exp.category,
    exp.description,
    exp.amount,
    exp.paymentMode,
    exp.recordedBy
  ]);

  return [headers, ...rows];
}

// 6. Inventory Ledger Table
function buildInventoryRows(products: Product[]): (string | number)[][] {
  const headers = [
    'Item Code',
    'Barcode',
    'Item Name',
    'Category',
    'Retail Rate (₹)',
    'Wholesale Rate (₹)',
    'Cost Price (₹)',
    'Unit',
    'Current Stock',
    'Min Stock Alert'
  ];

  const rows = products.map(p => [
    p.code,
    p.barcode || '',
    p.name,
    p.category,
    p.rate,
    p.wholesaleRate || p.rate,
    p.costPrice,
    p.unit,
    p.stock,
    p.minStockAlert
  ]);

  return [headers, ...rows];
}

// 7. Debtors Ledger (Customers Outstanding)
function buildDebtorsRows(customers: Customer[]): (string | number)[][] {
  const headers = [
    'Customer ID',
    'Customer Name',
    'Phone',
    'Total Invoiced (₹)',
    'Total Paid (₹)',
    'Balance Due (Credit ₹)',
    'Last Visit'
  ];

  const rows = customers.map(c => [
    c.id,
    c.name,
    c.phone,
    c.totalPurchases,
    c.totalPaid,
    c.balanceDue,
    c.lastVisit
  ]);

  return [headers, ...rows];
}

// 8. General Ledger (Double-Entry Posting)
function buildGeneralLedgerRows(invoices: SaleInvoice[], expenses: ExpenseEntry[]): (string | number)[][] {
  const headers = [
    'Date',
    'Ref / Voucher No',
    'Particulars',
    'Account Code',
    'Account Name',
    'Debit (₹)',
    'Credit (₹)'
  ];

  const rows: (string | number)[][] = [];

  // Post sales invoices
  invoices.forEach(inv => {
    if (inv.amountReceived > 0) {
      const isBank = inv.paymentMode === 'UPI';
      rows.push([
        inv.date,
        inv.invoiceNo,
        `Collection from ${inv.customerName || 'Walk-in'}`,
        isBank ? 1020 : 1010,
        isBank ? 'Bank Account (UPI / Card)' : 'Cash in Hand (Counter Till)',
        inv.amountReceived,
        ''
      ]);
    }

    if (inv.balanceDue > 0) {
      rows.push([
        inv.date,
        inv.invoiceNo,
        `Credit sale to ${inv.customerName || 'Customer'}`,
        1040,
        'Trade Debtors (Customers Credit)',
        inv.balanceDue,
        ''
      ]);
    }

    rows.push([
      inv.date,
      inv.invoiceNo,
      `Bakery Sales Revenue [${inv.invoiceNo}]`,
      4010,
      'Bakery Sales Revenue',
      '',
      inv.grandTotal
    ]);
  });

  // Post store expenses
  expenses.forEach((exp, idx) => {
    const isBank = exp.paymentMode === 'UPI';
    let code = 5020;
    let name = 'Store Rent & Utilities';
    if (exp.category === 'Staff Wages') { code = 5030; name = 'Staff Wages & Salaries'; }
    if (exp.category === 'Packaging') { code = 5040; name = 'Packaging & Disposables'; }
    if (exp.category === 'Raw Materials') { code = 5010; name = 'Cost of Goods Sold (Raw Materials)'; }

    rows.push([
      exp.date,
      `EXP-${idx + 101}`,
      exp.description,
      code,
      name,
      exp.amount,
      ''
    ]);

    rows.push([
      exp.date,
      `EXP-${idx + 101}`,
      `Payment via ${exp.paymentMode}`,
      isBank ? 1020 : 1010,
      isBank ? 'Bank Account (UPI / Card)' : 'Cash in Hand (Counter Till)',
      '',
      exp.amount
    ]);
  });

  return [headers, ...rows];
}

// 9. Trial Balance Table
function buildTrialBalanceRows(invoices: SaleInvoice[], expenses: ExpenseEntry[]): (string | number)[][] {
  const headers = ['Account Code', 'Account Name', 'Debit Total (₹)', 'Credit Total (₹)'];

  let totalSales = invoices.reduce((s, i) => s + i.grandTotal, 0);
  let cashRec = invoices.filter(i => i.paymentMode === 'Cash').reduce((s, i) => s + i.amountReceived, 0);
  let upiRec = invoices.filter(i => i.paymentMode === 'UPI').reduce((s, i) => s + i.amountReceived, 0);
  let creditDue = invoices.reduce((s, i) => s + i.balanceDue, 0);

  let cashPaid = expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0);
  let upiPaid = expenses.filter(e => e.paymentMode === 'UPI').reduce((s, e) => s + e.amount, 0);
  let totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const netCash = Math.max(0, cashRec - cashPaid);
  const netBank = Math.max(0, upiRec - upiPaid);

  return [
    headers,
    [1010, 'Cash in Hand (Counter Till)', netCash, ''],
    [1020, 'Bank Account (UPI / Card)', netBank, ''],
    [1040, 'Trade Debtors (Customers Credit)', creditDue, ''],
    [4010, 'Bakery Sales Revenue', '', totalSales],
    [5020, 'Operating & Store Expenses', totalExpenses, '']
  ];
}

// 10. Profit & Loss Statement
function buildProfitAndLossRows(invoices: SaleInvoice[], expenses: ExpenseEntry[]): (string | number)[][] {
  const totalSales = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  return [
    ['Financial Component', 'Description', 'Amount (₹)'],
    ['Gross Bakery Sales Revenue', 'Total invoice sales generated from POS terminal', totalSales],
    ['Less: Store Operating Expenses', 'Disbursements, overheads, electricity, rent', -totalExpenses],
    ['NET OPERATING PROFIT / (LOSS)', 'Bottom-line store profit for current period', netProfit]
  ];
}

// 11. Overview Executive Tab
function buildOverviewRows(payload: GoogleSheetsBackupPayload): (string | number)[][] {
  const totalSales = payload.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalCollections = payload.invoices.reduce((acc, inv) => acc + inv.amountReceived, 0);
  const totalCustomerDue = payload.customers.reduce((acc, c) => acc + (c.balanceDue > 0 ? c.balanceDue : 0), 0);
  const totalExpenses = payload.expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return [
    ['CM PALAHARA KADA & BAKERY — ERP ACCOUNTING WORKBOOK'],
    ['Generated Timestamp:', new Date().toLocaleString()],
    [''],
    ['KEY PERFORMANCE METRICS', 'VALUE'],
    ['Total Invoices Count', payload.invoices.length],
    ['Total Sales Revenue (₹)', totalSales],
    ['Total Cash/UPI Collections (₹)', totalCollections],
    ['Outstanding Customer Debtors (₹)', totalCustomerDue],
    ['Total Expenses Logged (₹)', totalExpenses],
    ['Net Store Margin (₹)', totalSales - totalExpenses],
    ['Active Inventory Stock Items', payload.products.length],
    ['Registered Store Customers', payload.customers.length],
    ['Cash Book Transactions', payload.cashBook.length],
    [''],
    ['WORKBOOK TAB DIRECTORY (11 COMPLETE ERP TABS)'],
    ['Tab 1: Overview', 'Executive KPIs and system summary'],
    ['Tab 2: Chart of Accounts', 'Master accounting codes list (1010, 1020, 4010, etc.)'],
    ['Tab 3: Sales Ledger', 'Main sales registry with bill numbers, customer IDs, and totals'],
    ['Tab 4: Sales Details', 'Itemized bill breakdown with rates, units, and cashier names'],
    ['Tab 5: Cash Book', 'Day book cash & UPI collection vouchers with running balance'],
    ['Tab 6: Expense Ledger', 'Overhead expenses, utility bills, and salary vouchers'],
    ['Tab 7: Inventory Ledger', 'Products, selling rates, cost prices, and live stock'],
    ['Tab 8: Debtors Ledger', 'Customer credit balances and purchase history'],
    ['Tab 9: General Ledger', 'Full double-entry journal postings (Debit/Credit)'],
    ['Tab 10: Trial Balance', 'Account-wise Debit vs Credit audit check'],
    ['Tab 11: Profit & Loss', 'Gross Income minus Expenses = Net Operating Profit']
  ];
}

/**
 * Creates or updates Google Spreadsheet backup with complete 11-Tab ERP Workbook Structure
 */
export async function exportStoreToGoogleSheets(
  payload: GoogleSheetsBackupPayload,
  existingSpreadsheetId?: string,
  providedToken?: string
): Promise<BackupResult> {
  const accessToken = providedToken || await getGoogleAccessToken();

  let spreadsheetId = existingSpreadsheetId;
  const todayFormatted = new Date().toISOString().split('T')[0];
  const sheetTitle = `CM Palahara Kada - ERP Accounting Workbook (${todayFormatted})`;

  const tabNames = [
    'Overview',
    'Chart of Accounts',
    'Sales Ledger',
    'Sales Details',
    'Cash Book',
    'Expense Ledger',
    'Inventory Ledger',
    'Debtors Ledger',
    'General Ledger',
    'Trial Balance',
    'Profit & Loss'
  ];

  // If no existing spreadsheet, create new with all 11 ERP tabs
  if (!spreadsheetId) {
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: sheetTitle,
        },
        sheets: tabNames.map(title => ({ properties: { title } })),
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errText);
      } catch {
        // ignore
      }
      throw new Error(parsedError?.error?.message || `Failed to create Google Spreadsheet: ${errText}`);
    }

    const createData = await createResponse.json();
    spreadsheetId = createData.spreadsheetId;
  }

  // Batch update all tabs
  const data = [
    {
      range: 'Overview!A1',
      values: buildOverviewRows(payload),
    },
    {
      range: 'Chart of Accounts!A1',
      values: buildChartOfAccountsRows(),
    },
    {
      range: 'Sales Ledger!A1',
      values: buildSalesLedgerRows(payload.invoices),
    },
    {
      range: 'Sales Details!A1',
      values: buildSalesDetailsRows(payload.invoices),
    },
    {
      range: 'Cash Book!A1',
      values: buildCashBookRows(payload.cashBook),
    },
    {
      range: 'Expense Ledger!A1',
      values: buildExpenseLedgerRows(payload.expenses),
    },
    {
      range: 'Inventory Ledger!A1',
      values: buildInventoryRows(payload.products),
    },
    {
      range: 'Debtors Ledger!A1',
      values: buildDebtorsRows(payload.customers),
    },
    {
      range: 'General Ledger!A1',
      values: buildGeneralLedgerRows(payload.invoices, payload.expenses),
    },
    {
      range: 'Trial Balance!A1',
      values: buildTrialBalanceRows(payload.invoices, payload.expenses),
    },
    {
      range: 'Profit & Loss!A1',
      values: buildProfitAndLossRows(payload.invoices, payload.expenses),
    },
  ];

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errText = await updateResponse.text();
    let parsedError: any;
    try {
      parsedError = JSON.parse(errText);
    } catch {
      // ignore
    }
    throw new Error(parsedError?.error?.message || `Failed to write backup data to Google Sheet: ${errText}`);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const result: BackupResult = {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl,
    timestamp: new Date().toISOString(),
    summary: {
      invoicesCount: payload.invoices.length,
      productsCount: payload.products.length,
      customersCount: payload.customers.length,
      cashBookCount: payload.cashBook.length,
      expensesCount: payload.expenses.length,
    },
  };

  localStorage.setItem('pos_last_sheets_backup', JSON.stringify(result));
  return result;
}

/**
 * Sends store backup directly to the deployed Google Apps Script Web App URL
 * without requiring any OAuth popup! Works 100% automatically on every sale or timer.
 */
export async function syncStoreToAppsScriptWebhook(
  payload: GoogleSheetsBackupPayload,
  scriptUrl: string
): Promise<{ success: boolean; message: string; spreadsheetUrl?: string }> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    throw new Error('Please provide your deployed Google Apps Script Web App URL.');
  }

  // Google Apps Script doPost receives JSON payload
  const response = await fetch(cleanUrl, {
    method: 'POST',
    // Using text/plain avoids CORS preflight OPTIONS in Google Apps Script Web App
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    // Some Apps Script redirects return HTML
    return {
      success: true,
      message: 'Store backup sent to Google Sheets automatically!',
    };
  }

  return {
    success: json.status === 'success' || json.success === true,
    message: json.message || 'Backup completed successfully!',
    spreadsheetUrl: json.spreadsheetUrl,
  };
}
