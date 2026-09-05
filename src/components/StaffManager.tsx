import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  UserCog,
  Plus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  Lock,
  X,
  AlertCircle,
  Award,
  CalendarCheck,
} from 'lucide-react';

export const StaffManager: React.FC = () => {
  const { users, addStaff, toggleStaffStatus, updateStaffPin, invoices, currentUser, setActiveTab } = useApp();

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [resetPinUser, setResetPinUser] = useState<User | null>(null);
  const [newPinVal, setNewPinVal] = useState('');

  // Form states
  const [formData, setFormData] = useState<{
    loginId: string;
    name: string;
    pin: string;
    phone: string;
    role: UserRole;
  }>({
    loginId: '',
    name: '',
    pin: '',
    phone: '',
    role: 'staff',
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Performance calculation per staff
  const staffStats = users.map((u) => {
    const userInvoices = invoices.filter(
      (inv) =>
        inv.cashierId.toLowerCase() === u.loginId.toLowerCase() ||
        inv.cashierName.toLowerCase().includes(u.name.toLowerCase())
    );

    const totalBilled = userInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const cashHandled = userInvoices
      .filter((i) => i.paymentMode === 'Cash')
      .reduce((sum, i) => sum + i.amountReceived, 0);

    return {
      user: u,
      invoicesCount: userInvoices.length,
      totalBilled,
      cashHandled,
    };
  });

  const handleOpenAdd = () => {
    setErrorMsg('');
    setFormData({
      loginId: `staff${users.length + 1}`,
      name: '',
      pin: '1234',
      phone: '',
      role: 'staff',
    });
    setIsAddStaffOpen(true);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Staff name is required.');
      return;
    }
    if (!formData.loginId.trim()) {
      setErrorMsg('Login ID is required.');
      return;
    }
    if (!formData.pin.trim()) {
      setErrorMsg('Security PIN is required.');
      return;
    }

    const res = addStaff(formData);
    if (!res.success) {
      setErrorMsg(res.message || 'Failed to add staff.');
      return;
    }

    setIsAddStaffOpen(false);
  };

  const handleSaveResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinUser) return;
    if (!newPinVal.trim()) return alert('Please enter a new PIN.');

    updateStaffPin(resetPinUser.id, newPinVal.trim());
    setResetPinUser(null);
    setNewPinVal('');
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              Staff Control & Login Management
            </h2>
            <p className="text-xs text-slate-400">
              Manage authorized Login IDs, security PINs, roles (Admin Full Control vs Staff POS Only), and performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            Attendance & Salaries
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-100 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Login ID
          </button>
        </div>
      </div>

      {/* Role Guide Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-slate-800 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-slate-900">Admin Role (Full System Control)</div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Complete access: Point-of-Sale billing, Financial Dashboards, Sales Ledgers, Customer Debt Collections, Inventory pricing/editing, Cash Book & Expenses, and Staff creation.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 flex items-start gap-2.5">
          <UserCheck className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-slate-900">Staff Role (POS Billing Only)</div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Strictly restricted to counter POS billing and reprinting receipts. Staff cannot view ledgers, change product rates, inspect store profit, or alter records.
            </p>
          </div>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-800">
            Registered Login IDs ({users.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Click 'Reset PIN' to change credentials
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-2.5 px-3">Login ID</th>
                <th className="py-2.5 px-3">Staff Name</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Contact Phone</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Invoices Billed</th>
                <th className="py-2.5 px-3 text-right">Total Sales (₹)</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffStats.map(({ user: u, invoicesCount, totalBilled, cashHandled }) => {
                const isAdmin = u.role === 'admin';
                const isCurrent = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        {u.loginId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        PIN: ••••
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {u.name}
                      {isCurrent && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          (Active Session)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <ShieldCheck className="w-3 h-3" />
                          Admin • Full Control
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <UserCheck className="w-3 h-3" />
                          Staff • POS Billing Only
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {u.phone || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (isCurrent) return alert('Cannot disable currently logged in account.');
                          toggleStaffStatus(u.id);
                        }}
                        disabled={isCurrent}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        } ${isCurrent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title="Click to toggle status"
                      >
                        {u.active ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                      {invoicesCount} bills
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      ₹{totalBilled.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResetPinUser(u);
                            setNewPinVal('');
                          }}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer transition-colors"
                        >
                          Reset PIN
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Create User Login ID
              </h3>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Member Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Login ID *
                </label>
                <input
                  type="text"
                  value={formData.loginId}
                  onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                  placeholder="e.g. staff3"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security PIN / Password *
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="e.g. 1234 or staff123"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'staff' })}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer ${
                      formData.role === 'staff'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Staff (POS Only)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer ${
                      formData.role === 'admin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Admin (Full Control)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-100 cursor-pointer transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PIN MODAL */}
      {resetPinUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Reset Security PIN
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              User: <strong className="text-slate-800">{resetPinUser.name}</strong> ({resetPinUser.loginId})
            </p>

            <form onSubmit={handleSaveResetPin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter New PIN / Password
                </label>
                <input
                  type="text"
                  value={newPinVal}
                  onChange={(e) => setNewPinVal(e.target.value)}
                  placeholder="New PIN..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPinUser(null)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-100 cursor-pointer transition-colors"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
