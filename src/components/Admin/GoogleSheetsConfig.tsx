import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  Database, 
  Link as LinkIcon,
  PlusCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { AdminSettings, PrintOrder } from '../../types/form';
import { 
  createPrintOrdersSpreadsheet, 
  batchAppendOrdersToGoogleSheet, 
  updateMonthlyReportingCycleInSheet,
  extractSpreadsheetId 
} from '../../services/googleSheets';

interface GoogleSheetsConfigProps {
  settings?: AdminSettings;
  adminSettings?: AdminSettings;
  onUpdateSettings?: (settings: AdminSettings) => void;
  onSaveSettings?: (settings: AdminSettings) => void;
  orders: PrintOrder[];
  onOrdersUpdated?: (orders: PrintOrder[]) => void;
  user?: any;
  accessToken: string | null;
  onPromptGoogleAuth: () => void;
}

export const GoogleSheetsConfig: React.FC<GoogleSheetsConfigProps> = ({
  settings,
  adminSettings,
  onUpdateSettings,
  onSaveSettings,
  orders,
  onOrdersUpdated,
  accessToken,
  onPromptGoogleAuth
}) => {
  const currentSettings = adminSettings || settings || {
    businessName: 'Weekly Signage Tracker',
    formTitle: 'Weekly Signage / Artwork Quantity Tracker',
    formDescription: '',
    supportEmail: 'admin@example.com',
    turnaroundDaysDefault: 3,
    adminPin: '1234',
    sheetStorageEnabled: true,
    themeColor: '#673ab7'
  };

  const handleSettingsSave = (newSettings: AdminSettings) => {
    if (onUpdateSettings) onUpdateSettings(newSettings);
    if (onSaveSettings) onSaveSettings(newSettings);
  };

  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [manualSheetInput, setManualSheetInput] = useState(currentSettings.spreadsheetId || '');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const unsyncedOrders = orders.filter(o => !o.syncedToGoogleSheet);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateNewMasterSheet = async () => {
    if (!accessToken) {
      onPromptGoogleAuth();
      return;
    }

    setIsCreatingSheet(true);
    setMessage(null);
    try {
      const result = await createPrintOrdersSpreadsheet(accessToken, 'Weekly Signage Centralized Tracker & Reporting');
      
      const updatedSettings: AdminSettings = {
        ...currentSettings,
        sheetStorageEnabled: true,
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        sheetName: 'Signage_Submissions_2026'
      };

      handleSettingsSave(updatedSettings);

      // Now sync all existing orders into this new sheet
      if (orders.length > 0) {
        await batchAppendOrdersToGoogleSheet(accessToken, result.spreadsheetId, orders, 'Signage_Submissions_2026');
        const updatedOrders = orders.map(o => ({ ...o, syncedToGoogleSheet: true, syncedAt: new Date().toISOString() }));
        if (onOrdersUpdated) onOrdersUpdated(updatedOrders);
      }

      showMsg(`Successfully created centralized Master Sheet with ${orders.length} initial records synchronized!`, 'success');
    } catch (err: any) {
      console.error('Error creating Google Sheet:', err);
      showMsg(err.message || 'Failed to create Google Sheet. Please check your Google account permissions.', 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleLinkManualSheet = () => {
    if (!manualSheetInput.trim()) {
      showMsg('Please enter a valid Google Sheet URL or ID.', 'error');
      return;
    }

    const cleanId = extractSpreadsheetId(manualSheetInput);
    const updatedSettings: AdminSettings = {
      ...currentSettings,
      spreadsheetId: cleanId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
      sheetStorageEnabled: true
    };

    handleSettingsSave(updatedSettings);
    showMsg(`Linked to Google Sheet ID: ${cleanId}`, 'success');
  };

  const handlePushUnsyncedOrders = async () => {
    if (!accessToken) {
      onPromptGoogleAuth();
      return;
    }

    if (!currentSettings.spreadsheetId) {
      showMsg('Please connect a Google Sheet first.', 'error');
      return;
    }

    if (unsyncedOrders.length === 0) {
      showMsg('All orders are already synced with your Google Sheet.', 'success');
      return;
    }

    setIsSyncing(true);
    try {
      await batchAppendOrdersToGoogleSheet(
        accessToken,
        currentSettings.spreadsheetId,
        unsyncedOrders,
        currentSettings.sheetName
      );

      const updated = orders.map(o => ({
        ...o,
        syncedToGoogleSheet: true,
        syncedAt: new Date().toISOString()
      }));

      if (onOrdersUpdated) onOrdersUpdated(updated);
      showMsg(`Successfully synced ${unsyncedOrders.length} orders to your Google Sheet!`, 'success');
    } catch (err: any) {
      console.error('Push failed:', err);
      showMsg(err.message || 'Failed to push orders to Google Sheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutomateMonthlyReporting = async () => {
    if (!accessToken) {
      onPromptGoogleAuth();
      return;
    }

    if (!currentSettings.spreadsheetId) {
      showMsg('Please connect a Google Sheet first.', 'error');
      return;
    }

    setIsGeneratingReport(true);
    try {
      await updateMonthlyReportingCycleInSheet(accessToken, currentSettings.spreadsheetId, orders);
      
      const updatedSettings = {
        ...currentSettings,
        lastMonthlyReportGenerated: new Date().toISOString()
      };
      handleSettingsSave(updatedSettings);
      
      showMsg('Automated monthly reporting cycle aggregated and updated in Google Sheet (Tab: Monthly_Reporting_Cycle)!', 'success');
    } catch (err: any) {
      console.error('Report generation failed:', err);
      showMsg(err.message || 'Failed to update monthly reporting cycle in Google Sheet.', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      'SubmissionID', 'Timestamp', 'Status', 'WorkStartDate', 'WeekEndingDate',
      'VendorName', 'City', 'BLBoard', 'TotalQuantity', 'ArtworkBreakdown',
      'SubmitterEmail', 'SpecialNotes'
    ];

    const rows = orders.map(o => [
      o.id,
      `"${o.createdAt}"`,
      o.status,
      `"${o.workStartDate || o.formData?.workStartDate || ''}"`,
      `"${o.weekEndingDate || o.formData?.weekEndingDate || ''}"`,
      `"${(o.vendorName || o.requester?.fullName || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.blBoard || '').replace(/"/g, '""')}"`,
      o.totalQuantity || 0,
      `"${(o.artworkItems || []).map(a => `${a.artworkType}:${a.quantity}`).join('; ')}"`,
      `"${o.requester?.email || o.formData?.submitterEmail || ''}"`,
      `"${(o.formData?.specialNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Weekly_Signage_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PrintCraft_Orders_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Centralized Google Sheets Storage & Monthly Reporting</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Store all customer submissions in a central master spreadsheet and automate recurring monthly reporting cycles.
            </p>
          </div>

          {/* Storage Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleSettingsSave({ ...currentSettings, sheetStorageEnabled: true })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentSettings.sheetStorageEnabled
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets Sync</span>
            </button>
            <button
              onClick={() => handleSettingsSave({ ...currentSettings, sheetStorageEnabled: false })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !currentSettings.sheetStorageEnabled
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database / Local Only</span>
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Google Sheets Connection Card */}
      <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Connected Sheet Status */}
        {currentSettings.spreadsheetId ? (
          <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">
                    Centralized Google Sheet Connected
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: {currentSettings.spreadsheetId}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span>Tab 1: <strong>{currentSettings.sheetName || 'Signage_Submissions_2026'}</strong></span>
                  <span>&bull;</span>
                  <span>Tab 2: <strong>Monthly_Reporting_Cycle</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {currentSettings.spreadsheetUrl && (
                <a
                  href={currentSettings.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Centralized Google Sheet Configured Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Initialize a dedicated master Google Sheet to store incoming print orders, track statuses, and generate monthly reports.
              </p>
            </div>

            <button
              onClick={handleCreateNewMasterSheet}
              disabled={isCreatingSheet}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isCreatingSheet ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating & Formatting Master Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>1-Click Create Master Google Sheet</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Manual ID Link / Replace */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Or Link an Existing Google Sheet by URL / ID:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualSheetInput}
              onChange={(e) => setManualSheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleLinkManualSheet}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link Sheet</span>
            </button>
          </div>
        </div>

        {/* Sync Controls & Recurring Monthly Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          
          {/* Card 1: Batch Push Orders */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Synchronize Order Queue</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                unsyncedOrders.length > 0 
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' 
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}>
                {unsyncedOrders.length} Pending Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Push un-synced requests or re-sync all local database records to your central Google Sheet.
            </p>
            <button
              onClick={handlePushUnsyncedOrders}
              disabled={isSyncing || unsyncedOrders.length === 0}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pushing to Google Sheet...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Push {unsyncedOrders.length} Orders to Sheet</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Automate Monthly Recurring Reporting */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Automated Monthly Reporting</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Cycle Automation
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregates orders into monthly reporting cycles: unit volumes, gross expenditure, completion rate, and department rankings.
            </p>
            <button
              onClick={handleAutomateMonthlyReporting}
              disabled={isGeneratingReport || !currentSettings.spreadsheetId}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aggregating Monthly Cycle...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Generate Monthly Report Tab</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Export Record Keeping Capabilities */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Seamless Record-Keeping & Exports
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download complete order records for internal auditing and offline accounting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={exportToJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
