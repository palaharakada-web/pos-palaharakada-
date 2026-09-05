import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  exportStoreToGoogleSheets,
  BackupResult
} from '../services/googleSheetsService';
import {
  googleSignIn,
  getCachedGoogleUser,
  googleSignOut
} from '../services/firebaseAuthService';
import {
  FileSpreadsheet,
  CloudUpload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Calendar,
  Layers,
  UserCheck,
  LogOut,
  ExternalLink as OpenInNew,
  Zap,
  Clock,
  Settings2,
  Copy,
  Check,
} from 'lucide-react';

export const GoogleSheetsBackupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    users,
    products,
    customers,
    invoices,
    cashBook,
    expenses,
    autoBackupEnabled,
    setAutoBackupEnabled,
    autoBackupInterval,
    setAutoBackupInterval,
    appsScriptWebhookUrl,
    setAppsScriptWebhookUrl,
    triggerAutoBackup,
    isAutoBackingUp,
    lastAutoBackupTime,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<BackupResult | null>(null);
  const [lastBackup, setLastBackup] = useState<BackupResult | null>(null);
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState('');
  const [connectedUser, setConnectedUser] = useState(getCachedGoogleUser());
  const [webhookInput, setWebhookInput] = useState(appsScriptWebhookUrl);
  const [copiedScript, setCopiedScript] = useState(false);
  const [autoBackupSuccessMsg, setAutoBackupSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pos_last_sheets_backup');
    if (saved) {
      try {
        setLastBackup(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    setConnectedUser(getCachedGoogleUser());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackupNow = async (useExistingId: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setSuccessResult(null);

    try {
      // 1. Ensure user is connected with Google
      let token: string | undefined;
      const cached = getCachedGoogleUser();
      if (!cached) {
        const signinRes = await googleSignIn();
        setConnectedUser(signinRes.user);
        token = signinRes.accessToken;
      }

      // 2. Perform export to Google Sheets
      const payload = {
        users,
        products,
        customers,
        invoices,
        cashBook,
        expenses,
      };

      const targetId = useExistingId && customSpreadsheetId.trim()
        ? customSpreadsheetId.trim()
        : undefined;

      const result = await exportStoreToGoogleSheets(payload, targetId, token);
      setSuccessResult(result);
      setLastBackup(result);
    } catch (err: any) {
      console.error('Google Sheets backup error:', err);
      const msg = err?.message || 'Failed to sync with Google Sheets.';
      if (msg.toLowerCase().includes('popup') || msg.toLowerCase().includes('closed')) {
        setError('Google sign-in popup was closed or blocked. If you are inside the AI Studio preview iframe, please click "Open in New Tab" at the top of AI Studio, or allow popups for this site.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await googleSignOut();
    setConnectedUser(null);
    setSuccessResult(null);
  };

  const downloadLocalJsonBackup = () => {
    const backupData = {
      storeName: 'CM Palahara Kada & Bakery',
      timestamp: new Date().toISOString(),
      data: {
        users,
        products,
        customers,
        invoices,
        cashBook,
        expenses,
      },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cm_palahara_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.data) {
          throw new Error('Invalid backup file structure.');
        }

        if (window.confirm('Restore all store records from this backup file? This will update products, invoices, and ledgers.')) {
          if (parsed.data.users) localStorage.setItem('pos_users', JSON.stringify(parsed.data.users));
          if (parsed.data.products) localStorage.setItem('pos_products', JSON.stringify(parsed.data.products));
          if (parsed.data.customers) localStorage.setItem('pos_customers', JSON.stringify(parsed.data.customers));
          if (parsed.data.invoices) localStorage.setItem('pos_invoices', JSON.stringify(parsed.data.invoices));
          if (parsed.data.cashBook) localStorage.setItem('pos_cashbook', JSON.stringify(parsed.data.cashBook));
          if (parsed.data.expenses) localStorage.setItem('pos_expenses', JSON.stringify(parsed.data.expenses));

          alert('Store data restored successfully! Refreshing page...');
          window.location.reload();
        }
      } catch (err: any) {
        alert(`Error reading backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Google Sheets Store Backup
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Real-time cloud backup of all sales, invoices, inventory & ledgers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Connected Google Account Header */}
          {connectedUser && (
            <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  {connectedUser.displayName?.charAt(0) || connectedUser.email?.charAt(0) || 'G'}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{connectedUser.displayName || 'Google User'}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">Connected</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">{connectedUser.email}</div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors text-[11px] font-medium cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          )}

          {/* Status Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-rose-900">Google Connection Note</p>
                <p>{error}</p>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-rose-700 font-medium">
                  <span>💡 Tip: If you are testing inside the preview frame, open the app in a new tab for seamless Google OAuth popups.</span>
                </div>
              </div>
            </div>
          )}

          {successResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-xs">Backup Successfully Saved to Google Sheets!</span>
              </div>
              <p className="text-xs text-emerald-800">
                All records ({successResult.summary.invoicesCount} Invoices, {successResult.summary.productsCount} Products, {successResult.summary.customersCount} Customers) have been synchronized into 6 organized tabs.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={successResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Spreadsheet in Google Drive
                </a>
              </div>
            </div>
          )}

          {/* Backup Summary Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Invoices</span>
              <span className="text-lg font-bold text-slate-800">{invoices.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Products</span>
              <span className="text-lg font-bold text-slate-800">{products.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Customers</span>
              <span className="text-lg font-bold text-slate-800">{customers.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Ledger Logs</span>
              <span className="text-lg font-bold text-slate-800">{cashBook.length}</span>
            </div>
          </div>

          {/* Multi-Tab Structure Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Layers className="w-4 h-4 text-emerald-600" />
              Complete 11-Tab ERP Accounting Tabs Synchronized:
            </div>
            <ul className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5 list-disc list-inside">
              <li><strong>1. Overview:</strong> Executive KPIs, daily collection & margins</li>
              <li><strong>2. Chart of Accounts:</strong> Master codes (1010, 1020, 4010, etc.)</li>
              <li><strong>3. Sales Ledger:</strong> Invoice registry with customer details</li>
              <li><strong>4. Sales Details:</strong> Itemized lines with rates and cashier</li>
              <li><strong>5. Cash Book:</strong> Counter cash & UPI day book vouchers</li>
              <li><strong>6. Expense Ledger:</strong> Utility, rent & payroll expenditures</li>
              <li><strong>7. Inventory Ledger:</strong> Live stock count, cost & selling rates</li>
              <li><strong>8. Debtors Ledger:</strong> Customer credit balances & dues</li>
              <li><strong>9. General Ledger:</strong> Double-entry journal postings (Dr/Cr)</li>
              <li><strong>10. Trial Balance:</strong> Balanced audit verification</li>
              <li><strong>11. Profit & Loss:</strong> Income vs Expenses statement</li>
            </ul>
          </div>

          {/* Last Backup Notice */}
          {lastBackup && (
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-100/70 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Last Google Sheets Backup: <strong>{new Date(lastBackup.timestamp).toLocaleString()}</strong></span>
              </div>
              <a
                href={lastBackup.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 underline mt-1 sm:mt-0"
              >
                View Sheet <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* AUTOMATIC BACKUP CONFIGURATION PANEL */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Automatic Real-Time Backup
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${autoBackupEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {autoBackupEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically saves a full backup snapshot whenever any sale is finalized.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Auto-Backup Status & Controls */}
            {autoBackupEnabled && (
              <div className="pt-2 border-t border-emerald-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Interval Option */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Periodic Background Interval:
                    </label>
                    <select
                      value={autoBackupInterval}
                      onChange={(e) => setAutoBackupInterval(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value={0}>Only immediately after each Sale</option>
                      <option value={5}>Every 5 minutes + on every Sale</option>
                      <option value={15}>Every 15 minutes + on every Sale (Recommended)</option>
                      <option value={30}>Every 30 minutes + on every Sale</option>
                      <option value={60}>Every 1 hour + on every Sale</option>
                    </select>
                  </div>

                  {/* Last Auto Backup Timestamp */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Latest Automatic Snapshot:</label>
                    <div className="px-3 py-1.5 bg-white/80 border border-slate-200 rounded-lg text-slate-600 font-mono text-[11px] flex items-center justify-between">
                      <span>
                        {lastAutoBackupTime
                          ? new Date(lastAutoBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'Pending first transaction'}
                      </span>
                      {isAutoBackingUp ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-semibold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Google Apps Script Direct Webhook Sync (Zero Popup) */}
                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Google Apps Script Webhook URL (For Popup-Free Auto Sync):
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste your deployed Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec)"
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAppsScriptWebhookUrl(webhookInput.trim());
                        setAutoBackupSuccessMsg('Google Apps Script URL saved! Auto-backups will stream directly to Google Sheets.');
                        setTimeout(() => setAutoBackupSuccessMsg(null), 4000);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Save URL
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Paste your Apps Script Web App URL to push every sale directly into your Google Sheet silently in the background.
                  </p>
                </div>

                {/* Trigger Instant Auto-Backup test */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={isAutoBackingUp}
                    onClick={async () => {
                      await triggerAutoBackup();
                      setAutoBackupSuccessMsg('Auto backup completed! Snapshot stored.');
                      setTimeout(() => setAutoBackupSuccessMsg(null), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAutoBackingUp ? 'animate-spin' : ''}`} />
                    Test Auto-Backup Now
                  </button>

                  {autoBackupSuccessMsg && (
                    <span className="text-xs text-emerald-700 font-semibold animate-in fade-in flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {autoBackupSuccessMsg}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-2">
            <button
              disabled={isLoading}
              onClick={() => handleBackupNow(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting & Syncing to Google Sheets...
                </>
              ) : (
                <>
                  <CloudUpload className="w-5 h-5" />
                  {connectedUser ? 'Backup Everything to a New Google Sheet' : 'Sign in with Google & Backup to Sheets'}
                </>
              )}
            </button>

            {/* Existing Sheet ID Option */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Or update an existing Google Spreadsheet:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Google Spreadsheet ID (e.g., 1BxiMVs0XRA5nFMdKvBdB...)"
                  value={customSpreadsheetId}
                  onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  disabled={isLoading || !customSpreadsheetId.trim()}
                  onClick={() => handleBackupNow(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Update Sheet
                </button>
              </div>
            </div>

            {/* Offline Local Backup / Restore */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                Offline File Backup & Restore (USB / PC)
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadLocalJsonBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Download JSON File
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Restore from JSON File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted directly from your browser to your Google Drive account.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
