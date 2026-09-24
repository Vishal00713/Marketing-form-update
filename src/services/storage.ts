import { FormFieldConfig, PrintOrder, AdminSettings, SelectOption } from '../types/form';

export const STORAGE_KEYS = {
  ORDERS: 'weekly_signage_orders_v2',
  FORM_CONFIG: 'weekly_signage_form_fields_v2',
  ADMIN_SETTINGS: 'weekly_signage_admin_settings_v2',
  THEME: 'weekly_signage_theme_v2'
};

export const ARTWORK_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Frontlit Flex Banner', value: 'Frontlit Flex Banner' },
  { label: 'Backlit Board / Signage', value: 'Backlit Board' },
  { label: 'Vinyl Self-Adhesive Film', value: 'Vinyl Film' },
  { label: 'One Way Vision (Window)', value: 'One Way Vision' },
  { label: 'Foam Board / Sun Board (5mm)', value: 'Foam Board 5mm' },
  { label: 'ACP Sheet Sign Board', value: 'ACP Sheet' },
  { label: 'Translite Film Lightbox', value: 'Translite Film' },
  { label: 'Roll-Up Standee (3x6 ft)', value: 'Roll-Up Standee' },
  { label: 'Directional / Wayfinding Sign', value: 'Directional Signage' },
  { label: 'Reflective Vinyl Signage', value: 'Reflective Signage' },
  { label: 'Canvas / Fabric Print', value: 'Fabric Banner' }
];

export const INITIAL_FORM_FIELDS: FormFieldConfig[] = [
  {
    id: 'workStartDate',
    label: 'Work Star Date',
    type: 'date',
    placeholder: 'dd-mm-yyyy',
    description: 'Project installation / initiation date',
    required: true,
    category: 'dates'
  },
  {
    id: 'weekEndingDate',
    label: 'Week Ending Date',
    type: 'date',
    placeholder: 'dd-mm-yyyy',
    description: 'Weekly billing cycle cut-off date',
    required: true,
    category: 'dates'
  },
  {
    id: 'vendorName',
    label: 'Vendor Name',
    type: 'text',
    placeholder: 'Your answer',
    description: 'Printing agency or installation contractor name',
    required: true,
    category: 'vendor'
  },
  {
    id: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'Your answer',
    description: 'Installation location / municipality',
    required: true,
    category: 'vendor'
  },
  {
    id: 'blBoard',
    label: 'BL Board',
    type: 'text',
    placeholder: 'Your answer',
    description: 'Backlit board / hoarding identifier or route code',
    required: true,
    category: 'vendor'
  },
  // Paired Artwork Quantity and Type Rows as seen in the Google Form
  {
    id: 'artworkQty_1',
    label: 'Artwork Quantity',
    type: 'number',
    placeholder: 'Your answer',
    required: true,
    min: 1,
    category: 'artwork'
  },
  {
    id: 'artworkType_1',
    label: 'Artwork Type',
    type: 'select',
    placeholder: 'Choose',
    required: true,
    options: ARTWORK_TYPE_OPTIONS,
    category: 'artwork'
  },
  {
    id: 'artworkQty_2',
    label: 'Artwork Quantity (Item 2)',
    type: 'number',
    placeholder: 'Your answer',
    required: false,
    min: 0,
    category: 'artwork'
  },
  {
    id: 'artworkType_2',
    label: 'Artwork Type (Item 2)',
    type: 'select',
    placeholder: 'Choose',
    required: false,
    options: ARTWORK_TYPE_OPTIONS,
    category: 'artwork',
    conditionalRules: [
      {
        fieldId: 'artworkQty_2',
        operator: 'greater_than',
        value: 0
      }
    ]
  },
  {
    id: 'artworkQty_3',
    label: 'Artwork Quantity (Item 3)',
    type: 'number',
    placeholder: 'Your answer',
    required: false,
    min: 0,
    category: 'artwork'
  },
  {
    id: 'artworkType_3',
    label: 'Artwork Type (Item 3)',
    type: 'select',
    placeholder: 'Choose',
    required: false,
    options: ARTWORK_TYPE_OPTIONS,
    category: 'artwork',
    conditionalRules: [
      {
        fieldId: 'artworkQty_3',
        operator: 'greater_than',
        value: 0
      }
    ]
  },
  {
    id: 'artworkQty_4',
    label: 'Artwork Quantity (Item 4)',
    type: 'number',
    placeholder: 'Your answer',
    required: false,
    min: 0,
    category: 'artwork'
  },
  {
    id: 'artworkType_4',
    label: 'Artwork Type (Item 4)',
    type: 'select',
    placeholder: 'Choose',
    required: false,
    options: ARTWORK_TYPE_OPTIONS,
    category: 'artwork',
    conditionalRules: [
      {
        fieldId: 'artworkQty_4',
        operator: 'greater_than',
        value: 0
      }
    ]
  },
  {
    id: 'artworkQty_5',
    label: 'Artwork Quantity (Item 5)',
    type: 'number',
    placeholder: 'Your answer',
    required: false,
    min: 0,
    category: 'artwork'
  },
  {
    id: 'artworkType_5',
    label: 'Artwork Type (Item 5)',
    type: 'select',
    placeholder: 'Choose',
    required: false,
    options: ARTWORK_TYPE_OPTIONS,
    category: 'artwork',
    conditionalRules: [
      {
        fieldId: 'artworkQty_5',
        operator: 'greater_than',
        value: 0
      }
    ]
  },
  {
    id: 'submitterEmail',
    label: 'Submitter Email Address',
    type: 'email',
    placeholder: 'Your answer',
    description: 'Email address where submission confirmation and tracking updates will be dispatched',
    required: true,
    category: 'contact'
  },
  {
    id: 'specialNotes',
    label: 'Special Instructions / Remarks',
    type: 'textarea',
    placeholder: 'Your answer',
    description: 'Optional site instructions, mounting hardware, or proof details',
    required: false,
    category: 'contact'
  }
];

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  businessName: 'Signage & Artwork Operations',
  formTitle: 'Weekly Signage / Artwork Quantity Tracker',
  formDescription: 'Submit weekly signage counts, installation dimensions, and vendor proofs for central reporting and monthly audit cycles.',
  supportEmail: 'vishalshrivastava.dss@gmail.com',
  turnaroundDaysDefault: 3,
  adminPin: 'admin123',
  sheetStorageEnabled: true,
  spreadsheetId: '',
  spreadsheetUrl: '',
  sheetName: 'Weekly_Signage_2026',
  themeColor: '#673ab7'
};

