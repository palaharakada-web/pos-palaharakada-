import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSheetsBackupModal } from './GoogleSheetsBackupModal';
import {
  Store,
  ShieldCheck,
  UserCheck,
  LogOut,
  ArrowLeftRight,
  RotateCcw,
  Receipt,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Package,
  UserCog,
  BookOpen,
  Search,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  CalendarCheck,
  Landmark,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setIsLoginModalOpen,
    logout,
    resetAllData,
    autoBackupEnabled,
    isAutoBackingUp,
    lastAutoBackupTime,
  } = useApp();

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Store */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-100">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-800">
                CM PALAHARA
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 rounded-md">
                POS & ERP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Bakery POS, Staff Control & Live Billing
            </p>
          </div>
        </div>

        {/* User Profile & Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-end gap-1 font-mono">
                  <span>ID: {currentUser.loginId}</span>
                  <span>•</span>
                  <span className={isAdmin ? 'text-blue-600 font-semibold' : 'text-slate-500'}>
                    {isAdmin ? 'Admin Access' : 'Staff (POS Only)'}
                  </span>
                </div>
              </div>

              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shadow-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              {/* Switch User Button */}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                title="Switch User / Login ID"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm shadow-blue-100 cursor-pointer"
            >
              Sign In with Login ID
            </button>
          )}

          {/* Google Sheets Backup Button with Auto-Sync Status */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            title={
              isAutoBackingUp
                ? 'Backing up now...'
                : lastAutoBackupTime
                ? `Auto-Backup Active • Last: ${new Date(lastAutoBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Google Sheets & Auto-Backup Settings'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-colors shadow-2xs cursor-pointer relative"
          >
            {isAutoBackingUp ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : autoBackupEnabled ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden md:inline">Google Sheets Backup</span>
            <span className="md:hidden">Backup</span>
            {autoBackupEnabled && (
              <span className="hidden lg:inline text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                AUTO
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {/* Quick Demo Reset */}
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data (products, invoices, ledger) to defaults?')) {
                resetAllData();
              }
            }}
            title="Reset to Initial Data"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Google Sheets Backup Modal */}
      <GoogleSheetsBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Navigation Tabs Bar */}
      <nav className="bg-white border-t border-slate-200 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-2 min-w-max">
          {/* POS BILLING */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'pos'
                ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            POS Terminal
          </button>

          {/* BILL SEARCH */}
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Bill Search & Reprint
          </button>

          {/* ADMIN ONLY TABS */}
          {isAdmin ? (
            <>
              <div className="h-4 w-px bg-slate-200 mx-1" />

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Reports & Dashboard
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Sales Ledger
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'customers'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Customer Balances
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Inventory
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'staff'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UserCog className="w-3.5 h-3.5" />
                Staff Access
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Attendance & Salaries
              </button>

              <button
                onClick={() => setActiveTab('accounting')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'accounting'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Accounts & Ledgers
              </button>

              <button
                onClick={() => setActiveTab('cashbook')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'cashbook'
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Cash Book
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-auto text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Staff Mode: POS Billing Only</span>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Admin Login
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
