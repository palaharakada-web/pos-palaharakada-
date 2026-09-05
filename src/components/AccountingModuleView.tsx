import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { JournalEntry } from '../types';
import {
  BookOpen,
  Plus,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  Building,
  CheckCircle2,
  X,
  CreditCard,
  Scale,
} from 'lucide-react';

const STANDARD_ACCOUNTS = [
  '1010 - Cash in Till',
  '1020 - Bank / UPI Account',
  '1030 - Accounts Receivable (Customers)',
  '1040 - Inventory Asset',
  '2010 - Accounts Payable (Suppliers)',
  '3010 - Owner Capital / Equity',
  '4010 - Sales Revenue',
  '5010 - Shop Rent Expense',
  '5020 - Electricity & Utilities Expense',
  '5030 - Staff Wages & Salary',
  '5040 - Packaging & Consumables Expense',
  '5050 - Miscellaneous Store Expense',
];

export const AccountingModuleView: React.FC = () => {
  const { journals, addJournalEntry, cashBook, expenses, invoices, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'journal' | 'trialBalance' | 'pnl'>('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  // New Journal Form states
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [debitAccount, setDebitAccount] = useState('1010 - Cash in Till');
  const [creditAccount, setCreditAccount] = useState('4010 - Sales Revenue');
  const [amount, setAmount] = useState<number>(0);

  // Filtered Journals
  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const q = searchTerm.toLowerCase();
      return (
        j.voucherNo.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.debitAccount.toLowerCase().includes(q) ||
        j.creditAccount.toLowerCase().includes(q) ||
        j.date.includes(q)
      );
    });
  }, [journals, searchTerm]);

  // Handle create manual journal entry
  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return alert('Please enter a valid amount.');
    if (debitAccount === creditAccount) return alert('Debit and Credit accounts must be different.');
    if (!description.trim()) return alert('Please enter transaction description.');

    addJournalEntry({
      date,
      description: description.trim(),
      debitAccount,
      creditAccount,
      amount,
      referenceType: 'Manual',
    });

    setIsNewEntryOpen(false);
    setDescription('');
    setAmount(0);
    alert('Journal entry successfully posted to general ledger.');
  };

  // Trial Balance calculation across all standard accounts
  const trialBalance = useMemo(() => {
    const accountTotals: { [key: string]: { debit: number; credit: number } } = {};

    STANDARD_ACCOUNTS.forEach((acc) => {
      accountTotals[acc] = { debit: 0, credit: 0 };
    });

    journals.forEach((j) => {
      if (!accountTotals[j.debitAccount]) {
        accountTotals[j.debitAccount] = { debit: 0, credit: 0 };
      }
      accountTotals[j.debitAccount].debit += j.amount;

      if (!accountTotals[j.creditAccount]) {
        accountTotals[j.creditAccount] = { debit: 0, credit: 0 };
      }
      accountTotals[j.creditAccount].credit += j.amount;
    });

    let sumDebit = 0;
    let sumCredit = 0;

    const list = Object.entries(accountTotals)
      .map(([account, { debit, credit }]) => {
        sumDebit += debit;
        sumCredit += credit;
        const netDebit = debit >= credit ? debit - credit : 0;
        const netCredit = credit > debit ? credit - debit : 0;
        return {
          account,
          debit,
          credit,
          netDebit,
          netCredit,
        };
      })
      .filter((row) => row.debit > 0 || row.credit > 0);

    return { list, sumDebit, sumCredit };
  }, [journals]);

  // Simple Profit & Loss Summary
  const pnlSummary = useMemo(() => {
    const totalSales = journals
      .filter((j) => j.creditAccount.includes('Sales Revenue'))
      .reduce((sum, j) => sum + j.amount, 0);

    const totalRent = journals
      .filter((j) => j.debitAccount.includes('Rent Expense'))
      .reduce((sum, j) => sum + j.amount, 0);

    const totalElectricity = journals
      .filter((j) => j.debitAccount.includes('Electricity'))
      .reduce((sum, j) => sum + j.amount, 0);

    const totalSalaries = journals
      .filter((j) => j.debitAccount.includes('Staff Wages'))
      .reduce((sum, j) => sum + j.amount, 0);

    const totalOtherExpenses = journals
      .filter((j) => j.debitAccount.startsWith('5') && !j.debitAccount.includes('Rent') && !j.debitAccount.includes('Electricity') && !j.debitAccount.includes('Wages'))
      .reduce((sum, j) => sum + j.amount, 0);

    const totalExpenses = totalRent + totalElectricity + totalSalaries + totalOtherExpenses;
    const netProfit = totalSales - totalExpenses;

    return {
      totalSales,
      totalRent,
      totalElectricity,
      totalSalaries,
      totalOtherExpenses,
      totalExpenses,
      netProfit,
    };
  }, [journals]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              Accounts Department & General Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Double-entry bookkeeping, auto-posted vouchers from POS sales, salaries, and trial balance
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewEntryOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-100 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Journal Voucher (JV)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Journal Entries ({journals.length})
        </button>

        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'trialBalance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-4 h-4" />
          Trial Balance
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pnl'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Income & Profit Statement
        </button>
      </div>

      {/* 1. JOURNAL ENTRIES VIEW */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-2">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-xs text-slate-800">
              General Ledger Vouchers
            </span>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search voucher #, account, or description..."
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Transaction Particulars</th>
                  <th className="py-2.5 px-3">Debit (Dr) Account</th>
                  <th className="py-2.5 px-3">Credit (Cr) Account</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {j.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {j.voucherNo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium max-w-xs">
                      {j.description}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        Dr: {j.debitAccount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        Cr: {j.creditAccount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{j.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {j.referenceType || 'Manual'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {j.createdBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TRIAL BALANCE VIEW */}
      {activeTab === 'trialBalance' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                Trial Balance (Dual Column Balancing)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total debits must match total credits to guarantee accounting integrity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ✓ Ledgers Balanced
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5 px-3">Account Title</th>
                  <th className="py-2.5 px-3 text-right">Debit Total (₹)</th>
                  <th className="py-2.5 px-3 text-right">Credit Total (₹)</th>
                  <th className="py-2.5 px-3 text-right">Net Debit (₹)</th>
                  <th className="py-2.5 px-3 text-right">Net Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.list.map((row) => (
                  <tr key={row.account} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {row.account}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ₹{row.debit.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ₹{row.credit.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {row.netDebit > 0 ? `₹${row.netDebit.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                      {row.netCredit > 0 ? `₹${row.netCredit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="py-3 px-3 uppercase tracking-wider text-xs">Total Trial Balance</td>
                  <td className="py-3 px-3 text-right font-mono">₹{trialBalance.sumDebit.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{trialBalance.sumCredit.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    ₹{trialBalance.list.reduce((s, r) => s + r.netDebit, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-400">
                    ₹{trialBalance.list.reduce((s, r) => s + r.netCredit, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 3. PROFIT & LOSS VIEW */}
      {activeTab === 'pnl' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Operating Income / Revenue
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">Retail & Wholesale Sales Revenue</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{pnlSummary.totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-emerald-700 bg-emerald-50 px-2 rounded-lg">
                <span>Total Gross Revenue</span>
                <span className="font-mono">₹{pnlSummary.totalSales.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Operating Expenses
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">Shop Rent (5010)</span>
                <span className="font-mono text-slate-800">₹{pnlSummary.totalRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">Electricity & Power (5020)</span>
                <span className="font-mono text-slate-800">₹{pnlSummary.totalElectricity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">Staff Wages & Salaries (5030)</span>
                <span className="font-mono text-slate-800">₹{pnlSummary.totalSalaries.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">Packaging & Miscellaneous</span>
                <span className="font-mono text-slate-800">₹{pnlSummary.totalOtherExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-rose-700 bg-rose-50 px-2 rounded-lg">
                <span>Total Operating Expenses</span>
                <span className="font-mono">₹{pnlSummary.totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Net Operating Income</span>
              <div className="text-2xl font-black font-mono mt-0.5">
                {pnlSummary.netProfit >= 0 ? '+' : ''}₹{pnlSummary.netProfit.toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Status: </span>
              <span className={`font-bold ${pnlSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnlSummary.netProfit >= 0 ? 'Profitable Store Operation' : 'Operating Deficit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NEW JOURNAL ENTRY MODAL */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Post New Journal Voucher (JV)
              </h3>
              <button
                onClick={() => setIsNewEntryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Voucher Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Debit Account (Dr.)
                </label>
                <select
                  value={debitAccount}
                  onChange={(e) => setDebitAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:border-blue-500"
                >
                  {STANDARD_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit Account (Cr.)
                </label>
                <select
                  value={creditAccount}
                  onChange={(e) => setCreditAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:border-blue-500"
                >
                  {STANDARD_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="Enter transaction amount..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Particulars / Narration
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Loan repayment, asset purchase, capital injection"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-100 cursor-pointer transition-colors"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
