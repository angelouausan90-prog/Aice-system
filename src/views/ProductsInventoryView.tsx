/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, ProductCategory, InventoryMovement, Supplier, UserRole } from '../types.ts';
import { Modal } from '../components/Modal.tsx';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  ArrowUpDown, 
  Truck, 
  History, 
  Building2, 
  Layers,
  CheckCircle2
} from 'lucide-react';

interface ProductsInventoryViewProps {
  currentRole: UserRole;
  products: Product[];
  categories: ProductCategory[];
  movements: InventoryMovement[];
  suppliers: Supplier[];
  onAddStockMovement: (data: any) => Promise<void>;
  onAddProduct?: (data: any) => Promise<void>;
}

export const ProductsInventoryView: React.FC<ProductsInventoryViewProps> = ({
  currentRole,
  products,
  categories,
  movements,
  suppliers,
  onAddStockMovement,
  onAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'MOVEMENTS' | 'SUPPLIERS'>('PRODUCTS');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Adjustment Form State
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [adjustQty, setAdjustQty] = useState(50);
  const [adjustRef, setAdjustRef] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustRef(`PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 899 + 100)}`);
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmittingAdjust(true);

    const actualQty = movementType === 'STOCK_OUT' ? -Math.abs(adjustQty) : Math.abs(adjustQty);

    try {
      await onAddStockMovement({
        productId: selectedProduct.id,
        movementType,
        quantity: actualQty,
        referenceType: movementType === 'STOCK_IN' ? 'PO' : 'ADJUSTMENT',
        referenceId: adjustRef,
        notes: adjustNotes || 'Manual warehouse stock verification',
      });

      setShowAdjustModal(false);
      setSelectedProduct(null);
      setAdjustNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Mode Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Products & Sub-Zero Inventory Management
          </h2>
          <p className="text-xs text-slate-500">
            Internal franchise supply catalog, cold storage stock levels, and warehouse movement ledger
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PRODUCTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MOVEMENTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Movement Ledger ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SUPPLIERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suppliers & Plants ({suppliers.length})
          </button>
        </div>
      </div>

      {/* PRODUCTS VIEW */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search product or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="ALL">All Product Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const isLowStock = product.stockQuantity <= product.lowStockThreshold;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Image Banner */}
                    <div className="h-36 w-full bg-slate-100 relative overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                          {product.sku}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        {isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3 h-3" /> LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                            In Stock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        {product.categoryName}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Wholesale Price</span>
                          <span className="font-bold text-slate-900 font-mono">
                            Php {product.internalPricePhp.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">per {product.unitOfMeasure}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Current Stock</span>
                          <span className={`font-black text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                            {product.stockQuantity}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Min Threshold: {product.lowStockThreshold}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentRole === 'Admin' && (
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenAdjust(product)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        Adjust Stock
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MOVEMENTS LEDGER VIEW */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Inventory Movement & Dispatch Ledger</h3>
            <p className="text-xs text-slate-500">Immutable chronological record of all warehouse ins, outs, and franchisee fulfillments</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Item & SKU</th>
                  <th className="px-6 py-3.5">Movement Type</th>
                  <th className="px-6 py-3.5 text-center">Quantity</th>
                  <th className="px-6 py-3.5 text-center">Previous → New</th>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{m.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.sku}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        m.movementType === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' :
                        m.movementType === 'SUPPLY_REQUEST_FULFILLMENT' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-bold">
                      <span className={m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono text-slate-600">
                      {m.previousStock} → <strong>{m.newStock}</strong>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">
                      {m.referenceId}
                      {m.notes && <div className="text-[10px] text-slate-400 italic">{m.notes}</div>}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {m.createdByUserName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS VIEW */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active Supplier
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{sup.supplierName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Contact: {sup.contactPerson}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div><strong>Phone:</strong> {sup.phone}</div>
                  <div><strong>Email:</strong> {sup.email}</div>
                  <div><strong>Plant / Facility:</strong> {sup.address}</div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {sup.suppliedCategories.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {sup.notes && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
                  "{sup.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && selectedProduct && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title={`Adjust Inventory: ${selectedProduct.name}`}
          subtitle={`SKU: ${selectedProduct.sku} • Current Stock: ${selectedProduct.stockQuantity} ${selectedProduct.unitOfMeasure}`}
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Transaction Type *
              </label>
              <select
                value={movementType}
                onChange={(e: any) => setMovementType(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="STOCK_IN">STOCK IN (Warehouse Inbound Delivery from Plant)</option>
                <option value="STOCK_OUT">STOCK OUT (Promotional / Sampling / Audit Deduction)</option>
                <option value="ADJUSTMENT">STOCK ADJUSTMENT (Physical Inventory Count Reconciliation)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Quantity Units * ({selectedProduct.unitOfMeasure})
              </label>
              <input
                type="number"
                required
                min={1}
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value || '1', 10))}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Reference PO or Bill of Lading Number *
              </label>
              <input
                type="text"
                required
                value={adjustRef}
                onChange={(e) => setAdjustRef(e.target.value)}
                placeholder="e.g. PO-2026-089"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Transaction Explanation Notes
              </label>
              <textarea
                rows={2}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Details of delivery cold truck, temperature audit..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdjust}
                className="px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAdjust ? 'Updating Ledger...' : 'Commit Stock Movement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
