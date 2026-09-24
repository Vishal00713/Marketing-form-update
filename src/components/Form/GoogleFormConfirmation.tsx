import React, { useState } from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  Mail, 
  Search, 
  FileSpreadsheet, 
  ExternalLink,
  Shield,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import { PrintOrder, AdminSettings } from '../../types/form';
import { generateEmailConfirmationHtml } from '../../services/emailService';

interface GoogleFormConfirmationProps {
  order: PrintOrder;
  adminSettings: AdminSettings;
  onNewResponse: () => void;
  onOpenTracker: (id: string) => void;
  onOpenAdmin?: () => void;
}

export const GoogleFormConfirmation: React.FC<GoogleFormConfirmationProps> = ({
  order,
  adminSettings,
  onNewResponse,
  onOpenTracker,
  onOpenAdmin
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const themeColor = adminSettings.themeColor || '#673ab7';
  const bgColor = adminSettings.bgColor || '#f0ebf8';
  const accentHeight = adminSettings.headerAccentHeight || 10;

  const emailHtml = generateEmailConfirmationHtml(order, adminSettings.businessName);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="min-h-screen py-8 sm:py-16 px-4 font-sans transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-[770px] mx-auto space-y-4">
        
        {/* Google Forms Response Card */}
        <div className="rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Authentic Google Forms Top Accent Line */}
          <div 
            className="w-full transition-all" 
            style={{ 
              backgroundColor: themeColor, 
              height: `${accentHeight}px` 
            }} 
          />

          <div className="p-6 sm:p-8 space-y-4">
            <h1 className="text-2xl sm:text-[30px] font-normal text-[#202124] dark:text-slate-100 leading-snug">
              {adminSettings.formTitle || 'Weekly Signage / Artwork Quantity Tracker'}
            </h1>

            <p className="text-sm text-[#202124] dark:text-slate-200">
              Your response has been recorded.
            </p>

            <div className="pt-2 flex flex-col gap-2.5 text-xs font-medium">
              <button
                type="button"
                onClick={onNewResponse}
                className="text-left underline hover:opacity-80 w-fit"
                style={{ color: themeColor }}
              >
                Submit another response
              </button>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-slate-500 dark:text-slate-400">Tracking Reference ID:</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="font-mono px-2.5 py-1 rounded border flex items-center gap-1.5 transition-all hover:scale-102"
                  style={{
                    color: themeColor,
                    borderColor: `${themeColor}40`,
                    backgroundColor: `${themeColor}12`
                  }}
                >
                  <span className="font-semibold">{order.id}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Action Bar (Email Confirmation & Live Tracking) */}
        <div className="rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-800 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Confirmation dispatched to: <span className="underline">{order.requester?.email || order.formData?.submitterEmail}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Mail className="w-3.5 h-3.5" style={{ color: themeColor }} />
              <span>Preview Email Confirmation</span>
            </button>

            <button
              onClick={() => onOpenTracker(order.id)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Order Tracker</span>
            </button>
          </div>
        </div>

        {/* Email Preview Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Email Confirmation Sent to {order.requester?.email || order.formData?.submitterEmail}
                  </h3>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950">
                <div 
                  className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                  dangerouslySetInnerHTML={{ __html: emailHtml }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 pb-12 text-center text-[11px] text-gray-500 dark:text-slate-500 space-y-2">
          <p>This content is neither created nor endorsed by Google.</p>
          <div className="pt-2 flex items-center justify-center gap-1 text-slate-700 dark:text-slate-400 font-medium text-base">
            <span className="font-semibold tracking-tight text-gray-600 dark:text-gray-300">Google</span>
            <span className="font-normal text-gray-500">Forms</span>
          </div>
        </div>

      </div>
    </div>
  );
};
