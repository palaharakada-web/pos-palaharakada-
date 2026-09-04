import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseEntry } from '../types';
import {
  BookOpen,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  QrCode,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const CashBookView: React.FC = () => {
  const { cashBook, expenses, addExpense } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'cashbook' | 'expenses'>('cashbook');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New Expense form state
  const [expenseData, setExpenseData] = useState<{
    date: string;
    category: ExpenseEntry['category'];
    description: string;
    amount: number;
    paymentMode: 'Cash' | 'UPI';
  }>({
    date: new Date().toISOString().split('T')[0],
    category: 'Raw Materials',
    description: '',
    amount: 1000,
    paymentMode: 'Cash',
  });

  const totalReceipts = cashBook.reduce((s, e) => s + e.receipt, 0);
  const totalPayments = cashBook.reduce((s, e) => s + e.payment, 0);
  const currentTillBalance = totalReceipts - totalPayments;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseData.amount <= 0) return alert('Enter a valid amount');
    if (!expenseData.description.trim()) return alert('Description is required');

    addExpense({
      date: expenseData.date,
      category: expenseData.category,
      description: expenseData.description.trim(),
      amount: Number(expenseData.amount),
      paymentMode: expenseData.paymentMode,
    });

    setIsAddExpenseOpen(false);
    setExpenseData({
      date: new Date().toISOString().split('T')[0],
      category: 'Raw Materials',
      description: '',
      amount: 500,
      paymentMode: 'Cash',
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              Cash Book & Expense Accounting
            </h2>
            <p className="text-xs text-slate-400">
              Daily till movement, cash in/out, UPI transactions, and operating expense ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSubTab('cashbook')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'cashbook'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cash & Bank Till
            </button>
            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'expenses'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense Ledger
            </button>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm shadow-rose-100 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Store Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Inflows / Receipts</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sales & customer credit settlements
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Outflows / Expenses</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Rent, flour, packaging, maintenance
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Net Registered Balance</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            ₹{currentTillBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Combined cash till & bank position
          </div>
        </div>
      </div>

      {/* Tables View */}
      {activeSubTab === 'cashbook' ? (
        /* Cash Book Table */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-800">Daily Cash Book & Bank Receipts / Payments</span>
            <span className="text-[11px] text-slate-400">Total {cashBook.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher / Ref</th>
                  <th className="py-2.5 px-3">Particulars</th>
                  <th className="py-2.5 px-3">Account Head</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Receipt (In)</th>
                  <th className="py-2.5 px-3 text-right">Payment (Out)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                  <th className="py-2.5 px-3">Staff / Biller</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashBook.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-medium">
                      {entry.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {entry.voucherNo}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {entry.particulars}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {entry.account}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.mode === 'Cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {entry.mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {entry.receipt > 0 ? `₹${entry.receipt.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                      {entry.payment > 0 ? `₹${entry.payment.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      ₹{entry.balance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {entry.staffName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Expenses Table */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-800">Store Overheads & Supplier Purchase Expenses</span>
            <span className="text-[11px] text-slate-500 font-bold">Total: ₹{totalExpenses.toFixed(2)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Expense ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-medium">
                      {exp.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {exp.id}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {exp.description}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.paymentMode === 'Cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600 whitespace-nowrap">
                      ₹{exp.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {exp.recordedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Record Store Expense
              </h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={expenseData.date}
                  onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Category
                </label>
                <select
                  value={expenseData.category}
                  onChange={(e) =>
                    setExpenseData({
                      ...expenseData,
                      category: e.target.value as ExpenseEntry['category'],
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  <option value="Raw Materials">Raw Materials (Flour, Butter, Sugar)</option>
                  <option value="Packaging">Packaging (Cake boxes, Bags)</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Electricity">Electricity / Power Bill</option>
                  <option value="Staff Wages">Staff Wages / Salary Advance</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Vendor *
                </label>
                <input
                  type="text"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  placeholder="e.g. 50kg Maida supply from Royal Mills"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={expenseData.amount}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-sm font-black text-rose-600 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseData({ ...expenseData, paymentMode: 'Cash' })}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      expenseData.paymentMode === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Cash Drawer
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseData({ ...expenseData, paymentMode: 'UPI' })}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      expenseData.paymentMode === 'UPI'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Bank / UPI
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm shadow-rose-100 cursor-pointer transition-colors"
                >
                  Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
