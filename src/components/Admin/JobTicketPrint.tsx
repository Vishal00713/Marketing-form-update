import React from 'react';
import { PrintOrder } from '../../types/form';
import { Printer, CheckSquare, Square } from 'lucide-react';

interface JobTicketPrintProps {
  order: PrintOrder;
  onClose: () => void;
}

export const JobTicketPrint: React.FC<JobTicketPrintProps> = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white text-black p-8 overflow-y-auto print:p-0">
      
      {/* Non-print controls bar */}
      <div className="no-print max-w-3xl mx-auto mb-6 flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-lg">
        <div>
          <span className="font-bold text-sm">Print Signage Verification Traveler</span>
          <p className="text-xs text-slate-400">Ready to print to laser printer or site inspector sheet</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#673ab7] hover:bg-[#5a2e9d] text-white font-bold rounded-lg text-xs flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Now</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* The Printable Traveler Document */}
      <div className="max-w-3xl mx-auto border-2 border-black p-6 space-y-5 text-xs font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Weekly Signage / Artwork Production Ticket</h1>
            <p className="text-sm font-semibold">Central Installation & Quality Inspection Record</p>
            <p className="text-xs text-slate-600">Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase font-bold text-slate-500">Tracking Reference</div>
            <div className="font-mono font-black text-2xl tracking-widest">{order.id}</div>
            <div className="inline-block mt-1 font-mono text-[11px] bg-black text-white px-2 py-0.5 rounded">
              {order.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Section 1: Vendor & Site Location */}
        <div className="grid grid-cols-2 gap-4 border-b border-black pb-4">
          <div>
            <div className="font-bold uppercase text-[10px] text-slate-500">Vendor / Contractor</div>
            <div className="font-bold text-sm">{order.vendorName || order.requester?.fullName}</div>
            <div>City: <span className="font-semibold">{order.city || 'N/A'}</span></div>
            <div>BL Board Code: <span className="font-mono font-bold">{order.blBoard || 'N/A'}</span></div>
            <div>Contact: {order.requester?.email || order.formData?.submitterEmail}</div>
          </div>
          <div>
            <div className="font-bold uppercase text-[10px] text-slate-500">Period Dates & Audit Cycle</div>
            <div><span className="font-semibold">Work Star Date: </span>{order.workStartDate || order.formData?.workStartDate || 'N/A'}</div>
            <div><span className="font-semibold">Week Ending Date: </span>{order.weekEndingDate || order.formData?.weekEndingDate || 'N/A'}</div>
            <div className="mt-2 font-bold text-sm">
              Total Quantity: {order.totalQuantity} units
            </div>
          </div>
        </div>

        {/* Section 2: Artwork Quantity Breakdown */}
        <div className="space-y-2 border-b border-black pb-4">
          <div className="font-bold uppercase text-[10px] text-slate-500">Artwork Quantity & Types Detailed</div>
          <table className="w-full border border-black text-left text-xs">
            <thead className="bg-slate-100 border-b border-black">
              <tr>
                <th className="p-2 border-r border-black">#</th>
                <th className="p-2 border-r border-black">Artwork Type / Specification</th>
                <th className="p-2 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {order.artworkItems && order.artworkItems.length > 0 ? (
                order.artworkItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-black last:border-0">
                    <td className="p-2 border-r border-black">{idx + 1}</td>
                    <td className="p-2 border-r border-black font-semibold">{item.artworkType}</td>
                    <td className="p-2 text-right font-bold">{item.quantity} units</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-2 text-center">Quantity: {order.totalQuantity} units</td>
                </tr>
              )}
            </tbody>
          </table>

          {order.formData?.specialNotes && (
            <div className="pt-2">
              <span className="font-bold">Remarks: </span>
              <span>{order.formData.specialNotes}</span>
            </div>
          )}
        </div>

        {/* Section 3: Physical Signage Inspection Checklist */}
        <div className="space-y-2 border-b border-black pb-4">
          <div className="font-bold uppercase text-[10px] text-slate-500">Shop / Site Inspection Quality Gate</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Dimensions & BL Board frame verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Grommets / eyelets / perimeter hem secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Backlight illumination test passed</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Color density & logo fidelity approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Mounting hardware & zip ties inspected</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Site photo uploaded to centralized Drive</span>
            </div>
          </div>
        </div>

        {/* Section 4: Sign-off Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div>
            <div className="border-b border-black h-10"></div>
            <div className="font-bold text-[10px] uppercase text-slate-500 mt-1">
              Field Installation Supervisor Signature / Date
            </div>
          </div>
          <div>
            <div className="border-b border-black h-10"></div>
            <div className="font-bold text-[10px] uppercase text-slate-500 mt-1">
              Signage Audit & Quality Controller Signature / Date
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
