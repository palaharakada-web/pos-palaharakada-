// Google Sheets and Drive Backup Integration Service
// Uses Firebase Google Auth popup for reliable token flow across browsers and iframes,
// and Google Sheets REST API v4 to backup store data.

import { Product, Customer, SaleInvoice, CashBookEntry, ExpenseEntry, User } from '../types';
import { getGoogleAccessToken, googleSignIn } from './firebaseAuthService';

export interface GoogleSheetsBackupPayload {
  users: User[];
  products: Product[];
  customers: Customer[];
  invoices: SaleInvoice[];
  cashBook: CashBookEntry[];
  expenses: ExpenseEntry[];
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

/**
 * Helper to build 2D sheet rows for each entity
 */
function buildInvoicesRows(invoices: SaleInvoice[]): (string | number)[][] {
  const headers = [
    'Invoice No',
    'Date',
    'Time',
    'Customer Name',
    'Customer Phone',
    'Payment Mode',
    'Items Summary',
    'Subtotal (₹)',
    'Discount (₹)',
    'Tax (₹)',
    'Grand Total (₹)',
    'Amount Received (₹)',
    'Balance Due (₹)',
    'Cashier Name',
    'Notes'
  ];

  const rows = invoices.map(inv => [
    inv.invoiceNo,
    inv.date,
    inv.time,
    inv.customerName || 'Walk-in Customer',
    inv.customerPhone || '-',
    inv.paymentMode,
    inv.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join('; '),
    inv.subtotal,
    inv.discount || 0,
    inv.tax || 0,
    inv.grandTotal,
    inv.amountReceived,
    inv.balanceDue,
    inv.cashierName,
    inv.notes || ''
  ]);

  return [headers, ...rows];
}

function buildProductsRows(products: Product[]): (string | number)[][] {
  const headers = [
    'Product Code',
    'Product Name',
    'Category',
    'Selling Rate (₹)',
    'Cost Price (₹)',
    'Base Unit',
    'Current Stock',
    'Min Stock Alert'
  ];

  const rows = products.map(p => [
    p.code,
    p.name,
    p.category,
    p.rate,
    p.costPrice,
    p.unit,
    p.stock,
    p.minStockAlert
  ]);

  return [headers, ...rows];
}

function buildCustomersRows(customers: Customer[]): (string | number)[][] {
  const headers = [
    'Customer Name',
    'Phone',
    'Total Purchases (₹)',
    'Total Paid (₹)',
    'Current Balance Due (₹)',
    'Last Visit'
  ];

  const rows = customers.map(c => [
    c.name,
    c.phone,
    c.totalPurchases,
    c.totalPaid,
    c.balanceDue,
    c.lastVisit
  ]);

  return [headers, ...rows];
}

function buildCashBookRows(cashBook: CashBookEntry[]): (string | number)[][] {
  const headers = [
    'Date',
    'Voucher No',
    'Particulars / Description',
    'Account Head',
    'Payment Mode',
    'Receipt In (₹)',
    'Payment Out (₹)',
    'Balance (₹)',
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

function buildExpensesRows(expenses: ExpenseEntry[]): (string | number)[][] {
  const headers = [
    'Date',
    'Category',
    'Description',
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

function buildOverviewRows(payload: GoogleSheetsBackupPayload): (string | number)[][] {
  const totalSales = payload.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalCollections = payload.invoices.reduce((acc, inv) => acc + inv.amountReceived, 0);
  const totalCustomerDue = payload.customers.reduce((acc, c) => acc + (c.balanceDue > 0 ? c.balanceDue : 0), 0);
  const totalExpenses = payload.expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return [
    ['CM PALAHARA KADA & BAKERY - STORE BACKUP & LEDGER REPORT'],
    ['Generated At:', new Date().toLocaleString()],
    [''],
    ['KEY PERFORMANCE METRICS', 'VALUE'],
    ['Total Invoices Count', payload.invoices.length],
    ['Total Sales Revenue (₹)', totalSales],
    ['Total Cash/UPI Collections (₹)', totalCollections],
    ['Outstanding Customer Credit (₹)', totalCustomerDue],
    ['Total Expenses Logged (₹)', totalExpenses],
    ['Active Inventory Items', payload.products.length],
    ['Total Registered Customers', payload.customers.length],
    ['Cash Book Transactions', payload.cashBook.length],
    [''],
    ['SHEET INDEX GUIDE'],
    ['Tab 1: Overview', 'Executive summary of key metrics and timestamps'],
    ['Tab 2: Invoices_Ledger', 'Detailed itemized billing ledger and payments'],
    ['Tab 3: Inventory_Stock', 'Catalog, pricing, unit rates, and inventory stock'],
    ['Tab 4: Customers_Credit', 'Customer ledger, contact details, and credit balances'],
    ['Tab 5: CashBook_DayBook', 'Daily cash receipts and out-payments with balances'],
    ['Tab 6: Store_Expenses', 'Classified store expenses and disbursements']
  ];
}

/**
 * Creates or updates a Google Spreadsheet backup with complete multi-tab structure
 */
export async function exportStoreToGoogleSheets(
  payload: GoogleSheetsBackupPayload,
  existingSpreadsheetId?: string,
  providedToken?: string
): Promise<BackupResult> {
  const accessToken = providedToken || await getGoogleAccessToken();

  let spreadsheetId = existingSpreadsheetId;
  const todayFormatted = new Date().toISOString().split('T')[0];
  const sheetTitle = `CM Palahara POS Backup - ${todayFormatted}`;

  // If no existing spreadsheet, create a new one with all tabs
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
        sheets: [
          { properties: { title: 'Overview' } },
          { properties: { title: 'Invoices_Ledger' } },
          { properties: { title: 'Inventory_Stock' } },
          { properties: { title: 'Customers_Credit' } },
          { properties: { title: 'CashBook_DayBook' } },
          { properties: { title: 'Store_Expenses' } },
        ],
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

  // Populate data across all sheets via batchUpdate
  const data = [
    {
      range: 'Overview!A1',
      values: buildOverviewRows(payload),
    },
    {
      range: 'Invoices_Ledger!A1',
      values: buildInvoicesRows(payload.invoices),
    },
    {
      range: 'Inventory_Stock!A1',
      values: buildProductsRows(payload.products),
    },
    {
      range: 'Customers_Credit!A1',
      values: buildCustomersRows(payload.customers),
    },
    {
      range: 'CashBook_DayBook!A1',
      values: buildCashBookRows(payload.cashBook),
    },
    {
      range: 'Store_Expenses!A1',
      values: buildExpensesRows(payload.expenses),
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

  // Save last backup metadata locally
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
 * Reads data from an existing Google Sheet backup to restore or inspect
 */
export async function readStoreFromGoogleSheet(spreadsheetId: string, providedToken?: string): Promise<any> {
  const accessToken = providedToken || await getGoogleAccessToken();

  const ranges = [
    'Invoices_Ledger!A1:O1000',
    'Inventory_Stock!A1:H1000',
    'Customers_Credit!A1:F1000',
    'CashBook_DayBook!A1:I1000',
    'Store_Expenses!A1:F1000'
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges.map(encodeURIComponent).join('&ranges=')}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to read backup from Google Sheet: ${errText}`);
  }

  return await response.json();
}
