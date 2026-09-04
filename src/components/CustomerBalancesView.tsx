import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import {
  Users,
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  Phone,
  Calendar,
  AlertCircle,
  Banknote,
  QrCode,
  X,
} from 'lucide-react';

export const CustomerBalancesView: React.FC = () => {
  const { customers, recordCustomerPayment, addCustomer } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);

  // Settle Debt Modal State
  const [settleModalCust, setSettleModalCust] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'Cash' | 'UPI'>('Cash');
  const [settleNote, setSettleNote] = useState('');

  // Add Customer Modal State
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (filterDueOnly && c.balanceDue <= 0) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const totalOutstandingCredit = customers.reduce((sum, c) => sum + c.balanceDue, 0);
  const customersWithCredit = customers.filter((c) => c.balanceDue > 0).length;

  const handleOpenSettle = (customer: Customer) => {
    setSettleModalCust(customer);
    setSettleAmount(customer.balanceDue.toString());
    setSettleMode('Cash');
    setSettleNote('Dues cleared at counter');
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalCust) return;
    const amt = parseFloat(settleAmount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amt > settleModalCust.balanceDue) {
      if (!window.confirm('Entered amount exceeds current balance due. Continue?')) {
        return;
      }
    }

    recordCustomerPayment(settleModalCust.id, amt, settleMode, settleNote);
    setSettleModalCust(null);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('Customer Name is required.');
      return;
    }

    addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
    });

    setNewCustName('');
    setNewCustPhone('');
    setIsAddCustModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Top Controller */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                Customer Balances & Debtors Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Track credit balances, purchase histories, and collect outstanding dues
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddCustModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-100 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Customer Account
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone or Customer ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="sm:col-span-4 flex items-center justify-end">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterDueOnly}
                onChange={(e) => setFilterDueOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Show Only with Credit Due ({customersWithCredit})
            </label>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Outstanding Credit
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ₹{totalOutstandingCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Owed across {customersWithCredit} accounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Registered Customers
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Active profiles
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Lifetime Collections
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{customers.reduce((s, c) => s + c.totalPaid, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total customer payments received
          </div>
        </div>
      </div>

      {/* Customer Balances Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-2.5 px-3">Customer ID</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Phone Number</th>
                <th className="py-2.5 px-3 text-right">Total Purchases</th>
                <th className="py-2.5 px-3 text-right">Total Paid</th>
                <th className="py-2.5 px-3 text-right">Balance Due (Credit)</th>
                <th className="py-2.5 px-3 text-center">Last Purchase</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => {
                const hasDue = c.balanceDue > 0;
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      hasDue ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500 whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {c.phone || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap font-medium">
                      ₹{c.totalPurchases.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 whitespace-nowrap font-medium">
                      ₹{c.totalPaid.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black whitespace-nowrap">
                      {hasDue ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-rose-700 bg-rose-50 border border-rose-200">
                          ₹{c.balanceDue.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">₹0.00 (Clear)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 whitespace-nowrap">
                      {c.lastVisit || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {hasDue ? (
                        <button
                          onClick={() => handleOpenSettle(c)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          Collect Due
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">No dues</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    No customers found matching search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLECT CREDIT PAYMENT MODAL */}
      {settleModalCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Collect Customer Debt
                </h3>
              </div>
              <button
                onClick={() => setSettleModalCust(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-200 text-xs space-y-1">
              <div>Customer: <strong className="text-slate-800">{settleModalCust.name}</strong></div>
              <div>ID: <span className="font-mono text-slate-500">{settleModalCust.id}</span></div>
              <div className="text-rose-700 font-bold">
                Total Credit Due: ₹{settleModalCust.balanceDue.toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount to Collect (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-black text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Collection Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMode('Cash')}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      settleMode === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleMode('UPI')}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      settleMode === 'UPI'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    UPI / Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Note
                </label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="e.g. Cleared at counter"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModalCust(null)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">
                  New Customer Profile
                </h3>
              </div>
              <button
                onClick={() => setIsAddCustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-100 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
