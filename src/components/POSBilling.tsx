import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, CartItem, ProductUnit, PaymentMode, Customer, SaleInvoice } from '../types';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  User,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

export const POSBilling: React.FC = () => {
  const { products, customers, createSale, currentUser } = useApp();

  // Billing header states
  const [billDate, setBillDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Customer states
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState<boolean>(false);

  // Catalog search & filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Active Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout states
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0); // 0 or 5
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Selected item modal for weight / custom qty
  const [activeItemForAdd, setActiveItemForAdd] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalUnit, setModalUnit] = useState<ProductUnit>('kg');
  const [modalRate, setModalRate] = useState<number>(0);

  // Recently completed invoice for receipt modal
  const [completedInvoice, setCompletedInvoice] = useState<SaleInvoice | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Customer suggestions
  const customerSuggestions = useMemo(() => {
    const q = (custPhone || custName).trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.id.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [customers, custName, custPhone]);

  // Find matched customer object for credit alert
  const matchedCustomer = useMemo(() => {
    if (selectedCustomerId) {
      return customers.find((c) => c.id === selectedCustomerId) || null;
    }
    if (custPhone) {
      return customers.find((c) => c.phone === custPhone.trim()) || null;
    }
    return null;
  }, [customers, selectedCustomerId, custPhone]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.amount, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (taxPercent === 0) return 0;
    const taxableBase = Math.max(0, subtotal - discount);
    return parseFloat(((taxableBase * taxPercent) / 100).toFixed(2));
  }, [subtotal, discount, taxPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, parseFloat((subtotal - discount + taxAmount).toFixed(2)));
  }, [subtotal, discount, taxAmount]);

  const changeToReturn = useMemo(() => {
    const rec = parseFloat(amountReceived);
    if (isNaN(rec) || rec < grandTotal) return 0;
    return parseFloat((rec - grandTotal).toFixed(2));
  }, [amountReceived, grandTotal]);

  const balanceDue = useMemo(() => {
    if (paymentMode === 'Credit') {
      const rec = parseFloat(amountReceived) || 0;
      return Math.max(0, parseFloat((grandTotal - rec).toFixed(2)));
    }
    const rec = parseFloat(amountReceived);
    if (isNaN(rec)) return 0;
    if (rec < grandTotal) {
      return parseFloat((grandTotal - rec).toFixed(2));
    }
    return 0;
  }, [paymentMode, amountReceived, grandTotal]);

  // Cart operations
  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();

    // If unit is kg, open modal to let user choose grams (e.g. 250g, 500g)
    if (product.unit === 'kg') {
      handleOpenAddModal(product);
      return;
    }

    // Otherwise add 1 unit directly
    const existingIndex = cart.findIndex((item) => item.productId === product.id && item.unit === product.unit);
    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].qty + 1;
      updated[existingIndex].qty = newQty;
      updated[existingIndex].amount = parseFloat((newQty * updated[existingIndex].rate).toFixed(2));
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        code: product.code,
        name: product.name,
        qty: 1,
        unit: product.unit,
        rate: product.rate,
        amount: product.rate,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleOpenAddModal = (product: Product) => {
    setActiveItemForAdd(product);
    setModalRate(product.rate);
    setModalUnit(product.unit);
    setModalQty(product.unit === 'kg' ? 0.5 : 1);
  };

  const handleConfirmModalAdd = () => {
    if (!activeItemForAdd) return;

    let computedAmount = 0;
    let finalQty = modalQty;

    if (modalUnit === 'gram') {
      computedAmount = parseFloat(((finalQty / 1000) * activeItemForAdd.rate).toFixed(2));
    } else {
      computedAmount = parseFloat((finalQty * modalRate).toFixed(2));
    }

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: activeItemForAdd.id,
      code: activeItemForAdd.code,
      name: activeItemForAdd.name,
      qty: finalQty,
      unit: modalUnit,
      rate: modalRate,
      amount: computedAmount,
    };

    setCart([...cart, newItem]);
    setActiveItemForAdd(null);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cart];
    const item = updated[index];
    item.qty = parseFloat(newQty.toFixed(2));

    if (item.unit === 'gram') {
      item.amount = parseFloat(((item.qty / 1000) * item.rate).toFixed(2));
    } else {
      item.amount = parseFloat((item.qty * item.rate).toFixed(2));
    }
    setCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from current cart?')) {
      setCart([]);
    }
  };

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustName(c.name);
    setCustPhone(c.phone);
    setShowCustomerSuggestions(false);
  };

  const handleSetWalkIn = () => {
    setCustName('Walk-in Customer');
    setCustPhone('');
    setSelectedCustomerId('CUST-GUEST');
    setShowCustomerSuggestions(false);
  };

  // Submit Order
  const handleCompleteOrder = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items before checkout.');
      return;
    }

    const finalCustName = custName.trim() || 'Walk-in Customer';
    const finalReceived =
      amountReceived === ''
        ? paymentMode === 'Credit'
          ? 0
          : grandTotal
        : parseFloat(amountReceived) || 0;

    const invoice = createSale({
      customerName: finalCustName,
      customerPhone: custPhone.trim(),
      items: cart,
      paymentMode: paymentMode,
      amountReceived: finalReceived,
      discount: discount,
      tax: taxAmount,
      notes: notes,
      customDate: billDate,
    });

    // Show receipt
    setCompletedInvoice(invoice);
  };

  // Reset to brand new blank bill
  const handleNewSale = () => {
    setCompletedInvoice(null);
    setCart([]);
    setCustName('');
    setCustPhone('');
    setSelectedCustomerId('');
    setDiscount(0);
    setTaxPercent(0);
    setPaymentMode('Cash');
    setAmountReceived('');
    setNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Top Meta Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
              POS Terminal
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Biller: <strong className="text-slate-700">{currentUser?.name || 'Staff'}</strong> ({currentUser?.role?.toUpperCase()})</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-blue-600">
                <Clock className="w-3 h-3" />
                Live Register
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector & Clean New Bill Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Date:</span>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="bg-transparent border-none font-medium focus:outline-none text-slate-700 cursor-pointer text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleNewSale}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear / Blank Bill
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: ITEM CATALOG (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Category Tabs */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products or scan barcode (e.g. Banana, Plum, BC01)..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isKg = product.unit === 'kg';
              const isLowStock = product.stock <= product.minStockAlert;

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenAddModal(product)}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Category Accent */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {product.code}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isLowStock
                          ? 'bg-rose-50 text-rose-700 font-semibold'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {product.stock} {product.unit}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {product.category}
                    </p>
                  </div>

                  {/* Price & Add Action */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-blue-600">
                        ₹{product.rate}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        /{product.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      title={isKg ? 'Pick Weight / Grams' : 'Add 1 to Cart'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-medium">No items found matching "{searchTerm}"</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  className="mt-2 text-xs text-blue-600 underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CART & CHECKOUT (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Customer Selection Box */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 relative">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Customer Details
              </div>

              <button
                type="button"
                onClick={handleSetWalkIn}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-100 transition-colors cursor-pointer"
              >
                + Walk-in Guest
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => {
                    setCustName(e.target.value);
                    setSelectedCustomerId('');
                    setShowCustomerSuggestions(true);
                  }}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  placeholder="Customer Name"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => {
                    setCustPhone(e.target.value);
                    setSelectedCustomerId('');
                    setShowCustomerSuggestions(true);
                  }}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  placeholder="Phone (10 digits)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono bg-slate-50/50"
                />
              </div>
            </div>

            {/* Customer Credit Alert Banner */}
            {matchedCustomer && matchedCustomer.balanceDue > 0 && (
              <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    Past Due: <strong>₹{matchedCustomer.balanceDue.toFixed(2)}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                  Credit Account
                </span>
              </div>
            )}

            {/* Customer Dropdown Suggestions */}
            {showCustomerSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-40 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {customerSuggestions.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.phone || 'No phone'} • ID: {c.id}
                      </div>
                    </div>
                    <div className="text-right">
                      {c.balanceDue > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Due: ₹{c.balanceDue}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">Clear Balance</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table Container */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 tracking-tight">
                  Current Order
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                  #{cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto p-2">
              {cart.map((item, idx) => (
                <div key={item.id || idx} className="py-2.5 px-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ₹{item.rate} / {item.unit}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, item.qty - (item.unit === 'gram' ? 50 : 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>

                    <span className="font-semibold text-slate-800 min-w-[34px] text-center text-xs">
                      {item.qty} <span className="text-[10px] text-slate-400">{item.unit}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, item.qty + (item.unit === 'gram' ? 50 : 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[65px]">
                    <div className="font-bold text-slate-900">
                      ₹{item.amount.toFixed(2)}
                    </div>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-1 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-slate-400">
                    Tap items from catalog to start billing
                  </p>
                </div>
              )}
            </div>

            {/* Calculations & Payment Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount & Tax Controls */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[11px]">Discount:</span>
                  <input
                    type="number"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="₹0"
                    className="w-full text-right font-medium focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[11px]">GST / Tax:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTaxPercent(0)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        taxPercent === 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      0%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxPercent(5)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        taxPercent === 5 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      5%
                    </button>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-700">Total</span>
                <span className="text-2xl font-black text-blue-600">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('Cash');
                      setAmountReceived('');
                    }}
                    className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      paymentMode === 'Cash'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('UPI');
                      setAmountReceived('');
                    }}
                    className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      paymentMode === 'UPI'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    UPI / QR
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('Credit');
                      setAmountReceived('0');
                    }}
                    className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      paymentMode === 'Credit'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Credit
                  </button>
                </div>
              </div>

              {/* Received Amount Input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amountReceived !== '' ? amountReceived : (paymentMode === 'Credit' ? 0 : grandTotal)}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1 text-right pt-4">
                  {balanceDue > 0 ? (
                    <div className="text-rose-700 font-bold text-xs bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                      <div>Credit Due:</div>
                      <div className="text-sm font-extrabold">₹{balanceDue.toFixed(2)}</div>
                    </div>
                  ) : (
                    <div className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      <div>Change to Return:</div>
                      <div className="text-sm font-extrabold">₹{changeToReturn.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Sale Button (Clean Minimalism style: bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all) */}
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={cart.length === 0}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  cart.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                COMPLETE BILLING (₹{grandTotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WEIGHT / QUANTITY SELECTOR MODAL */}
      {activeItemForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Add {activeItemForAdd.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Base Price: ₹{activeItemForAdd.rate} per {activeItemForAdd.unit}
            </p>

            <div className="space-y-3">
              {/* Unit selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit Option
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalUnit(activeItemForAdd.unit);
                      setModalQty(1);
                    }}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      modalUnit === activeItemForAdd.unit
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Standard ({activeItemForAdd.unit})
                  </button>

                  {activeItemForAdd.unit === 'kg' && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalUnit('gram');
                        setModalQty(250);
                      }}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        modalUnit === 'gram'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Weight in Grams
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Gram Buttons if in gram mode */}
              {modalUnit === 'gram' && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[100, 250, 500, 750].map((gm) => (
                    <button
                      key={gm}
                      type="button"
                      onClick={() => setModalQty(gm)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        modalQty === gm
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {gm}g
                    </button>
                  ))}
                </div>
              )}

              {/* Quantity input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity ({modalUnit})
                </label>
                <input
                  type="number"
                  step={modalUnit === 'gram' ? '10' : '0.1'}
                  min="0.01"
                  value={modalQty}
                  onChange={(e) => setModalQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Computed Amount Preview */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Calculated Line Total:</span>
                <span className="font-black text-sm text-blue-600">
                  ₹
                  {(modalUnit === 'gram'
                    ? (modalQty / 1000) * activeItemForAdd.rate
                    : modalQty * modalRate
                  ).toFixed(2)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveItemForAdd(null)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModalAdd}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-100 transition-colors cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED INVOICE RECEIPT MODAL */}
      {completedInvoice && (
        <InvoiceReceiptModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  );
};
