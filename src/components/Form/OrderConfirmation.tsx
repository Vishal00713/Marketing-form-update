import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Mail, 
  Printer, 
  Search, 
  ExternalLink, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ArrowRight,
  Download,
  Eye,
  FileCheck
} from 'lucide-react';
import { PrintOrder } from '../../types/form';
import { generateOrderConfirmationEmail } from '../../services/emailService';

interface OrderConfirmationProps {
  order: PrintOrder;
  onTrackOrder: (orderId: string) => void;
  onNewRequest: () => void;
  spreadsheetUrl?: string;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onTrackOrder,
  onNewRequest,
  spreadsheetUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const emailData = generateOrderConfirmationEmail(order);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Success Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center transition-all">
        
        {/* Animated Check Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-950/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
          Order Successfully Dispatched
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
          Thank you, {order.requester.fullName}!
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          Your print request has been queued in our production pipeline. A full confirmation receipt has been generated for <strong>{order.requester.email}</strong>.
        </p>

        {/* Tracking ID Pill */}
        <div className="mt-6 inline-flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">Order Tracking ID:</span>
          <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">{order.id}</span>
          <button
            onClick={handleCopyId}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Copy ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Summary Details Box */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-left">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
            Production Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Job Title:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{order.jobTitle}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Quantity & Product:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {(order.totalQuantity || order.specs?.quantity || 1).toLocaleString()} units &bull; {order.specs?.itemType || order.vendorName || 'Signage'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Location / City:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.city || order.specs?.paperSize || 'N/A'} ({order.blBoard || order.specs?.paperStock || 'Standard'})
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Work Period:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.workStartDate || order.delivery?.dueDate || 'N/A'} to {order.weekEndingDate || ''}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Estimated Cost:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-base">${order.pricing?.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Fulfillment:</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {(order.delivery?.method || 'Standard Site Audit').replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setShowEmailModal(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-sm border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>View Email Confirmation</span>
          </button>

          <button
            onClick={() => onTrackOrder(order.id)}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track Progress</span>
          </button>

          <button
            onClick={handlePrintSlip}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Job Ticket</span>
          </button>

          <button
            onClick={onNewRequest}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <span>Submit Another Request</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Email Preview Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email Confirmation Preview (Dispatched to {order.requester.email})</span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
              <div 
                className="bg-white text-slate-900 rounded-xl shadow p-2"
                dangerouslySetInnerHTML={{ __html: emailData.htmlContent }} 
              />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
