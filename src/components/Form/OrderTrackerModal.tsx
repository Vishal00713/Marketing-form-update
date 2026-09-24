import React, { useState } from 'react';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Package, 
  AlertCircle,
  Truck,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { PrintOrder, OrderStatus } from '../../types/form';
import { fetchOrderByIdFromFirestore } from '../../services/firebase';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PrintOrder[];
  initialOrderId?: string;
}

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'Submission Recorded', desc: 'Weekly tracker entry received and logged in Google Sheets' },
  { status: 'proof_review', label: 'Audit & Proof Review', desc: 'Verifying dimensions, photos, and BL board codes' },
  { status: 'printing', label: 'In Production (Printing)', desc: 'Fabrication & printing of flex / vinyl artwork' },
  { status: 'finishing', label: 'Mounting & Finishing', desc: 'Eyelets, framing, mounting on site' },
  { status: 'ready', label: 'Installation Complete', desc: 'Signage staged / installed on site' },
  { status: 'completed', label: 'Audited & Verified', desc: 'Monthly cycle audit verified and approved' }
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialOrderId = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderId);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(() => {
    if (initialOrderId) {
      return orders.find(o => o.id.toLowerCase() === initialOrderId.toLowerCase()) || null;
    }
    return orders[0] || null;
  });

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setSearchNotFound(false);
    const termLower = term.toLowerCase();

    // 1. Try finding in local orders array
    const found = orders.find(
      o => o.id.toLowerCase() === termLower || 
        (o.requester?.email && o.requester.email.toLowerCase() === termLower) ||
        (o.formData?.submitterEmail && o.formData.submitterEmail.toLowerCase() === termLower)
    );

    if (found) {
      setSelectedOrder(found);
      return;
    }

    // 2. Query Firestore directly by Order ID
    setIsSearchingOnline(true);
    try {
      const remoteOrder = await fetchOrderByIdFromFirestore(term);
      if (remoteOrder) {
        setSelectedOrder(remoteOrder);
      } else {
        setSelectedOrder(null);
        setSearchNotFound(true);
      }
    } catch (err) {
      console.warn('Firestore order search notice:', err);
      setSelectedOrder(null);
      setSearchNotFound(true);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const getStatusIndex = (currentStatus: OrderStatus) => {
    if (currentStatus === 'cancelled') return -1;
    return STATUS_STEPS.findIndex(s => s.status === currentStatus);
  };

  const activeIndex = selectedOrder ? getStatusIndex(selectedOrder.status) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#673ab7] text-white flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Signage Submission Tracker</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track real-time audit status, installation verification, and timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Lookup Input Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter Submission ID (e.g. WST-2026-1042) or Submitter Email"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingOnline}
              className="px-5 py-2.5 bg-[#673ab7] hover:bg-[#5a2e9d] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center min-w-[90px] disabled:opacity-70"
            >
              {isSearchingOnline ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Searching
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {searchNotFound && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No order found with ID or email <strong>"{searchTerm}"</strong> in local records or Firebase database.</span>
            </div>
          )}

          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Order Banner */}
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#673ab7] dark:text-purple-300">
                      {selectedOrder.id}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-[#673ab7] dark:text-purple-200">
                      {selectedOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                    {selectedOrder.vendorName || selectedOrder.jobTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    BL Board: {selectedOrder.blBoard || 'N/A'} &bull; City: {selectedOrder.city || 'Standard'} &bull; Total Units: {selectedOrder.totalQuantity}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Work Period</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {selectedOrder.workStartDate || 'N/A'} to {selectedOrder.weekEndingDate || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Progress Pipeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Audit & Production Pipeline
                </h3>

                <div className="space-y-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div
                        key={step.status}
                        className={`flex items-start gap-3.5 p-3 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                            : isDone
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent
                            ? 'bg-[#673ab7] text-white animate-pulse'
                            : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${
                              isCurrent 
                                ? 'text-[#673ab7] dark:text-purple-300' 
                                : isDone 
                                  ? 'text-slate-900 dark:text-white' 
                                  : 'text-slate-500'
                            }`}>
                              {step.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                                Current Stage
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Timeline History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Audit Verification Logs
                  </h3>
                  <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4 ml-2">
                    {selectedOrder.statusHistory.map((item) => (
                      <div key={item.id} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900" />
                        <span className="text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          <span className="font-bold text-purple-600 dark:text-purple-400 uppercase text-[10px] mr-1.5">
                            [{item.status}]
                          </span>
                          {item.note}
                          <span className="text-slate-400 ml-1">({item.updatedBy})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No submission found</p>
              <p className="text-xs text-slate-400 mt-1">Please double check your submission reference ID or submitter email address.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
