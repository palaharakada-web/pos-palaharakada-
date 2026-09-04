import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SaleInvoice } from '../types';
import { Search, Printer, FileText, Calendar, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

export const InvoiceSearch: React.FC = () => {
  const { invoices } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'Cash' | 'UPI' | 'Credit'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.trim().toLowerCase();
    const matchTerm =
      !term ||
      inv.invoiceNo.toLowerCase().includes(term) ||
      inv.customerName.toLowerCase().includes(term) ||
      inv.customerPhone.includes(term) ||
      inv.cashierName.toLowerCase().includes(term);

    const matchMode = filterMode === 'all' || inv.paymentMode === filterMode;
    return matchTerm && matchMode;
  });

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              Invoice Search & Reprint Center
            </h2>
            <p className="text-xs text-slate-400">
              Lookup any previous retail bill by Invoice number, customer name, phone or cashier
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Invoice (e.g. INV-1045, Anil, 9847123456)..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-1.5">
            {(['all', 'Cash', 'UPI', 'Credit'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  filterMode === mode
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {mode === 'all' ? 'All' : mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Found <strong className="text-slate-800">{filteredInvoices.length}</strong> invoice(s)</span>
          <span className="text-[11px] text-slate-400">Showing latest records first</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items Summary</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Biller</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.invoiceNo} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{inv.date}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.time}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800">{inv.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {inv.customerPhone || 'No Phone'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                    {inv.items.map((i) => `${i.name} (${i.qty}${i.unit})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
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
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                    ₹{inv.grandTotal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {inv.balanceDue > 0 ? (
                      <span className="font-bold text-rose-600">₹{inv.balanceDue.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Nil (Paid)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-500 text-[11px]">
                    {inv.cashierName}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    No matching invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal for Selected Invoice */}
      {selectedInvoice && (
        <InvoiceReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onNewSale={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
