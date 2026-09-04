import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, UserCheck, KeyRound, User, Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, users, currentUser } = useApp();
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!loginId.trim()) {
      setError('Please enter your Login ID.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your PIN or Password.');
      return;
    }

    const res = login(loginId, pin);
    if (!res.success) {
      setError(res.message || 'Login failed. Invalid credentials.');
    } else {
      setSuccessMessage('Logged in successfully!');
      setTimeout(() => {
        setIsLoginModalOpen(false);
      }, 400);
    }
  };

  const handleQuickLogin = (quickId: string, quickPin: string) => {
    setLoginId(quickId);
    setPin(quickPin);
    setError('');
    const res = login(quickId, quickPin);
    if (res.success) {
      setSuccessMessage(`Switched to ${quickId}`);
      setTimeout(() => {
        setIsLoginModalOpen(false);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-5 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">System Authentication</h2>
              <p className="text-xs text-slate-400">
                Sign in with your assigned Login ID & PIN
              </p>
            </div>
          </div>

          {currentUser && (
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Login ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. admin or staff1"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your security PIN"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm shadow-blue-100 transition-all active:scale-95 cursor-pointer"
            >
              Sign In to System
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Role Switch (Instant Test)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="p-1.5 rounded-md bg-blue-600 text-white group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Admin Login</div>
                  <div className="text-[11px] text-blue-600 font-mono">admin / admin123</div>
                  <div className="text-[10px] text-slate-400 font-medium">Full System Control</div>
                </div>
              </button>

              {/* Staff 1 Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('staff1', 'staff123')}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="p-1.5 rounded-md bg-slate-800 text-white group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Staff: Rahul</div>
                  <div className="text-[11px] text-slate-600 font-mono">staff1 / staff123</div>
                  <div className="text-[10px] text-slate-400 font-medium">POS Billing Only</div>
                </div>
              </button>

              {/* Staff 2 Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('staff2', 'staff123')}
                className="col-span-1 sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    Staff: Priya Nair (staff2 / staff123)
                  </span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                  POS Counter
                </span>
              </button>
            </div>
          </div>

          {/* Role Specs Details */}
          <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-500 space-y-1 border border-slate-200">
            <div className="font-semibold text-slate-700">Permission Matrix:</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span><strong>Admin:</strong> Billing, Dashboards, Ledgers, Pricing, Debtors, Staff, Cash Book.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span><strong>Staff:</strong> Fast POS Billing & Bill Search ONLY. Ledgers are locked.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