// Seed sample submissions
export const INITIAL_SAMPLE_ORDERS: PrintOrder[] = [
  {
    id: 'WST-2026-1042',
    createdAt: '2026-09-20T10:30:00.000Z',
    status: 'completed',
    workStartDate: '2026-09-15',
    weekEndingDate: '2026-09-21',
    vendorName: 'Apex Signcraft Media',
    city: 'Mumbai - Western Hub',
    blBoard: 'BL-MH-4019',
    artworkItems: [
      { id: 'item-1', quantity: 24, artworkType: 'Backlit Board' },
      { id: 'item-2', quantity: 60, artworkType: 'Frontlit Flex Banner' },
      { id: 'item-3', quantity: 15, artworkType: 'One Way Vision' }
    ],
    totalQuantity: 99,
    requester: {
      fullName: 'Vikram Mehta',
      email: 'vishal.toptown@gmail.com',
      phone: '+91 98200 12345',
      department: 'OOH Media Operations'
    },
    jobTitle: 'Western Express Highway Hoarding Upgrades',
    files: [],
    pricing: {
      quantity: 99,
      unitCost: 18.50,
      baseCost: 1831.50,
      total: 1831.50
    },
    formData: {
      workStartDate: '2026-09-15',
      weekEndingDate: '2026-09-21',
      vendorName: 'Apex Signcraft Media',
      city: 'Mumbai - Western Hub',
      blBoard: 'BL-MH-4019',
      artworkQty_1: 24,
      artworkType_1: 'Backlit Board',
      artworkQty_2: 60,
      artworkType_2: 'Frontlit Flex Banner',
      artworkQty_3: 15,
      artworkType_3: 'One Way Vision',
      submitterEmail: 'vishal.toptown@gmail.com'
    },
    statusHistory: [
      {
        id: 'sh-1',
        status: 'pending',
        timestamp: '2026-09-20T10:30:00.000Z',
        note: 'Weekly signage tracker response submitted.',
        updatedBy: 'System'
      },
      {
        id: 'sh-2',
        status: 'completed',
        timestamp: '2026-09-21T14:00:00.000Z',
        note: 'Signage audit verified against site delivery logs.',
        updatedBy: 'Audit Manager'
      }
    ],
    syncedToGoogleSheet: true
  },
  {
    id: 'WST-2026-1043',
    createdAt: '2026-09-22T08:15:00.000Z',
    status: 'printing',
    workStartDate: '2026-09-22',
    weekEndingDate: '2026-09-28',
    vendorName: 'PrintWorld Solutions',
    city: 'Pune Central',
    blBoard: 'BL-PN-8820',
    artworkItems: [
      { id: 'item-1', quantity: 45, artworkType: 'Roll-Up Standee' },
      { id: 'item-2', quantity: 30, artworkType: 'Foam Board 5mm' }
    ],
    totalQuantity: 75,
    requester: {
      fullName: 'Anita Deshmukh',
      email: 'anita.d@printworld.com',
      phone: '+91 97654 32100',
      department: 'Retail Branding'
    },
    jobTitle: 'Storefront Promotional Signage Batch #3',
    files: [],
    pricing: {
      quantity: 75,
      unitCost: 14.00,
      baseCost: 1050.00,
      total: 1050.00
    },
    formData: {
      workStartDate: '2026-09-22',
      weekEndingDate: '2026-09-28',
      vendorName: 'PrintWorld Solutions',
      city: 'Pune Central',
      blBoard: 'BL-PN-8820',
      artworkQty_1: 45,
      artworkType_1: 'Roll-Up Standee',
      artworkQty_2: 30,
      artworkType_2: 'Foam Board 5mm',
      submitterEmail: 'anita.d@printworld.com'
    },
    statusHistory: [
      {
        id: 'sh-1',
        status: 'pending',
        timestamp: '2026-09-22T08:15:00.000Z',
        note: 'Submission received.',
        updatedBy: 'System'
      },
      {
        id: 'sh-2',
        status: 'printing',
        timestamp: '2026-09-22T11:20:00.000Z',
        note: 'Printing on high-speed flatbed machines.',
        updatedBy: 'Production Operator'
      }
    ],
    syncedToGoogleSheet: false
  }
];

