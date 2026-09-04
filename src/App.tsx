import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { POSBilling } from './components/POSBilling';
import { InvoiceSearch } from './components/InvoiceSearch';
import { AdminDashboard } from './components/AdminDashboard';
import { SalesLedgerView } from './components/SalesLedgerView';
import { CustomerBalancesView } from './components/CustomerBalancesView';
import { InventoryManager } from './components/InventoryManager';
import { StaffManager } from './components/StaffManager';
import { CashBookView } from './components/CashBookView';
import { ShieldAlert, LogIn } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, currentUser, setIsLoginModalOpen } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Render view based on active tab and role permissions
  const renderCurrentView = () => {
    // POS Billing: Accessible to all
    if (activeTab === 'pos') {
      return <POSBilling />;
    }

    // Bill Search & Reprint: Accessible to all
    if (activeTab === 'search') {
      return <InvoiceSearch />;
    }

    // Guard: If a non-admin tries to access admin tabs
    if (!isAdmin) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Admin Access Required
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              You are currently signed in as <strong className="text-slate-700">{currentUser?.name || 'Staff'}</strong> ({currentUser?.loginId}), which has <strong>POS Billing Only</strong> permissions.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            To view financial reports, audit ledgers, inventory pricing, and manage staff accounts, please authenticate with Administrator credentials.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-100 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign in as Admin
          </button>
        </div>
      );
    }

    // Admin Views
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'ledger':
        return <SalesLedgerView />;
      case 'customers':
        return <CustomerBalancesView />;
      case 'inventory':
        return <InventoryManager />;
      case 'staff':
        return <StaffManager />;
      case 'cashbook':
        return <CashBookView />;
      default:
        return <POSBilling />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 pb-10">
        {renderCurrentView()}
      </main>

      {/* Global Authentication Modal */}
      <LoginModal />

      {/* Clean Minimalism Status Footer */}
      <footer className="h-10 bg-slate-900 text-slate-400 text-[10px] flex items-center justify-between px-4 sm:px-8 uppercase tracking-widest no-print border-t border-slate-800">
        <div className="truncate">
          Terminal ID: POS-001 <span className="mx-2 text-slate-600">•</span> CM Palahara Kada & Bakery <span className="mx-2 text-slate-600">•</span> Status: <span className="text-emerald-400 font-bold">Online</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          Current Staff: <span className="text-white font-medium">{currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Guest'}</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
