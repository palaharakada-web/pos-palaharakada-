import React, { useState } from 'react';
import { Product } from '../types';
import { generateBarcodeSvg, generateWeightBarcode } from '../utils/barcodeUtils';
import { Printer, Scale, X, Copy, Check, Download } from 'lucide-react';

interface BarcodeLabelModalProps {
  product: Product;
  onClose: () => void;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({ product, onClose }) => {
  const [mode, setMode] = useState<'standard' | 'weight'>('standard');
  const [customWeightGrams, setCustomWeightGrams] = useState<number>(() => {
    return product.unit === 'kg' ? 350 : 250;
  });
  const [labelCopies, setLabelCopies] = useState(1);
  const [copied, setCopied] = useState(false);

  // Compute code to display
  const standardBarcode = product.barcode || product.code;
  const weightBarcode = generateWeightBarcode(product.code, customWeightGrams);
  const activeBarcode = mode === 'weight' ? weightBarcode : standardBarcode;

  // Rate calculation
  const weightKg = customWeightGrams / 1000;
  const itemPriceForWeight = (product.rate * weightKg).toFixed(2);

  const barcodeSvg = generateBarcodeSvg(activeBarcode, 280, 70);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeBarcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              |||
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Barcode Label Generator</h3>
              <p className="text-xs text-slate-500 font-medium">{product.name} ({product.code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setMode('standard')}
              className={`flex-1 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'standard' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard Item Barcode
            </button>
            <button
              onClick={() => setMode('weight')}
              className={`flex-1 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'weight' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              Custom Packed Weight Barcode
            </button>
          </div>

          {/* If Custom Weight selected */}
          {mode === 'weight' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>Enter Net Packet Weight (Grams):</span>
                <span className="font-mono text-blue-700">{weightKg.toFixed(3)} kg</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50000}
                  step={10}
                  value={customWeightGrams}
                  onChange={(e) => setCustomWeightGrams(Math.max(1, Number(e.target.value)))}
                  className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-500">grams</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100, 200, 250, 400, 500, 750, 1000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setCustomWeightGrams(quick)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer ${
                      customWeightGrams === quick
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {quick}g
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-blue-700">
                Calculated Price for {customWeightGrams}g: <strong>₹{itemPriceForWeight}</strong> (at ₹{product.rate}/{product.unit})
              </p>
            </div>
          )}

          {/* Visual Sticker Label Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
            <div className="w-full max-w-[280px] bg-white p-3 rounded-lg border border-slate-300 shadow-xs text-center space-y-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                CM Palaharakada & Bakery
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">{product.name}</div>
              
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 px-1">
                <span>Code: {product.code}</span>
                {mode === 'weight' ? (
                  <span className="font-bold text-blue-700">Wt: {customWeightGrams}g</span>
                ) : (
                  <span>Unit: {product.unit}</span>
                )}
              </div>

              {/* Render SVG */}
              <div
                className="py-1 flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />

              <div className="flex items-center justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200 px-1">
                <span className="text-[11px] text-slate-500 font-normal">
                  {product.wholesaleRate ? `Whl: ₹${product.wholesaleRate}` : 'Fresh Daily'}
                </span>
                <span className="text-emerald-700">
                  MRP: ₹{mode === 'weight' ? itemPriceForWeight : product.rate}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">Standard 50mm x 35mm Thermal Sticker Layout</span>
          </div>

          {/* Barcode Number details */}
          <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs">
            <div className="font-mono text-slate-700 font-bold tracking-wider">
              {activeBarcode}
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Sticker Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
