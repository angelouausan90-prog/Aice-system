/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SupplyRequest, Product, FranchiseeProfile, UserRole } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import { 
  Truck, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SupplyRequestsViewProps {
  currentRole: UserRole;
  currentFranchisee?: FranchiseeProfile;
  supplyRequests: SupplyRequest[];
  products: Product[];
  onSubmitSupplyRequest: (data: any) => Promise<void>;
  onUpdateSupplyStatus: (requestId: string, newStatus: string, comment?: string, notes?: string) => Promise<void>;
  isNewOrderModalOpenInitially?: boolean;
  onCloseNewOrderModal?: () => void;
}

export const SupplyRequestsView: React.FC<SupplyRequestsViewProps> = ({
  currentRole,
  currentFranchisee,
  supplyRequests,
  products,
  onSubmitSupplyRequest,
  onUpdateSupplyStatus,
  isNewOrderModalOpenInitially = false,
  onCloseNewOrderModal,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(isNewOrderModalOpenInitially);
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Admin action state
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Franchisee order creation state: selected items map { [productId]: quantity }
  const [orderItems, setOrderItems] = useState<{ [productId: string]: number }>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Filter based on role: Franchisee only sees their own; Admin sees all
  const visibleRequests = currentRole === 'Franchisee' && currentFranchisee
    ? supplyRequests.filter(s => s.franchiseeId === currentFranchisee.id)
    : supplyRequests;

  const filtered = visibleRequests.filter(s => {
    const matchesSearch = 
      s.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.franchiseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleItemQtyChange = (productId: string, qty: number) => {
    if (qty <= 0) {
      const next = { ...orderItems };
      delete next[productId];
      setOrderItems(next);
    } else {
      setOrderItems({ ...orderItems, [productId]: qty });
    }
  };

  const calculateTotalOrderAmount = () => {
    let sum = 0;
    Object.entries(orderItems).forEach(([pId, qty]) => {
      const prod = products.find(p => p.id === pId);
      if (prod) sum += prod.internalPricePhp * qty;
    });
    return sum;
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFranchisee) return;

    const items = Object.entries(orderItems).map(([productId, requestedQuantity]) => ({
      productId,
      requestedQuantity,
    }));

    if (items.length === 0) {
      alert('Please select at least one product to order.');
      return;
    }

    setIsCreatingOrder(true);

    try {
      await onSubmitSupplyRequest({
        franchiseeId: currentFranchisee.id,
        items,
      });

      setShowCreateModal(false);
      if (onCloseNewOrderModal) onCloseNewOrderModal();
      setOrderItems({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleConfirmAdminStatus = async () => {
    if (!selectedRequest || !actionStatus) return;
    setIsSubmittingAction(true);

    try {
      await onUpdateSupplyStatus(selectedRequest.id, actionStatus, adminComment, deliveryNotes);
      setActionStatus(null);
      setAdminComment('');
      setDeliveryNotes('');
      // update local selected
      const updated = supplyRequests.find(s => s.id === selectedRequest.id);
      if (updated) setSelectedRequest({ ...updated, status: actionStatus as any });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {currentRole === 'Admin' ? 'Franchisee Supply Requests' : 'My Supply Replenishment Orders'}
          </h2>
          <p className="text-xs text-slate-500">
            {currentRole === 'Admin' 
              ? 'Review franchisee inventory replenishment orders and authorize cold chain dispatch'
              : 'Submit bulk orders for ice cream boxes, tubs, freezers, and merchandising supplies'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search order ref #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#E52320]"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Processing">Processing</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Franchisee Order Button */}
          {currentRole === 'Franchisee' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + New Replenishment Order
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Ref #</th>
                <th className="px-6 py-3.5">Franchise Outlet</th>
                <th className="px-6 py-3.5">Items Summary</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Requested Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No supply requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((sr) => (
                  <tr key={sr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {sr.referenceNumber}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {sr.franchiseName}
                      <div className="text-[10px] text-slate-400 font-normal">{sr.representativeName}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      {sr.items.map(i => `${i.productName} (${i.requestedQuantity})`).join(', ')}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      Php {sr.totalAmountPhp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(sr.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sr.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(sr)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Inspect Order
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT ORDER DETAILS MODAL */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => { setSelectedRequest(null); setActionStatus(null); }}
          title={`Supply Order: ${selectedRequest.referenceNumber}`}
          subtitle={`Outlet: ${selectedRequest.franchiseName} • Date: ${new Date(selectedRequest.requestedAt).toLocaleDateString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Order Status</span>
                <StatusBadge status={selectedRequest.status} size="md" />
              </div>

              {/* Admin Decision Actions */}
              {currentRole === 'Admin' && selectedRequest.status !== 'Fulfilled' && selectedRequest.status !== 'Rejected' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActionStatus('Processing')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold cursor-pointer"
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => setActionStatus('Fulfilled')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Fulfill & Dispatch
                  </button>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase">Ordered Products</h4>
              <div className="divide-y divide-slate-100">
                {selectedRequest.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-400">{item.unitOfMeasure} • Php {item.unitPricePhp} each</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono">Qty: {item.requestedQuantity}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Php {(item.unitPricePhp * item.requestedQuantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-[#E52320]">Php {selectedRequest.totalAmountPhp.toLocaleString()}</span>
              </div>
            </div>

            {/* Delivery / Admin Notes */}
            {selectedRequest.deliveryNotes && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <span className="font-bold text-teal-900 block mb-1">Cold Chain Dispatch Notes:</span>
                <p className="text-teal-800">{selectedRequest.deliveryNotes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRM ADMIN STATUS MODAL */}
      {actionStatus && selectedRequest && (
        <Modal
          isOpen={!!actionStatus}
          onClose={() => setActionStatus(null)}
          title={`Update Order Status to ${actionStatus}`}
          subtitle={`Order #${selectedRequest.referenceNumber} for ${selectedRequest.franchiseName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {actionStatus === 'Fulfilled' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Inventory Deduction Notice</div>
                  <div>Marking this order as Fulfilled will automatically deduct stock from central cold inventory and record signed ledger entries.</div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Dispatch / Temperature Audit Notes
              </label>
              <textarea
                rows={3}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Dispatched via refrigerated delivery van plate # NBF-441. In-transit temp logged at -22°C."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionStatus(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleConfirmAdminStatus}
                className="px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Status Update'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE ORDER MODAL (FRANCHISEE ONLY) */}
      {showCreateModal && currentFranchisee && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            if (onCloseNewOrderModal) onCloseNewOrderModal();
          }}
          title="Internal Replenishment Order"
          subtitle={`Ordering for: ${currentFranchisee.franchiseName}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Order Delivery Instructions
              </span>
              <p className="text-slate-600 text-[11px]">
                Shipment will be scheduled to <strong>{currentFranchisee.businessAddress}, {currentFranchisee.city}</strong> via temperature-controlled delivery.
              </p>
            </div>

            {/* Product Item Selection */}
            <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
              {products.map((prod) => {
                const qty = orderItems[prod.id] || 0;
                return (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={prod.imageUrl} alt={prod.name} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <div>
                        <div className="font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {prod.sku} • Php {prod.internalPricePhp} / {prod.unitOfMeasure}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleItemQtyChange(prod.id, Math.max(0, qty - 5))}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => handleItemQtyChange(prod.id, parseInt(e.target.value || '0', 10))}
                        className="w-14 text-center p-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemQtyChange(prod.id, qty + 5)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Estimated Total Order Value</span>
                <span className="text-lg font-black text-white">Php {calculateTotalOrderAmount().toLocaleString()}</span>
              </div>
              <span className="text-xs text-slate-300">
                {Object.keys(orderItems).length} item categories selected
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  if (onCloseNewOrderModal) onCloseNewOrderModal();
                }}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingOrder || Object.keys(orderItems).length === 0}
                className="px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50"
              >
                {isCreatingOrder ? 'Submitting Order...' : 'Submit Replenishment Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
