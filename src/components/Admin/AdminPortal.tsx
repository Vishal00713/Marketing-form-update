import React, { useState } from 'react';
import { 
  Printer, 
  Search, 
  Filter, 
  Layers, 
  Sliders, 
  FileSpreadsheet, 
  Settings, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  LogOut,
  ExternalLink,
  Plus,
  Download,
  Check,
  Palette
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { PrintOrder, OrderStatus, FormFieldConfig, AdminSettings } from '../../types/form';
import { AdminLogin } from './AdminLogin';
import { OrderDetailsModal } from './OrderDetailsModal';
import { FormBuilderCpanel } from './FormBuilderCpanel';
import { GoogleSheetsConfig } from './GoogleSheetsConfig';
import { JobTicketPrint } from './JobTicketPrint';
import { ThemeColorSelector } from './ThemeColorSelector';

interface AdminPortalProps {
  orders: PrintOrder[];
  onOrdersUpdated: (orders: PrintOrder[]) => void;
  formFields: FormFieldConfig[];
  onFormFieldsUpdated: (fields: FormFieldConfig[]) => void;
  adminSettings: AdminSettings;
  onSettingsUpdated: (settings: AdminSettings) => void;
  user: User | null;
  accessToken: string | null;
  onGoogleAuth: (user: User, token: string) => void;
  onPromptGoogleAuth: () => void;
  onViewForm?: () => void;
}

type AdminTab = 'orders' | 'form_builder' | 'theme' | 'sheets' | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  orders,
  onOrdersUpdated,
  formFields,
  onFormFieldsUpdated,
  adminSettings,
  onSettingsUpdated,
  user,
  accessToken,
  onGoogleAuth,
  onPromptGoogleAuth,
  onViewForm
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!user;
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<PrintOrder | null>(null);

  // Settings form local state
  const [settingsForm, setSettingsForm] = useState<AdminSettings>(adminSettings);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // If not authenticated, render login gate
  if (!isAuthenticated && !user) {
    return (
      <AdminLogin
        user={user}
        onSuccess={() => setIsAuthenticated(true)}
        onGoogleAuth={(u, t) => {
          onGoogleAuth(u, t);
          setIsAuthenticated(true);
        }}
        expectedPin={adminSettings.adminPin}
      />
    );
  }

  // Quick status update
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, note: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          statusHistory: [
            ...o.statusHistory,
            {
              id: `sh-${Date.now()}`,
              status: newStatus,
              timestamp: new Date().toISOString(),
              note,
              updatedBy: user?.displayName || user?.email || 'Admin'
            }
          ]
        };
      }
      return o;
    });

    onOrdersUpdated(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(updated.find(o => o.id === orderId) || null);
    }
  };

  // KPIs
  const totalSubmissions = orders.length;
  const totalArtworkUnits = orders.reduce((sum, o) => sum + (o.totalQuantity || o.pricing?.quantity || 1), 0);
  const pendingAudits = orders.filter(o => ['pending', 'proof_review'].includes(o.status)).length;
  const completedJobs = orders.filter(o => o.status === 'completed').length;

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    const vName = o.vendorName || o.requester?.fullName || '';
    const bBoard = o.blBoard || '';
    const city = o.city || '';
    const email = o.requester?.email || o.formData?.submitterEmail || '';

    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bBoard.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || vName === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  const allVendors = Array.from(new Set(orders.map(o => o.vendorName || o.requester?.fullName).filter(Boolean)));

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSettingsUpdated(settingsForm);
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Submission ID',
      'Created At',
      'Work Star Date',
      'Week Ending Date',
      'Vendor Name',
      'City',
      'BL Board',
      'Total Quantity',
      'Status',
      'Submitter Email',
      'Special Notes'
    ];

    const rows = filteredOrders.map(o => [
      o.id,
      o.createdAt,
      o.workStartDate || o.formData?.workStartDate || '',
      o.weekEndingDate || o.formData?.weekEndingDate || '',
      `"${(o.vendorName || o.requester?.fullName || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.blBoard || '').replace(/"/g, '""')}"`,
      o.totalQuantity || 0,
      o.status,
      o.requester?.email || o.formData?.submitterEmail || '',
      `"${(o.formData?.specialNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `weekly_signage_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Admin Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#673ab7] text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Signage Operations & cPanel</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Form Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage weekly signage tracker responses, customize questions & conditional logic, and sync with central Google Sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onViewForm && (
            <button
              onClick={onViewForm}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Return to Public Google Form"
            >
              <Eye className="w-3.5 h-3.5" style={{ color: adminSettings.themeColor || '#673ab7' }} />
              <span>Preview Public Form</span>
            </button>
          )}

          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setCurrentTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            currentTab === 'orders'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={currentTab === 'orders' ? { backgroundColor: adminSettings.themeColor || '#673ab7' } : undefined}
        >
          <Layers className="w-4 h-4" />
          <span>Submissions Dashboard ({orders.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('form_builder')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            currentTab === 'form_builder'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={currentTab === 'form_builder' ? { backgroundColor: adminSettings.themeColor || '#673ab7' } : undefined}
        >
          <Sliders className="w-4 h-4" />
          <span>Form Questions & Conditional cPanel</span>
        </button>

        <button
          onClick={() => setCurrentTab('theme')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            currentTab === 'theme'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={currentTab === 'theme' ? { backgroundColor: adminSettings.themeColor || '#673ab7' } : undefined}
        >
          <Palette className="w-4 h-4" />
          <span>Theme & Color Customizer</span>
        </button>

        <button
          onClick={() => setCurrentTab('sheets')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            currentTab === 'sheets'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={currentTab === 'sheets' ? { backgroundColor: adminSettings.themeColor || '#673ab7' } : undefined}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets & Monthly Reporting</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            currentTab === 'settings'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={currentTab === 'settings' ? { backgroundColor: adminSettings.themeColor || '#673ab7' } : undefined}
        >
          <Settings className="w-4 h-4" />
          <span>Form Settings</span>
        </button>
      </div>

      {/* TAB 1: Submissions Management */}
      {currentTab === 'orders' && (
        <div className="space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Total Submissions</span>
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#673ab7] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalSubmissions}</div>
              <span className="text-[11px] text-slate-500">Weekly tracker entries</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Total Artwork Units</span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalArtworkUnits.toLocaleString()}</div>
              <span className="text-[11px] text-slate-500">Signage pieces tracked</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Pending Review</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{pendingAudits}</div>
              <span className="text-[11px] text-slate-500">Awaiting site verification</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Completed & Verified</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{completedJobs}</div>
              <span className="text-[11px] text-slate-500">Audited installations</span>
            </div>
          </div>

          {/* Search, Filter & Export Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, Vendor, BL Board, City, or Submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Audit</option>
                <option value="proof_review">In Proofing</option>
                <option value="printing">On Press (Printing)</option>
                <option value="finishing">Finishing & Mounting</option>
                <option value="ready">Ready / Staged</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {allVendors.length > 0 && (
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Vendors</option>
                  {allVendors.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              )}

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ID & Date</th>
                    <th className="px-4 py-3">Vendor & BL Board</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Work Star & End Dates</th>
                    <th className="px-4 py-3">Artwork Units</th>
                    <th className="px-4 py-3">Audit Stage</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                      let statusBadgeClass = 'bg-slate-100 text-slate-700';
                      if (order.status === 'pending') statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                      else if (order.status === 'proof_review') statusBadgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
                      else if (order.status === 'printing') statusBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                      else if (order.status === 'finishing') statusBadgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
                      else if (order.status === 'ready') statusBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                      else if (order.status === 'completed') statusBadgeClass = 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              {order.id}
                            </button>
                            <span className="block text-[10px] text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[200px]">
                              {order.vendorName || order.requester?.fullName}
                            </span>
                            <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                              BL: {order.blBoard || 'N/A'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {order.city || 'Standard'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                              {order.requester?.email || order.formData?.submitterEmail}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {order.workStartDate || order.formData?.workStartDate || 'N/A'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              to {order.weekEndingDate || order.formData?.weekEndingDate || 'N/A'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-purple-700 dark:text-purple-300 block">
                              {order.totalQuantity} units
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[160px] block">
                              {order.artworkItems?.[0]?.artworkType || 'Signage'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus, `Status updated to ${e.target.value}`)}
                              className={`text-xs font-bold rounded-md px-2 py-1 border-0 focus:ring-1 focus:ring-purple-500 cursor-pointer ${statusBadgeClass}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="proof_review">Proofing</option>
                              <option value="printing">On Press</option>
                              <option value="finishing">Finishing</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setPrintingOrder(order)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Print Inspection Ticket"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No submissions found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Form Questions & Conditional Logic cPanel */}
      {currentTab === 'form_builder' && (
        <FormBuilderCpanel
          fields={formFields}
          onSaveFields={onFormFieldsUpdated}
        />
      )}

      {/* TAB 3: Theme & Color Customizer */}
      {currentTab === 'theme' && (
        <ThemeColorSelector
          settings={adminSettings}
          onUpdateSettings={onSettingsUpdated}
        />
      )}

      {/* TAB 4: Google Sheets & Monthly Reporting */}
      {currentTab === 'sheets' && (
        <GoogleSheetsConfig
          adminSettings={adminSettings}
          onSaveSettings={onSettingsUpdated}
          orders={orders}
          user={user}
          accessToken={accessToken}
          onPromptGoogleAuth={onPromptGoogleAuth}
        />
      )}

      {/* TAB 5: Form General Settings */}
      {currentTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-3xl space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Form Brand & General Configuration</h2>
            <p className="text-xs text-slate-500">Edit form header texts, administrative PIN, and operational defaults</p>
          </div>

          {/* Quick Color Theme Preview Callout */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: adminSettings.themeColor || '#673ab7' }}
              >
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Active Color Theme</span>
                <span className="text-xs text-slate-500 font-mono">
                  {adminSettings.themeColor || '#673ab7'} &bull; Background: {adminSettings.bgColor || '#f0ebf8'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('theme')}
              className="px-3.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5"
              style={{ backgroundColor: adminSettings.themeColor || '#673ab7' }}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Customize Colors</span>
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Form Title (Appears at Top of Google Form)
              </label>
              <input
                type="text"
                value={settingsForm.formTitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, formTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Form Header Subtitle / Instructions
              </label>
              <textarea
                rows={2}
                value={settingsForm.formDescription}
                onChange={(e) => setSettingsForm({ ...settingsForm, formDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Support / Admin Contact Email
                </label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Fallback Access PIN
                </label>
                <input
                  type="text"
                  value={settingsForm.adminPin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400">Used for quick login to /admin without Google login</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-emerald-600 font-semibold">
                {settingsSavedMsg && '✓ Settings saved successfully!'}
              </span>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#673ab7] hover:bg-[#5a2e9d] text-white text-xs font-bold shadow-sm transition-all"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          onPrintTicket={(ord) => {
            setSelectedOrder(null);
            setPrintingOrder(ord);
          }}
        />
      )}

      {/* Printable Job Ticket Modal */}
      {printingOrder && (
        <JobTicketPrint
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

    </div>
  );
};
