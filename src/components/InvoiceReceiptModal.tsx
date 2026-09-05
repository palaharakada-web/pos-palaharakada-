import React, { useState } from 'react';
import { SaleInvoice } from '../types';
import { Printer, Download, X, PlusCircle, CheckCircle, FileText, Smartphone } from 'lucide-react';

interface InvoiceReceiptModalProps {
  invoice: SaleInvoice | null;
  onClose: () => void;
  onNewSale: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  onClose,
  onNewSale,
}) => {
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'a5'>('thermal');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const textLines = [
      '==========================================',
      '        CM PALAHARA KADA & BAKERY         ',
      '      Main Road, Market Junction, Calicut ',
      '            Phone: +91 98470 12345        ',
      '==========================================',
      `Invoice No: ${invoice.invoiceNo}`,
      `Date & Time: ${invoice.date} ${invoice.time}`,
      `Cashier: ${invoice.cashierName} (${invoice.cashierId})`,
      `Customer: ${invoice.customerName} [${invoice.customerId}]`,
      invoice.customerPhone ? `Phone: ${invoice.customerPhone}` : '',
      `Payment Mode: ${invoice.paymentMode}`,
      '------------------------------------------',
      'ITEMS: ',
      ...invoice.items.map(
        (i) =>
          `${i.name.padEnd(22)} ${String(i.qty + ' ' + i.unit).padEnd(8)} ₹${i.amount.toFixed(2)}`
      ),
      '------------------------------------------',
      `Subtotal:       ₹${invoice.subtotal.toFixed(2)}`,
      invoice.discount > 0 ? `Discount:      -₹${invoice.discount.toFixed(2)}` : '',
      invoice.tax > 0 ? `Tax/GST:       +₹${invoice.tax.toFixed(2)}` : '',
      `GRAND TOTAL:    ₹${invoice.grandTotal.toFixed(2)}`,
      `Paid:           ₹${invoice.amountReceived.toFixed(2)}`,
      invoice.balanceDue > 0
        ? `BALANCE DUE:    ₹${invoice.balanceDue.toFixed(2)} (CREDIT)`
        : `Change:         ₹${Math.max(0, invoice.amountReceived - invoice.grandTotal).toFixed(2)}`,
      '==========================================',
      '        THANK YOU FOR SHOPPING!           ',
      '       Please visit again soon!           ',
      '==========================================',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNo}_Receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-6 print:max-w-full print:border-none print:shadow-none print:m-0">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Order Billed Successfully!
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Auto-Backed Up
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Invoice: {invoice.invoiceNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 rounded-lg p-0.5 flex border border-slate-200">
              <button
                type="button"
                onClick={() => setReceiptFormat('thermal')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  receiptFormat === 'thermal'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm Slip
              </button>
              <button
                type="button"
                onClick={() => setReceiptFormat('a5')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  receiptFormat === 'a5'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A5 Bill
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-5 max-h-[70vh] overflow-y-auto bg-slate-50 print:bg-white print:p-0 print:max-h-none">
          <div
            id="printable-receipt"
            className={`mx-auto bg-white p-6 shadow-xs border border-slate-200 print:shadow-none print:border-none print:p-2 ${
              receiptFormat === 'thermal'
                ? 'max-w-[340px] font-mono text-xs'
                : 'max-w-md font-sans text-sm'
            }`}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                CM Palahara Kada & Bakery
              </h2>
              <p className="text-[11px] text-slate-600">
                Main Road, Market Junction, Calicut
              </p>
              <p className="text-[11px] text-slate-400">
                GSTIN: 32AABCC1234F1Z8 • Ph: +91 98470 12345
              </p>
              <div className="mt-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 rounded">
                Retail Sales Invoice
              </div>
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Invoice: <strong className="font-bold text-slate-900">{invoice.invoiceNo}</strong></span>
                <span>Date: {invoice.date}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Time: {invoice.time}</span>
                <span>Cashier: {invoice.cashierName}</span>
              </div>
              <div className="pt-1 text-[11px]">
                <div>Customer: <strong className="text-slate-900">{invoice.customerName}</strong> [{invoice.customerId}]</div>
                {invoice.customerPhone && (
                  <div>Phone: <span className="font-mono">{invoice.customerPhone}</span></div>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Rate</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-1 pr-1 font-medium leading-tight">
                        {item.name}
                      </td>
                      <td className="py-1 px-1 text-center whitespace-nowrap text-slate-600">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-1 px-1 text-right text-slate-600 whitespace-nowrap">
                        ₹{item.rate.toFixed(2)}
                      </td>
                      <td className="py-1 pl-1 text-right font-semibold whitespace-nowrap">
                        ₹{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{invoice.discount.toFixed(2)}</span>
                </div>
              )}

              {invoice.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax</span>
                  <span>+₹{invoice.tax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-blue-600">₹{invoice.grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span>Payment Mode: <strong className="text-slate-800">{invoice.paymentMode}</strong></span>
                <span>Paid: <strong className="text-slate-800">₹{invoice.amountReceived.toFixed(2)}</strong></span>
              </div>

              {invoice.balanceDue > 0 ? (
                <div className="flex justify-between text-xs font-bold text-rose-700 bg-rose-50 p-1 rounded">
                  <span>BALANCE DUE (CREDIT):</span>
                  <span>₹{invoice.balanceDue.toFixed(2)}</span>
                </div>
              ) : (
                invoice.amountReceived > invoice.grandTotal && (
                  <div className="flex justify-between text-xs text-slate-700">
                    <span>Change Returned:</span>
                    <span>₹{(invoice.amountReceived - invoice.grandTotal).toFixed(2)}</span>
                  </div>
                )
              )}
            </div>

            {/* Receipt Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-600">*** THANK YOU FOR YOUR VISIT ***</div>
              <div>Goods once sold cannot be returned or exchanged.</div>
              <div className="tracking-widest font-mono text-[9px] text-slate-300 pt-1">
                |||| | ||||| |||| || |||||| ||||
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions (Hidden on Print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={onNewSale}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-100 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            New Blank Bill
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Download text receipt"
            >
              <Download className="w-4 h-4" />
              Save File
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
