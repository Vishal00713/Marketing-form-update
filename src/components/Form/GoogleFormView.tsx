import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Cloud, 
  AlertCircle, 
  Plus, 
  Trash2, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  Check, 
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { 
  FormFieldConfig, 
  PrintOrder, 
  UploadedFileMeta, 
  SignageArtworkRow,
  AdminSettings,
  SelectOption 
} from '../../types/form';
import { isFieldVisible, ARTWORK_TYPE_OPTIONS } from '../../services/storage';
import { appendOrderToGoogleSheet } from '../../services/googleSheets';
import { uploadFileToGoogleDrive } from '../../services/googleDrive';

interface GoogleFormViewProps {
  fields: FormFieldConfig[];
  adminSettings: AdminSettings;
  user?: User | null;
  accessToken: string | null;
  onPromptGoogleAuth?: () => void;
  onSubmitSuccess?: (order: PrintOrder) => void;
  onOrderSubmitted?: (order: PrintOrder) => void;
  onOpenAdmin?: () => void;
}

export const GoogleFormView: React.FC<GoogleFormViewProps> = ({
  fields,
  adminSettings,
  user = null,
  accessToken,
  onPromptGoogleAuth,
  onSubmitSuccess,
  onOrderSubmitted,
  onOpenAdmin
}) => {
  // Form values state
  const [formValues, setFormValues] = useState<Record<string, any>>({
    workStartDate: '',
    weekEndingDate: '',
    vendorName: '',
    city: '',
    blBoard: '',
    artworkQty_1: '',
    artworkType_1: '',
    submitterEmail: user?.email || 'vishal.toptown@gmail.com',
    specialNotes: ''
  });

  // Track focused card for Google Forms active left purple border
  const [activeCardId, setActiveCardId] = useState<string>('workStartDate');
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Uploaded files
  const [files, setFiles] = useState<UploadedFileMeta[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Artwork rows (allows adding beyond the default 5)
  const [dynamicArtworkRows, setDynamicArtworkRows] = useState<{ id: string; qtyKey: string; typeKey: string; index: number }[]>([
    { id: 'row-1', qtyKey: 'artworkQty_1', typeKey: 'artworkType_1', index: 1 },
    { id: 'row-2', qtyKey: 'artworkQty_2', typeKey: 'artworkType_2', index: 2 },
    { id: 'row-3', qtyKey: 'artworkQty_3', typeKey: 'artworkType_3', index: 3 }
  ]);

  const themeColor = adminSettings.themeColor || '#673ab7';
  const bgColor = adminSettings.bgColor || '#f0ebf8';
  const accentHeight = adminSettings.headerAccentHeight || 10;
  const fontClass = 
    adminSettings.fontFamily === 'serif' ? 'font-serif' :
    adminSettings.fontFamily === 'roboto' ? 'font-mono' :
    adminSettings.fontFamily === 'playful' ? 'font-sans tracking-wide' :
    'font-sans';

  // Keyboard shortcut for administrator to access cPanel: Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        onOpenAdmin?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAdmin]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleAddArtworkRow = () => {
    const nextIdx = dynamicArtworkRows.length + 1;
    setDynamicArtworkRows(prev => [
      ...prev,
      { id: `row-${Date.now()}`, qtyKey: `artworkQty_${nextIdx}`, typeKey: `artworkType_${nextIdx}`, index: nextIdx }
    ]);
  };

  const handleRemoveArtworkRow = (id: string, qtyKey: string, typeKey: string) => {
    setDynamicArtworkRows(prev => prev.filter(r => r.id !== id));
    setFormValues(prev => {
      const next = { ...prev };
      delete next[qtyKey];
      delete next[typeKey];
      return next;
    });
  };

  // Handle file uploads
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploadingFiles(true);

    const added: UploadedFileMeta[] = [];
    for (const file of Array.from(fileList)) {
      let driveLink: string | undefined;
      let driveId: string | undefined;

      if (accessToken) {
        try {
          const driveRes = await uploadFileToGoogleDrive(accessToken, file);
          driveLink = driveRes.webViewLink;
          driveId = driveRes.fileId;
        } catch (err) {
          console.warn('Google Drive direct upload skipped:', err);
        }
      }

      let dataUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        dataUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(file);
        });
      }

      added.push({
        id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        driveFileId: driveId,
        driveViewLink: driveLink,
        uploadedAt: new Date().toISOString()
      });
    }

    setFiles(prev => [...prev, ...added]);
    setIsUploadingFiles(false);
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear all answers in this form?')) {
      setFormValues({
        workStartDate: '',
        weekEndingDate: '',
        vendorName: '',
        city: '',
        blBoard: '',
        artworkQty_1: '',
        artworkType_1: '',
        submitterEmail: user?.email || '',
        specialNotes: ''
      });
      setFiles([]);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check visible fields against their required condition
    fields.forEach(f => {
      if (isFieldVisible(f, formValues)) {
        if (f.required) {
          const val = formValues[f.id];
          if (val === undefined || val === null || String(val).trim() === '') {
            newErrors[f.id] = 'This is a required question';
          }
        }
      }
    });

    // Special validation for email format
    if (formValues.submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.submitterEmail)) {
      newErrors['submitterEmail'] = 'Please enter a valid email address';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first invalid field card
      const firstInvalidKey = Object.keys(newErrors)[0];
      const elem = document.getElementById(`card-${firstInvalidKey}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActiveCardId(firstInvalidKey);
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Build artwork items summary
    const artworkItems: SignageArtworkRow[] = [];
    let totalQuantity = 0;

    // First pair
    if (formValues.artworkQty_1) {
      const q = Number(formValues.artworkQty_1) || 0;
      totalQuantity += q;
      artworkItems.push({
        id: 'art-1',
        quantity: q,
        artworkType: formValues.artworkType_1 || 'General Signage'
      });
    }

    // Additional pairs
    dynamicArtworkRows.slice(1).forEach((row, i) => {
      const qty = formValues[row.qtyKey];
      const type = formValues[row.typeKey];
      if (qty) {
        const q = Number(qty) || 0;
        totalQuantity += q;
        artworkItems.push({
          id: `art-${i + 2}`,
          quantity: q,
          artworkType: type || 'Signage Item'
        });
      }
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `WST-2026-${randomSuffix}`;

    const newSubmission: PrintOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      workStartDate: formValues.workStartDate,
      weekEndingDate: formValues.weekEndingDate,
      vendorName: formValues.vendorName,
      city: formValues.city,
      blBoard: formValues.blBoard,
      artworkItems,
      totalQuantity: Math.max(totalQuantity, 1),
      requester: {
        fullName: formValues.vendorName || 'Signage Vendor',
        email: formValues.submitterEmail || user?.email || 'vishal.toptown@gmail.com',
        department: formValues.city || 'Regional Operations'
      },
      jobTitle: `${formValues.vendorName || 'Signage'} - ${formValues.blBoard || 'Hoarding'} (${formValues.city || 'General'})`,
      files,
      pricing: {
        quantity: totalQuantity || 1,
        unitCost: 15.0,
        baseCost: (totalQuantity || 1) * 15.0,
        total: (totalQuantity || 1) * 15.0
      },
      formData: { ...formValues },
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Weekly signage tracker response submitted.',
          updatedBy: 'Google Form'
        }
      ],
      syncedToGoogleSheet: false
    };

    // Auto-sync to Google Sheet if connected
    if (adminSettings.sheetStorageEnabled && adminSettings.spreadsheetId && accessToken) {
      try {
        await appendOrderToGoogleSheet(
          accessToken,
          adminSettings.spreadsheetId,
          newSubmission,
          adminSettings.sheetName
        );
        newSubmission.syncedToGoogleSheet = true;
        newSubmission.syncedAt = new Date().toISOString();
      } catch (sheetErr) {
        console.warn('Auto-sync to Google Sheet warning:', sheetErr);
      }
    }

    setIsSubmitting(false);
    if (onSubmitSuccess) onSubmitSuccess(newSubmission);
    if (onOrderSubmitted) onOrderSubmitted(newSubmission);
  };

  // Helper to render individual card
  const renderFieldCard = (
    fieldId: string,
    title: string,
    type: 'text' | 'date' | 'number' | 'select' | 'email' | 'textarea',
    required: boolean,
    placeholder: string = 'Your answer',
    description?: string,
    options?: SelectOption[]
  ) => {
    const isActive = activeCardId === fieldId;
    const hasError = !!errors[fieldId];
    const val = formValues[fieldId] || '';

    return (
      <div
        id={`card-${fieldId}`}
        tabIndex={0}
        onFocus={() => setActiveCardId(fieldId)}
        onClick={() => setActiveCardId(fieldId)}
        className={`rounded-lg bg-white dark:bg-[#202124] border transition-all duration-200 p-6 shadow-sm ${
          hasError
            ? 'border-l-[5px] border-l-[#d93025] border-slate-300 dark:border-slate-700'
            : isActive
              ? 'border-l-[5px] border-slate-300 dark:border-slate-700 shadow-md'
              : 'border-[#dadce0] dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
        }`}
        style={isActive && !hasError ? {
          borderLeftColor: themeColor,
          boxShadow: `0 0 0 1px ${themeColor}28`
        } : undefined}
      >
        {/* Title */}
        <label className="block text-base font-normal text-[#202124] dark:text-slate-100 mb-1">
          <span>{title}</span>
          {required && <span className="text-[#d93025] ml-1 font-bold">*</span>}
        </label>

        {description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{description}</p>
        )}

        {/* Input */}
        <div className="mt-4">
          {type === 'select' ? (
            <div className="relative inline-block w-full sm:w-72">
              <select
                value={val}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                className={`w-full px-4 py-3 rounded border text-sm appearance-none bg-white dark:bg-slate-800 text-[#202124] dark:text-white cursor-pointer pr-10 outline-none transition-colors ${
                  hasError 
                    ? 'border-[#d93025] focus:border-[#d93025]' 
                    : 'border-[#dadce0] dark:border-slate-700'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%235f6368' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25rem 1.25rem',
                  ...(isActive && !hasError ? { borderColor: themeColor } : {})
                }}
              >
                <option value="">{placeholder || 'Choose'}</option>
                {(options || ARTWORK_TYPE_OPTIONS).map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : type === 'date' ? (
            <div className="relative w-full sm:w-64">
              <input
                type="date"
                value={val}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                placeholder="dd-mm-yyyy"
                className={`w-full py-2 px-1 border-b text-sm bg-transparent outline-none transition-colors ${
                  hasError
                    ? 'border-b-2 border-[#d93025] text-[#d93025]'
                    : 'border-[#dadce0] dark:border-slate-700 text-[#202124] dark:text-white'
                }`}
                style={isActive && !hasError ? { borderBottomColor: themeColor, borderBottomWidth: '2px' } : undefined}
              />
              <span className="text-[11px] text-gray-400 block mt-1">Date</span>
            </div>
          ) : type === 'textarea' ? (
            <textarea
              value={val}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              placeholder={placeholder}
              rows={3}
              className={`w-full py-2 border-b text-sm bg-transparent outline-none transition-colors placeholder:text-gray-400 ${
                hasError
                  ? 'border-b-2 border-[#d93025]'
                  : 'border-[#dadce0] dark:border-slate-700 text-[#202124] dark:text-white'
              }`}
              style={isActive && !hasError ? { borderBottomColor: themeColor, borderBottomWidth: '2px' } : undefined}
            />
          ) : (
            <input
              type={type === 'number' ? 'number' : type}
              value={val}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              placeholder={placeholder}
              className={`w-full sm:w-2/3 py-2 border-b text-sm bg-transparent outline-none transition-colors placeholder:text-gray-400 ${
                hasError
                  ? 'border-b-2 border-[#d93025]'
                  : 'border-[#dadce0] dark:border-slate-700 text-[#202124] dark:text-white'
              }`}
              style={isActive && !hasError ? { borderBottomColor: themeColor, borderBottomWidth: '2px' } : undefined}
            />
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <div className="mt-3 flex items-center gap-1.5 text-[#d93025] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors[fieldId]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen py-6 sm:py-10 px-3 sm:px-4 transition-colors ${fontClass}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-[770px] mx-auto space-y-4">
        
        {/* Form Title Card (with Custom Theme Accent Strip) */}
        <div className="rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-800 shadow-sm relative overflow-hidden">
          {/* Authentic Google Forms Top Accent Line */}
          <div 
            className="w-full transition-all" 
            style={{ 
              backgroundColor: themeColor, 
              height: `${accentHeight}px` 
            }} 
          />
          
          <div className="p-6 sm:p-7">
            <h1 className="text-2xl sm:text-[32px] font-normal text-[#202124] dark:text-slate-100 tracking-tight leading-snug">
              {adminSettings.formTitle || 'Weekly Signage / Artwork Quantity Tracker'}
            </h1>
            
            <p className="text-sm text-[#202124] dark:text-slate-300 mt-2 font-normal">
              {adminSettings.formDescription || 'Submit weekly signage counts, installation dimensions, and vendor proofs for central reporting and monthly audit cycles.'}
            </p>

            <div className="border-b border-[#dadce0] dark:border-slate-800 my-4" />

            {/* Submitter User Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user?.email || 'vishal.toptown@gmail.com'}
                </span>
                <button
                  type="button"
                  onClick={onPromptGoogleAuth}
                  className="hover:underline font-medium"
                  style={{ color: themeColor }}
                >
                  Switch account
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>Not shared</span>
              </div>
            </div>

            <div className="mt-4 text-xs font-medium text-[#d93025]">
              * Indicates required question
            </div>
          </div>
        </div>

        {/* The Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Card 1: Work Star Date */}
          {renderFieldCard(
            'workStartDate',
            'Work Star Date',
            'date',
            true,
            'dd-mm-yyyy',
            'Date installation began on site'
          )}

          {/* Card 2: Week Ending Date */}
          {renderFieldCard(
            'weekEndingDate',
            'Week Ending Date',
            'date',
            true,
            'dd-mm-yyyy',
            'Weekly cut-off period date'
          )}

          {/* Card 3: Vendor Name */}
          {renderFieldCard(
            'vendorName',
            'Vendor Name',
            'text',
            true,
            'Your answer',
            'Contractor or printing agency identifier'
          )}

          {/* Card 4: City */}
          {renderFieldCard(
            'city',
            'City',
            'text',
            true,
            'Your answer',
            'Municipality / territory of installation'
          )}

          {/* Card 5: BL Board */}
          {renderFieldCard(
            'blBoard',
            'BL Board',
            'text',
            true,
            'Your answer',
            'Backlit board code / hoarding location number'
          )}

          {/* Paired Artwork Quantity and Artwork Type Cards */}
          {dynamicArtworkRows.map((row) => (
            <React.Fragment key={row.id}>
              {/* Artwork Quantity */}
              {renderFieldCard(
                row.qtyKey,
                `Artwork Quantity${row.index > 1 ? ` (Item ${row.index})` : ''}`,
                'number',
                row.index === 1,
                'Your answer'
              )}

              {/* Artwork Type */}
              {renderFieldCard(
                row.typeKey,
                `Artwork Type${row.index > 1 ? ` (Item ${row.index})` : ''}`,
                'select',
                row.index === 1,
                'Choose',
                undefined,
                ARTWORK_TYPE_OPTIONS
              )}
            </React.Fragment>
          ))}

          {/* Add Another Artwork Row Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddArtworkRow}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: themeColor, borderColor: `${themeColor}40` }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Artwork Quantity & Type</span>
            </button>
          </div>

          {/* Card: File Upload & Artwork Proof */}
          <div
            id="card-artworkFiles"
            tabIndex={0}
            onFocus={() => setActiveCardId('artworkFiles')}
            onClick={() => setActiveCardId('artworkFiles')}
            className={`rounded-lg bg-white dark:bg-[#202124] border transition-all duration-200 p-6 shadow-sm ${
              activeCardId === 'artworkFiles'
                ? 'border-l-[5px] border-slate-300 dark:border-slate-700 shadow-md'
                : 'border-[#dadce0] dark:border-slate-800'
            }`}
            style={activeCardId === 'artworkFiles' ? {
              borderLeftColor: themeColor,
              boxShadow: `0 0 0 1px ${themeColor}28`
            } : undefined}
          >
            <label className="block text-base font-normal text-[#202124] dark:text-slate-100 mb-1">
              <span>Artwork / Proof File Upload</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Upload site photos, installation proofs, or print-ready PDF artwork files
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFiles}
                className="px-4 py-2 rounded border border-[#dadce0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                style={{ color: themeColor }}
              >
                {isUploadingFiles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>Add file</span>
              </button>

              {accessToken && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <HardDrive className="w-3 h-3" />
                  <span>Direct Google Drive Cloud Storage</span>
                </span>
              )}
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded border border-[#dadce0] dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800">
                    <span className="truncate max-w-[250px] font-medium text-[#202124] dark:text-white">
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter(x => x.id !== f.id))}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Submitter Email for Receipt */}
          {renderFieldCard(
            'submitterEmail',
            'Submitter Email Address',
            'email',
            true,
            'Your answer',
            'A confirmation copy of your responses will be emailed to this address'
          )}

          {/* Card: Special Instructions */}
          {renderFieldCard(
            'specialNotes',
            'Special Instructions / Remarks',
            'textarea',
            false,
            'Your answer',
            'Any mounting hardware or site notes'
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-white px-7 py-2.5 rounded font-medium text-sm shadow transition-all flex items-center gap-2 disabled:opacity-50 hover:brightness-95 active:brightness-90"
              style={{ backgroundColor: themeColor }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className="text-xs font-semibold px-3 py-2 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: themeColor }}
            >
              Clear form
            </button>
          </div>

        </form>

        {/* Authentic Google Forms Footer */}
        <div className="pt-8 pb-12 text-center text-[11px] text-gray-500 dark:text-slate-500 space-y-2">
          <p>Never submit passwords through Google Forms.</p>
          <p className="space-x-1">
            <span>This content is neither created nor endorsed by Google.</span>
            <span>&bull;</span>
            <a href="#" className="underline">Report Abuse</a>
            <span>&bull;</span>
            <a href="#" className="underline">Terms of Service</a>
            <span>&bull;</span>
            <a href="#" className="underline">Privacy Policy</a>
          </p>
          <div className="pt-2 flex items-center justify-center gap-1 text-slate-700 dark:text-slate-400 font-medium text-base">
            <span className="font-semibold tracking-tight text-gray-600 dark:text-gray-300">Google</span>
            <span className="font-normal text-gray-500">Forms</span>
          </div>

          {/* Discreet Admin Entry for authorized operations manager */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-[10px] text-gray-400/40 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
              title="Admin Portal (Shortcut: Alt+A or /admin)"
            >
              Admin Portal
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
