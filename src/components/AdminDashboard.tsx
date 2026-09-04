import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSheetsBackupModal } from './GoogleSheetsBackupModal';
import {
  TrendingUp,
  Banknote,
  QrCode,
  CreditCard,
  Receipt,
  Package,
  Calendar,
  ShieldAlert,
  ArrowUpRight,
  Users,
  Award,
  CloudUpload,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { invoices, customers, products, setActiveTab } = useApp();

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Filter invoices based on date selection
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (dateFilter === 'today') {
        return inv.date === todayStr;
      }
      if (dateFilter === 'month') {
        return inv.date.startsWith(currentMonthStr);
      }
      if (dateFilter === 'custom') {
        if (!customStart && !customEnd) return true;
        const invDate = inv.date;
        if (customStart && invDate < customStart) return false;
        if (customEnd && invDate > customEnd) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [invoices, dateFilter, todayStr, currentMonthStr, customStart, customEnd]);

  // Key metrics calculation
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;
    let totalItemsSold = 0;

    filteredInvoices.forEach((inv) => {
      totalRevenue += inv.grandTotal;
      if (inv.paymentMode === 'Cash') cashSales += inv.amountReceived;
      else if (inv.paymentMode === 'UPI') upiSales += inv.amountReceived;
      else if (inv.paymentMode === 'Credit') {
        creditSales += inv.balanceDue;
        cashSales += inv.amountReceived; // if partial cash was paid
      }

      inv.items.forEach((item) => {
        totalItemsSold += item.qty;
      });
    });

    // Total outstanding customer balance across whole store
    const totalOutstandingCustomerCredit = customers.reduce((sum, c) => sum + c.balanceDue, 0);

    return {
      totalRevenue,
      cashSales,
      upiSales,
      creditSales,
      totalOutstandingCustomerCredit,
      totalInvoices: filteredInvoices.length,
      totalItemsSold,
    };
  }, [filteredInvoices, customers]);

  // Top selling items
  const topSellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; unit: string; qty: number; revenue: number }> = {};

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, unit: item.unit, qty: 0, revenue: 0 };
        }
        itemMap[item.name].qty += item.qty;
        itemMap[item.name].revenue += item.amount;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredInvoices]);

  // Staff sales performance
  const staffPerformance = useMemo(() => {
    const staffMap: Record<string, { name: string; billsCount: number; totalBilled: number }> = {};

    filteredInvoices.forEach((inv) => {
      const key = inv.cashierName || 'Staff';
      if (!staffMap[key]) {
        staffMap[key] = { name: key, billsCount: 0, totalBilled: 0 };
      }
      staffMap[key].billsCount += 1;
      staffMap[key].totalBilled += inv.grandTotal;
    });

    return Object.values(staffMap).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [filteredInvoices]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
            Store Sales & Financial Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time analytics for revenue, collections, payment breakdown & staff billing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                dateFilter === 'today' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                dateFilter === 'month' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                dateFilter === 'custom' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Google Sheets Backup</span>
          </button>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl shadow-xs border-l-4 border-blue-600 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Sales
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">
            ₹{metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {metrics.totalInvoices} invoices generated
          </div>
        </div>

        {/* Cash Collected */}
        <div className="bg-white p-4 rounded-xl shadow-xs border-l-4 border-emerald-500 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cash In Till
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">
            ₹{metrics.cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Physical cash drawer collection
          </div>
        </div>

        {/* UPI / Digital */}
        <div className="bg-white p-4 rounded-xl shadow-xs border-l-4 border-indigo-500 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              UPI / Online
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">
            ₹{metrics.upiSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Direct bank QR & Card receipts
          </div>
        </div>

        {/* Customer Credit Due */}
        <div className="bg-white p-4 rounded-xl shadow-xs border-l-4 border-rose-500 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Customer Debtors
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            ₹{metrics.totalOutstandingCustomerCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center justify-between">
            <span>Uncollected credit balance</span>
            <button
              onClick={() => setActiveTab('customers')}
              className="underline text-[10px] cursor-pointer hover:text-rose-800"
            >
              Collect Due &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Middle Grid: Payment Breakdown & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Payment Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Revenue by Payment Mode
          </h3>

          <div className="space-y-3">
            {/* Cash bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Cash Receipts</span>
                <span className="font-bold text-slate-800">
                  ₹{metrics.cashSales.toFixed(2)}{' '}
                  <span className="text-slate-400 font-normal">
                    ({metrics.totalRevenue > 0 ? ((metrics.cashSales / metrics.totalRevenue) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalRevenue > 0 ? (metrics.cashSales / metrics.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* UPI bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">UPI / QR Transfer</span>
                <span className="font-bold text-slate-800">
                  ₹{metrics.upiSales.toFixed(2)}{' '}
                  <span className="text-slate-400 font-normal">
                    ({metrics.totalRevenue > 0 ? ((metrics.upiSales / metrics.totalRevenue) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalRevenue > 0 ? (metrics.upiSales / metrics.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Credit bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Credit (Pay Later)</span>
                <span className="font-bold text-slate-800">
                  ₹{metrics.creditSales.toFixed(2)}{' '}
                  <span className="text-slate-400 font-normal">
                    ({metrics.totalRevenue > 0 ? ((metrics.creditSales / metrics.totalRevenue) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalRevenue > 0 ? (metrics.creditSales / metrics.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Quick Store Summary:</div>
            <div>• Active Stock Catalog: <strong className="text-slate-800">{products.length}</strong> items</div>
            <div>• Registered Customers: <strong className="text-slate-800">{customers.length}</strong> profiles</div>
            <div>• Total Units Sold in Period: <strong className="text-slate-800">{metrics.totalItemsSold}</strong> units</div>
          </div>
        </div>

        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Top Selling Bakery & Snack Items
            </h3>
            <span className="text-xs text-slate-400">By total sales revenue</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topSellingItems.map((item, idx) => (
              <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                      idx === 0
                        ? 'bg-blue-50 text-blue-600'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Sold: {item.qty} {item.unit}
                    </div>
                  </div>
                </div>

                <div className="text-right font-black text-slate-800">
                  ₹{item.revenue.toFixed(2)}
                </div>
              </div>
            ))}

            {topSellingItems.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No items sold yet in this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Performance Breakdown */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Staff Billing Productivity & Till Control
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('staff')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Manage Staff Logins &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {staffPerformance.map((st) => (
            <div
              key={st.name}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 transition-all shadow-2xs"
            >
              <div className="text-xs font-bold text-slate-800">{st.name}</div>
              <div className="text-xs text-slate-400 mt-1">
                Bills Created: <strong className="text-slate-700">{st.billsCount}</strong>
              </div>
              <div className="text-base font-black text-blue-600 mt-0.5">
                ₹{st.totalBilled.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Sheets Backup Modal */}
      <GoogleSheetsBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};
