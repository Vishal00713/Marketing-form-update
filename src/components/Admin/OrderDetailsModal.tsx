import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  User, 
  Mail, 
  Building, 
  FileText,
  Calendar,
  Layers,
  MapPin,
  Check
} from 'lucide-react';
import { PrintOrder, OrderStatus } from '../../types/form';

interface OrderDetailsModalProps {
  order: PrintOrder | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, note: string) => void;
  onPrintTicket: (order: PrintOrder) => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending Audit Review', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { value: 'proof_review', label: 'Proof / Spec Verification', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  { value: 'printing', label: 'In Production (Printing)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { value: 'finishing', label: 'Finishing & Mounting', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { value: 'ready', label: 'Installed / Ready for Audit', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { value: 'completed', label: 'Completed & Closed', color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'cancelled', label: 'Cancelled / Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' }
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onPrintTicket
}) => {
  if (!order) return null;

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [operatorNote, setOperatorNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const noteText = operatorNote.trim() || `Status updated to ${selectedStatus.replace('_', ' ')}`;
    onUpdateStatus(order.id, selectedStatus, noteText);
    setOperatorNote('');
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <span className="font-mono font-extrabold text-lg text-slate-900 dark:text-white">
              {order.id}
            </span>
            <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {order.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintTicket(order)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Inspection Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Status Action Bar */}
          <form onSubmit={handleStatusChange} className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                  Update Stage:
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Optional audit log note..."
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg bg-[#673ab7] hover:bg-[#5a2e9d] text-white font-bold text-xs shadow-sm shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>
          </form>

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vendor & Location Details */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <span>Vendor & Site Information</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Vendor Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{order.vendorName || order.requester?.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">City / Location:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{order.city || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">BL Board Identifier:</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{order.blBoard || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Submitter Email:</span>
                    <a href={`mailto:${order.requester?.email || order.formData?.submitterEmail}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {order.requester?.email || order.formData?.submitterEmail}
                    </a>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Total Artwork Units:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{order.totalQuantity} units</span>
                  </div>
                </div>
              </div>

              {/* Dates & Timeline */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>Work Period Dates</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Work Star Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{order.workStartDate || order.formData?.workStartDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Week Ending Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{order.weekEndingDate || order.formData?.weekEndingDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Recorded Timestamp:</span>
                    <span className="text-slate-600 dark:text-slate-300">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Artwork Breakdown & Files */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Artwork Quantity & Types</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {order.artworkItems && order.artworkItems.length > 0 ? (
                    order.artworkItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.artworkType}</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">{item.quantity} units</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">Total Quantity: {order.totalQuantity}</div>
                  )}

                  {order.formData?.specialNotes && (
                    <div className="pt-2">
                      <span className="text-slate-500 block mb-1 font-medium">Remarks / Site Notes:</span>
                      <p className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {order.formData.specialNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Files */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>Proof Files ({order.files?.length || 0})</span>
                </h3>

                {order.files && order.files.length > 0 ? (
                  <div className="space-y-2">
                    {order.files.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="truncate max-w-[200px] font-medium text-slate-800 dark:text-slate-200">
                          {f.name}
                        </span>
                        {f.driveViewLink ? (
                          <a
                            href={f.driveViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View on Drive</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">Attached</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No files attached to this record.</p>
                )}
              </div>
            </div>

          </div>

          {/* Audit Trail / History */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
              Status Change History
            </h3>
            <div className="space-y-2">
              {order.statusHistory.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 mr-2">
                      {item.status}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{item.note}</span>
                    <span className="text-slate-400 ml-2">by {item.updatedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
