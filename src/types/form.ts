export type FormFieldType = 
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file';

export type ConditionalOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_checked'
  | 'is_not_checked';

export interface ConditionalRule {
  fieldId: string;
  operator: ConditionalOperator;
  value: string | number | boolean;
}

export interface SelectOption {
  label: string;
  value: string;
  priceModifier?: number;
  description?: string;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  helpText?: string;
  required: boolean;
  stepNumber?: 1 | 2 | 3;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  category?: string;
  conditionalMatch?: 'all' | 'any';
  conditionalRules?: ConditionalRule[];
  accept?: string;
  maxFileSizeMb?: number;
  validationRegex?: string;
  validationErrorMessage?: string;
}

export interface UploadedFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  driveFileId?: string;
  driveViewLink?: string;
  uploadedAt: string;
}

export type OrderStatus = 
  | 'pending'
  | 'proof_review'
  | 'printing'
  | 'finishing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderPricing {
  quantity: number;
  unitCost: number;
  baseCost: number;
  paperStockCost?: number;
  finishingCost?: number;
  rushFee?: number;
  discount?: number;
  total: number;
}

export interface OrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  timestamp: string;
  note: string;
  updatedBy: string;
}

export interface SignageArtworkRow {
  id: string;
  quantity: number | string;
  artworkType: string;
}

export interface PrintOrder {
  id: string; // e.g. WST-2026-8472
  createdAt: string;
  status: OrderStatus;
  // Specific to Weekly Signage / Artwork Tracker
  workStartDate: string;
  weekEndingDate: string;
  vendorName: string;
  city: string;
  blBoard: string;
  artworkItems: SignageArtworkRow[];
  totalQuantity: number;
  // Optional legacy fields for backward compatibility
  specs?: any;
  delivery?: any;
  requester: {
    fullName: string;
    email: string;
    phone?: string;
    department?: string;
    costCenter?: string;
  };
  jobTitle: string;
  files: UploadedFileMeta[];
  pricing: OrderPricing;
  formData: Record<string, any>;
  statusHistory: OrderStatusHistoryItem[];
  syncedToGoogleSheet?: boolean;
  syncedAt?: string;
}

export interface AdminSettings {
  businessName: string;
  formTitle: string;
  formDescription: string;
  supportEmail: string;
  turnaroundDaysDefault: number;
  adminPin: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetName?: string;
  sheetStorageEnabled: boolean;
  autoSyncToSheet?: boolean;
  themeColor: string;
  bgColor?: string;
  fontFamily?: 'sans' | 'roboto' | 'serif' | 'playful';
  headerAccentHeight?: number;
  lastMonthlyReportGenerated?: string;
}
