import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  AlertTriangle, 
  FileCheck, 
  Calendar, 
  Clock, 
  Layers, 
  DollarSign,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  FormFieldConfig, 
  PrintOrder, 
  UploadedFileMeta, 
  OrderPricing, 
  AdminSettings 
} from '../../types/form';
import { ProgressTracker } from './ProgressTracker';
import { DynamicField } from './DynamicField';
import { QuantitySelector, getVolumeDiscountTier } from './QuantitySelector';
import { FileUploadZone } from './FileUploadZone';
import { isFieldVisible } from '../../services/storage';
import { appendOrderToGoogleSheet } from '../../services/googleSheets';

interface PrintRequestFormProps {
  fields: FormFieldConfig[];
  onOrderSubmitted: (order: PrintOrder) => void;
  accessToken: string | null;
  adminSettings: AdminSettings;
}

export const PrintRequestForm: React.FC<PrintRequestFormProps> = ({
  fields,
  onOrderSubmitted,
  accessToken,
  adminSettings
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    fullName: '',
    email: '',
    phone: '',
    department: 'Marketing & Events',
    costCenter: '',
    jobTitle: '',
    itemType: 'Flyers & Handouts',
    quantity: 100,
    paperSize: 'Letter 8.5x11',
    paperStock: '28lb Premium Smooth',
    colorMode: 'Full Color',
    sides: 'Double-Sided',
    finishing: [],
    deliveryMethod: 'pickup',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (adminSettings.turnaroundDaysDefault || 2)).toISOString().split('T')[0],
    rushOrder: false,
    specialInstructions: ''
  });

  const [files, setFiles] = useState<UploadedFileMeta[]>([]);

  // Update specific field value
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error on change
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Pricing calculation
  const pricing: OrderPricing = useMemo(() => {
    const qty = Number(formData.quantity) || 100;
    
    // Base unit price by item type
    let unitBase = 0.20;
    if (formData.itemType?.includes('Poster')) unitBase = 1.80;
    else if (formData.itemType?.includes('Booklet')) unitBase = 2.40;
    else if (formData.itemType?.includes('Business Card')) unitBase = 0.15;
    else if (formData.itemType?.includes('Brochure')) unitBase = 0.35;
    else if (formData.itemType?.includes('Sticker')) unitBase = 0.28;
    else if (formData.itemType?.includes('Course Pack')) unitBase = 3.10;

    // Paper stock multiplier
    let stockAddon = 0;
    if (formData.paperStock?.includes('100lb Gloss')) stockAddon = 0.15;
    else if (formData.paperStock?.includes('Matte Cover')) stockAddon = 0.18;
    else if (formData.paperStock?.includes('Vinyl')) stockAddon = 0.65;
    else if (formData.paperStock?.includes('28lb')) stockAddon = 0.05;

    // Color mode discount/multiplier
    let colorMultiplier = 1.0;
    if (formData.colorMode === 'Black & White') colorMultiplier = 0.45;
    if (formData.sides === 'Double-Sided') colorMultiplier *= 1.4;

    const netUnitCost = (unitBase + stockAddon) * colorMultiplier;
    const baseCost = netUnitCost * qty;

    // Finishing add-ons
    let finishingCost = 0;
    const finishingList = Array.isArray(formData.finishing) ? formData.finishing : [];
    if (finishingList.includes('Folding')) finishingCost += qty * 0.04;
    if (finishingList.includes('Staple')) finishingCost += qty * 0.03;
    if (finishingList.includes('Lamination')) finishingCost += qty * 0.45;
    if (finishingList.includes('Corner Rounding')) finishingCost += 10.0;
    if (formData.bindingType) finishingCost += qty * 0.85;

    // Volume tier discount
    const discountTier = getVolumeDiscountTier(qty);
    const discount = (baseCost * discountTier.percent) / 100;

    // Rush surcharge (25% if checked)
    const isRush = formData.rushOrder === true || formData.rushOrder === 'true' || (Array.isArray(formData.rushOrder) && formData.rushOrder.length > 0);
    const subtotalAfterDiscount = baseCost - discount + finishingCost;
    const rushFee = isRush ? subtotalAfterDiscount * 0.25 : 0;

    const total = Math.max(5.00, subtotalAfterDiscount + rushFee);

    return {
      quantity: qty,
      unitCost: netUnitCost,
      baseCost,
      paperStockCost: stockAddon * qty,
      finishingCost,
      rushFee,
      discount,
      total
    };
  }, [formData]);

  // Validation function for current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const stepFields = fields.filter(f => f.stepNumber === step && isFieldVisible(f, formData));

    stepFields.forEach(field => {
      const val = formData[field.id];

      if (field.required) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = `${field.label} is required.`;
          return;
        }
      }

      if (field.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          newErrors[field.id] = 'Please enter a valid email address.';
        }
      }

      if (field.type === 'number' && val !== undefined && val !== '') {
        const num = Number(val);
        if (field.min !== undefined && num < field.min) {
          newErrors[field.id] = `Minimum value is ${field.min}.`;
        }
        if (field.max !== undefined && num > field.max) {
          newErrors[field.id] = `Maximum value is ${field.max}.`;
        }
      }
    });

    if (step === 2 && (!formData.quantity || formData.quantity <= 0)) {
      newErrors['quantity'] = 'Please enter a valid quantity.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Validate all steps
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `PRT-${new Date().getFullYear()}-${randomSuffix}`;

    const newOrder: PrintOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      workStartDate: formData.workStartDate || new Date().toISOString().split('T')[0],
      weekEndingDate: formData.weekEndingDate || new Date().toISOString().split('T')[0],
      vendorName: formData.vendorName || formData.fullName || 'Signage Vendor',
      city: formData.city || 'Standard',
      blBoard: formData.blBoard || 'N/A',
      artworkItems: [],
      totalQuantity: Number(formData.quantity) || 100,
      requester: {
        fullName: formData.fullName || 'Valued Requester',
        email: formData.email,
        phone: formData.phone || '',
        department: formData.department || 'General',
        costCenter: formData.costCenter || 'N/A'
      },
      jobTitle: formData.jobTitle || 'Print Service Job',
      specs: {
        itemType: formData.itemType || 'Standard Print',
        quantity: Number(formData.quantity) || 100,
        customQuantitySelected: true,
        paperSize: formData.paperSize || 'Letter 8.5x11',
        paperStock: formData.paperStock || 'Standard Copy',
        colorMode: formData.colorMode || 'Full Color',
        sides: formData.sides || 'Double-Sided',
        finishing: Array.isArray(formData.finishing) ? formData.finishing : [],
        folding: formData.foldingType,
        bindingType: formData.bindingType
      },
      delivery: {
        method: formData.deliveryMethod || 'pickup',
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        shippingAddress: formData.shippingAddress,
        specialInstructions: formData.specialInstructions,
        rushOrder: !!formData.rushOrder
      },
      files,
      pricing,
      formData,
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Request received via online portal. Scheduled for pre-flight proofing.',
          updatedBy: 'System'
        }
      ],
      syncedToGoogleSheet: false
    };

    // If Google Sheet sync is enabled and an access token is available, sync immediately
    if (adminSettings.sheetStorageEnabled && adminSettings.spreadsheetId && accessToken) {
      try {
        await appendOrderToGoogleSheet(
          accessToken,
          adminSettings.spreadsheetId,
          newOrder,
          adminSettings.sheetName
        );
        newOrder.syncedToGoogleSheet = true;
        newOrder.syncedAt = new Date().toISOString();
      } catch (sheetErr: any) {
        console.warn('Direct Google Sheet auto-sync warning:', sheetErr);
        // We still save locally so data is never lost
      }
    }

    setIsSubmitting(false);
    onOrderSubmitted(newOrder);
  };

  // Filter fields for the current step
  const visibleStepFields = fields.filter(
    f => f.stepNumber === currentStep && isFieldVisible(f, formData)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Intro Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> High-Resolution Printing & Bindery Services
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Submit a Print Request
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Custom quantities, instant volume discount pricing, file pre-flight, and automated tracking to your inbox.
        </p>
      </div>

      {/* Visual Step Progress Tracker */}
      <ProgressTracker
        currentStep={currentStep}
        totalSteps={4}
        completedSteps={completedSteps}
        onStepClick={(step) => {
          if (step < currentStep || completedSteps.includes(step)) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Main Form Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 transition-all">
        
        {/* STEP 1: Requester & Billing Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Step 1: Requester & Billing Information</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Provide your contact details so we can send digital proofs and invoice the correct cost center.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {visibleStepFields.map(field => (
                <div 
                  key={field.id}
                  className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                >
                  <DynamicField
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    error={errors[field.id]}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Print Specifications & Quantity */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Step 2: Print Specifications & Quantity</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Choose paper sizing, media stock, and volume with tiered discounts.
              </p>
            </div>

            {/* Quantity Selector with Tier Discounts */}
            <QuantitySelector
              value={formData.quantity}
              onChange={(qty) => handleFieldChange('quantity', qty)}
              baseUnitCost={pricing.unitCost}
            />

            {/* Dynamic fields for Step 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {visibleStepFields.map(field => (
                <div 
                  key={field.id}
                  className={field.type === 'textarea' || field.type === 'radio' ? 'sm:col-span-2' : ''}
                >
                  <DynamicField
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    error={errors[field.id]}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Finishing, File Upload & Delivery */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Step 3: Finishing, Artwork & Delivery</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Attach your press-ready files and specify finishing requirements and fulfillment date.
              </p>
            </div>

            {/* File Upload Component */}
            <FileUploadZone
              files={files}
              onFilesChange={setFiles}
              accessToken={accessToken}
            />

            {/* Dynamic fields for Step 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
              {visibleStepFields.map(field => (
                <div 
                  key={field.id}
                  className={field.type === 'textarea' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}
                >
                  <DynamicField
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    error={errors[field.id]}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Live Quote Summary */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Step 4: Review Order & Live Quote</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Review your request details and estimated costs before submitting to production.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Order Breakdown (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                    Project & Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Job Title:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.jobTitle || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Requester Name:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Contact Email:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Department:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Billing / Cost Center:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.costCenter || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Phone:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                    Print Specifications & Files
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Item Type:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.itemType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Total Quantity:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{Number(formData.quantity).toLocaleString()} copies</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Size & Stock:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.paperSize} &bull; {formData.paperStock}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Color & Sides:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.colorMode} &bull; {formData.sides}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Fulfillment Method:</span>
                      <span className="font-semibold text-slate-900 dark:text-white capitalize">{formData.deliveryMethod?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Target Due Date:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.dueDate}</span>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-400 block mb-1">Attached Files ({files.length}):</span>
                      <div className="flex flex-wrap gap-2">
                        {files.map(f => (
                          <span key={f.id} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Calculation Card (1 col) */}
              <div className="bg-gradient-to-b from-blue-50/80 to-indigo-50/60 dark:from-slate-850 dark:to-slate-800/80 p-6 rounded-3xl border border-blue-200/80 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-slate-700 pb-3 mb-4">
                    <span className="font-bold text-slate-900 dark:text-white text-base">Cost Estimate</span>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                      Instant Quote
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Base Print ({pricing.quantity} units)</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${pricing.baseCost.toFixed(2)}</span>
                    </div>

                    {(pricing.finishingCost || 0) > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Finishing & Bindery</span>
                        <span className="font-semibold text-slate-900 dark:text-white">+${(pricing.finishingCost || 0).toFixed(2)}</span>
                      </div>
                    )}

                    {(pricing.discount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Volume Tier Savings</span>
                        <span>-${(pricing.discount || 0).toFixed(2)}</span>
                      </div>
                    )}

                    {(pricing.rushFee || 0) > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                        <span>24h Rush Surcharge (25%)</span>
                        <span>+${(pricing.rushFee || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-blue-200 dark:border-slate-700 flex justify-between items-baseline">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Estimated Total</span>
                      <span className="text-[11px] text-slate-400">Includes setup & proofing</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400">
                      ${pricing.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-200/60 dark:border-slate-700/60">
                  <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span>
                      An automated confirmation and tracking ticket will be emailed to <strong>{formData.email}</strong> upon submission.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Form Submission Error Notification */}
        {submissionError && (
          <div className="mt-6 flex items-center gap-2.5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-98"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2.5 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Production...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Print Request</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