export const loadOrders = (): PrintOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_SAMPLE_ORDERS));
      return INITIAL_SAMPLE_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_ORDERS;
  }
};

export const saveOrders = (orders: PrintOrder[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders to localStorage:', err);
  }
};

export const loadFormFields = (): FormFieldConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORM_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FORM_CONFIG, JSON.stringify(INITIAL_FORM_FIELDS));
      return INITIAL_FORM_FIELDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FORM_FIELDS;
  }
};

export const saveFormFields = (fields: FormFieldConfig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FORM_CONFIG, JSON.stringify(fields));
  } catch (err) {
    console.error('Failed to save form fields to localStorage:', err);
  }
};

export const loadAdminSettings = (): AdminSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(INITIAL_ADMIN_SETTINGS));
      return INITIAL_ADMIN_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ADMIN_SETTINGS;
  }
};

export const saveAdminSettings = (settings: AdminSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save admin settings to localStorage:', err);
  }
};

export const isFieldVisible = (field: FormFieldConfig, formValues: Record<string, any>): boolean => {
  if (!field.conditionalRules || field.conditionalRules.length === 0) {
    return true;
  }

  const matchMode = field.conditionalMatch || 'all';

  const checkRule = (rule: any): boolean => {
    const sourceVal = formValues[rule.fieldId];

    switch (rule.operator) {
      case 'equals':
        return String(sourceVal ?? '').toLowerCase() === String(rule.value ?? '').toLowerCase();
      case 'not_equals':
        return String(sourceVal ?? '').toLowerCase() !== String(rule.value ?? '').toLowerCase();
      case 'contains':
        if (Array.isArray(sourceVal)) {
          return sourceVal.some(v => String(v).toLowerCase().includes(String(rule.value).toLowerCase()));
        }
        return String(sourceVal ?? '').toLowerCase().includes(String(rule.value ?? '').toLowerCase());
      case 'greater_than':
        return Number(sourceVal || 0) > Number(rule.value);
      case 'less_than':
        return Number(sourceVal || 0) < Number(rule.value);
      case 'is_checked':
        if (Array.isArray(sourceVal)) {
          return sourceVal.includes(rule.value);
        }
        return Boolean(sourceVal);
      case 'is_not_checked':
        if (Array.isArray(sourceVal)) {
          return !sourceVal.includes(rule.value);
        }
        return !sourceVal;
      default:
        return true;
    }
  };

  if (matchMode === 'any') {
    return field.conditionalRules.some(checkRule);
  }
  return field.conditionalRules.every(checkRule);
};
