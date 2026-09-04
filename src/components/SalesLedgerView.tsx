import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SaleInvoice } from '../types';
import { GoogleSheetsBackupModal } from './GoogleSheetsBackupModal';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  FileText,
  CloudUpload,
} from 'lucide-react';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

export const SalesLedgerView: React.FC = () => {
  const { invoices } = useApp();

  const [viewType, setViewType] = useState<'summary' | 'itemized'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Date filter
      if (dateFilter === 'today' && inv.date !== todayStr) return false;
      if (dateFilter === 'month' && !inv.date.startsWith(currentMonthStr)) return false;
      if (dateFilter === 'custom') {
        if (startDate && inv.date < startDate) return false;
        if (endDate && inv.date > endDate) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q) ||
          inv.cashierName.toLowerCase().includes(q) ||
          inv.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, dateFilter, todayStr, currentMonthStr, startDate, endDate, searchTerm]);

  // Flattened itemized rows for "Sales Details" view
  const itemizedRows = useMemo(() => {
    const list: Array<{
      date: string;
      invoiceNo: string;
      customerId: string;
      customerName: string;
      phone: string;
      payMode: string;
      itemName: string;
      qty: number;
      unit: string;
      rate: number;
      amount: number;
      cashier: string;
    }> = [];

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        list.push({
          date: inv.date,
          invoiceNo: inv.invoiceNo,
          customerId: inv.customerId,
          customerName: inv.customerName,
          phone: inv.customerPhone,
          payMode: inv.paymentMode,
          itemName: item.name,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          cashier: inv.cashierName,
        });
      });
    });

    return list;
  }, [filteredInvoices]);

  // Summary rollups
  const totals = useMemo(() => {
    let grandTotal = 0;
    let totalReceived = 0;
    let totalBalanceDue = 0;
    filteredInvoices.forEach((i) => {
      grandTotal += i.grandTotal;
      totalReceived += i.amountReceived;
      totalBalanceDue += i.balanceDue;
    });
    return { grandTotal, totalReceived, totalBalanceDue };
  }, [filteredInvoices]);

  // Export CSV handler
  const handleExportCSV = () => {
    let csvContent = '';
    if (viewType === 'summary') {
      csvContent =
        'Date,Invoice No,Customer,Items Summary,Total Qty,Grand Total (INR),Received (INR),Balance Due (INR),Payment Mode,Cashier\n' +
        filteredInvoices
          .map((i) => {
            const itemsStr = `"${i.items.map((it) => `${it.name} (${it.qty}${it.unit})`).join('; ')}"`;
            const totalQty = i.items.reduce((s, it) => s + it.qty, 0);
            return `${i.date},${i.invoiceNo},"${i.customerName} [${i.customerId}]",${itemsStr},${totalQty},${i.grandTotal},${i.amountReceived},${i.balanceDue},${i.paymentMode},"${i.cashierName}"`;
          })
          .join('\n');
    } else {
      csvContent =
        'Date,Invoice No,Customer ID,Customer Name,Phone,Payment Mode,Item Name,Qty,Unit,Rate,Amount (INR),Cashier\n' +
        itemizedRows
          .map(
            (r) =>
              `${r.date},${r.invoiceNo},${r.customerId},"${r.customerName}","${r.phone}",${r.payMode},"${r.itemName}",${r.qty},${r.unit},${r.rate},${r.amount},"${r.cashier}"`
          )
          .join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_${viewType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Top Controller */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                Official Sales Ledger & Itemized Records
              </h2>
              <p className="text-xs text-slate-400">
                Complete audit ledger matching accounting standards and Excel export format
              </p>
            </div>
          </div>

          {/* Export & Backup Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-100 transition-colors cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              Sync to Google Sheets
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 items-center">
          {/* View toggle pills */}
          <div className="md:col-span-4 flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewType('summary')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                viewType === 'summary'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Ledger (Summary)
            </button>
            <button
              onClick={() => setViewType('itemized')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                viewType === 'itemized'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Itemized Breakdown
            </button>
          </div>

          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice, customer, item or cashier..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {/* Date Filter */}
          <div className="md:col-span-4 flex items-center justify-end gap-1.5 text-xs">
            {(['all', 'today', 'month', 'custom'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDateFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                  dateFilter === t
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <span className="text-slate-400 font-medium">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Summary Rollup Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            Total Billed in View
          </div>
          <div className="text-xl font-black text-blue-600 mt-1">
            ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            Total Amount Received
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            ₹{totals.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            Outstanding Credit / Debt
          </div>
          <div className="text-xl font-black text-rose-600 mt-1">
            ₹{totals.totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {viewType === 'summary' ? (
            /* Summary Sales Ledger */
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items Sold</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Received</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Staff</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const totalQty = inv.items.reduce((s, it) => s + it.qty, 0);
                  return (
                    <tr key={inv.invoiceNo} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        {inv.date}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{inv.customerName}</span>{' '}
                        <span className="text-[10px] text-slate-400 font-mono">[{inv.customerId}]</span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-500">
                        {inv.items.map((i) => `${i.name} (${i.qty}${i.unit})`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {totalQty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
                        ₹{inv.amountReceived.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">
                        {inv.balanceDue > 0 ? (
                          <span className="text-rose-600 font-bold">
                            ₹{inv.balanceDue.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.paymentMode === 'Cash'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.paymentMode === 'UPI'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {inv.paymentMode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {inv.cashierName}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                      No invoices found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Itemized Sales Details Table */
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Pay Mode</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemizedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.date}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {r.invoiceNo}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {r.customerId}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {r.customerName}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {r.phone || '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-[11px] font-semibold text-slate-700">
                      {r.payMode}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">{r.itemName}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-800">{r.qty}</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">{r.unit}</td>
                    <td className="py-2 px-3 text-right text-slate-500 whitespace-nowrap">
                      ₹{r.rate.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{r.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {r.cashier}
                    </td>
                  </tr>
                ))}

                {itemizedRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 text-xs">
                      No line items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoice modal */}
      {selectedInvoice && (
        <InvoiceReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onNewSale={() => setSelectedInvoice(null)}
        />
      )}

      {/* Google Sheets Backup Modal */}
      <GoogleSheetsBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};
