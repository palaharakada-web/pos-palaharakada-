import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StaffAttendance, StaffSalaryPayment } from '../types';
import {
  CalendarCheck,
  Banknote,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Search,
  Receipt,
  FileSpreadsheet,
  Check,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const StaffAttendanceSalaryView: React.FC = () => {
  const {
    users,
    attendance,
    salaries,
    markAttendance,
    recordSalaryPayment,
    currentUser,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'salaries'>('attendance');

  // Attendance states
  const [attDate, setAttDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [attSearch, setAttSearch] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(users[0]?.id || '');
  const [attStatus, setAttStatus] = useState<StaffAttendance['status']>('Present');
  const [checkIn, setCheckIn] = useState<string>('08:30');
  const [checkOut, setCheckOut] = useState<string>('20:30');
  const [attNotes, setAttNotes] = useState<string>('');

  // Salary Payment Modal states
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });
  const [payStaffId, setPayStaffId] = useState<string>(users[1]?.id || users[0]?.id || '');
  const [baseWage, setBaseWage] = useState<number>(18000);
  const [presentDays, setPresentDays] = useState<number>(28);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Bank Transfer');
  const [salaryNotes, setSalaryNotes] = useState<string>('');

  // Auto-fill salary when staff changes
  const handleSelectPayStaff = (userId: string) => {
    setPayStaffId(userId);
    const u = users.find((x) => x.id === userId);
    if (u?.baseSalary) {
      setBaseWage(u.baseSalary);
    }
  };

  // Calculate Net Pay
  const calculatedNetPay = useMemo(() => {
    // Pro-rata based on 30 day standard month
    const perDay = baseWage / 30;
    const earnedBase = Math.round(perDay * Math.min(30, presentDays));
    const overtimeRate = Math.round((perDay / 8) * 1.5 * overtimeHours);
    const total = earnedBase + overtimeRate + bonusAmount - deductionAmount;
    return Math.max(0, total);
  }, [baseWage, presentDays, overtimeHours, bonusAmount, deductionAmount]);

  // Handle Mark Attendance
  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const u = users.find((x) => x.id === selectedStaffId);
    if (!u) return;

    markAttendance({
      date: attDate,
      userId: u.id,
      userName: `${u.name} (${u.role === 'admin' ? 'Admin' : 'Staff'})`,
      status: attStatus,
      checkIn: attStatus === 'Absent' ? undefined : checkIn,
      checkOut: attStatus === 'Absent' ? undefined : checkOut,
      notes: attNotes,
    });

    setAttNotes('');
    alert(`Attendance marked for ${u.name} on ${attDate} as ${attStatus}.`);
  };

  // Handle Salary Disbursal
  const handleDisburseSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const u = users.find((x) => x.id === payStaffId);
    if (!u) return;

    recordSalaryPayment({
      date: new Date().toISOString().split('T')[0],
      userId: u.id,
      userName: `${u.name} (${u.role.toUpperCase()})`,
      month: salaryMonth,
      monthlyBaseSalary: baseWage,
      daysPresent: presentDays,
      overtimeHours,
      bonus: bonusAmount,
      deductions: deductionAmount,
      netPaid: calculatedNetPay,
      paymentMode: payMode,
      notes: salaryNotes || `Salary cleared for ${salaryMonth}`,
    });

    setIsSalaryModalOpen(false);
    setSalaryNotes('');
    alert(`Salary payment of ₹${calculatedNetPay.toLocaleString()} recorded for ${u.name}. Added to Cash Book and Journal entries.`);
  };

  // Filter attendance records
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchSearch =
        a.userName.toLowerCase().includes(attSearch.toLowerCase()) ||
        a.date.includes(attSearch) ||
        a.status.toLowerCase().includes(attSearch.toLowerCase());
      return matchSearch;
    });
  }, [attendance, attSearch]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              Staff Attendance & Payroll Salaries
            </h2>
            <p className="text-xs text-slate-400">
              Daily punch-in/out tracking, monthly attendance tally, overtime bonus, and automatic wage disbursement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSalaryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-100 transition-colors cursor-pointer"
          >
            <Banknote className="w-4 h-4" />
            Disburse Salary / Pay Voucher
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Daily Attendance Logs ({attendance.length})
        </button>

        <button
          onClick={() => setActiveSubTab('salaries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'salaries'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Salary Vouchers & Payroll History ({salaries.length})
        </button>
      </div>

      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Mark Attendance Quick Form (5 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Mark Daily Attendance
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded">
                Live Record
              </span>
            </div>

            <form onSubmit={handleSubmitAttendance} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Staff Member
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.loginId} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attendance Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Present', 'Absent', 'Half Day', 'On Leave'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAttStatus(st)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        attStatus === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {attStatus !== 'Absent' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Notes / Duty Remarks
                </label>
                <input
                  type="text"
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  placeholder="e.g. Handled morning rush, overtime 1h"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-100 transition-colors cursor-pointer"
              >
                Save Attendance Record
              </button>
            </form>
          </div>

          {/* RIGHT: Attendance History Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-3">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-xs text-slate-800">
                Staff Punch Log & Attendance Records
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  placeholder="Filter by staff name or date..."
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Check-In</th>
                    <th className="py-2.5 px-3 text-center">Check-Out</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {rec.userName}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.status === 'Half Day'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : rec.status === 'On Leave'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {rec.checkIn || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {rec.checkOut || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                        {rec.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No attendance records found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SALARIES / PAYROLL TAB */}
      {activeSubTab === 'salaries' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                Staff Wage Disbursals & Voucher Registry
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each salary payment is automatically synchronized into Cash Book & Journal ledger accounts
              </p>
            </div>
            <button
              onClick={() => setIsSalaryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Salary Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Disbursed Date</th>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Base Wage</th>
                  <th className="py-2.5 px-3 text-center">Days Present</th>
                  <th className="py-2.5 px-3 text-right">Bonus / Deduct</th>
                  <th className="py-2.5 px-3 text-right">Net Paid</th>
                  <th className="py-2.5 px-3 text-center">Payment Mode</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {sal.voucherNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {sal.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {sal.userName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {sal.month}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                      ₹{sal.monthlyBaseSalary.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                      {sal.daysPresent} days
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                      <span className="text-emerald-600">+₹{sal.bonus || 0}</span> /{' '}
                      <span className="text-rose-600">-₹{sal.deductions || 0}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 text-sm whitespace-nowrap">
                      ₹{sal.netPaid.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {sal.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {sal.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISBURSE SALARY MODAL */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Issue Staff Salary Payment
              </h3>
              <button
                onClick={() => setIsSalaryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisburseSalary} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Staff Member
                </label>
                <select
                  value={payStaffId}
                  onChange={(e) => handleSelectPayStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - Base: ₹{(u.baseSalary || 18000).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payroll Month
                  </label>
                  <input
                    type="month"
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Monthly Wage (₹)
                  </label>
                  <input
                    type="number"
                    value={baseWage}
                    onChange={(e) => setBaseWage(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Days Present (out of 30)
                  </label>
                  <input
                    type="number"
                    max={31}
                    min={0}
                    value={presentDays}
                    onChange={(e) => setPresentDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bonus / Incentive (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium focus:border-blue-500"
                  >
                    <option value="Cash">Cash in Till</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                  </select>
                </div>

                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col justify-center text-right">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Net Amount to Pay</span>
                  <span className="text-base font-black text-emerald-800 font-mono">
                    ₹{calculatedNetPay.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Voucher Notes
                </label>
                <input
                  type="text"
                  value={salaryNotes}
                  onChange={(e) => setSalaryNotes(e.target.value)}
                  placeholder="e.g. Month salary + festival bonus"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm shadow-emerald-100 cursor-pointer transition-colors"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
