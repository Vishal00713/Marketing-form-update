import { PrintOrder } from '../types/form';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export const DEFAULT_SHEET_NAME = 'Weekly_Signage_2026';
export const REPORT_SHEET_NAME = 'Monthly_Reporting_Cycle';

const ORDER_COLUMNS = [
  'Timestamp',
  'Submission ID',
  'Work Star Date',
  'Week Ending Date',
  'Vendor Name',
  'City',
  'BL Board',
  'Artwork Details / Items',
  'Total Quantity',
  'Status',
  'Submitter Email',
  'Drive Artwork File Links',
  'Special Instructions / Remarks'
];

/**
 * Creates a dedicated Master Google Sheet for Weekly Signage / Artwork Quantity Tracker and Automated Monthly Reporting.
 */
export async function createPrintOrdersSpreadsheet(
  accessToken: string,
  customTitle: string = 'Weekly Signage & Artwork Quantity Centralized Tracker'
): Promise<SheetCreationResult> {
  const requestBody = {
    properties: {
      title: `${customTitle} (${new Date().getFullYear()})`
    },
    sheets: [
      {
        properties: {
          title: DEFAULT_SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 20,
            rowCount: 1000
          }
        }
      },
      {
        properties: {
          title: REPORT_SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 10,
            rowCount: 50
          }
        }
      }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create Google Sheet (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Header row in Orders sheet
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${DEFAULT_SHEET_NAME}!A1:M1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [ORDER_COLUMNS]
    })
  });

  // Initialize Header row in Monthly Reporting Cycle sheet
  const reportHeaders = [
    'Month / Reporting Cycle',
    'Total Submissions',
    'Total Artwork Quantity',
    'Completed Signage Jobs',
    'In Progress / Press',
    'Top Active Vendor',
    'Primary Installation City',
    'Most Common Artwork Type',
    'Last Synced Timestamp'
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${REPORT_SHEET_NAME}!A1:I1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [reportHeaders]
    })
  });

  // Format header row styling (Google Forms purple accent header)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: data.sheets[0].properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.40, green: 0.23, blue: 0.72 }, // Google Forms Purple
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10 }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            repeatCell: {
              range: {
                sheetId: data.sheets[1].properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.20, green: 0.35, blue: 0.55 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10 }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      })
    });
  } catch (fmtErr) {
    console.warn('Formatting spreadsheet headers skipped:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: data.properties?.title || customTitle
  };
}

/**
 * Converts a PrintOrder (Signage Submission) into a spreadsheet row array
 */
export function formatOrderToSheetRow(order: PrintOrder): (string | number)[] {
  const artworkSummary = (order.artworkItems || []).map(item => {
    return `${item.artworkType || 'Artwork'}: ${item.quantity || 0} units`;
  }).join('; ') || `Qty: ${order.totalQuantity || order.pricing?.quantity || 1}`;

  const fileLinks = (order.files || []).map(f => {
    return f.driveViewLink ? `${f.name} (${f.driveViewLink})` : f.name;
  }).join(' | ');

  const formattedDate = new Date(order.createdAt).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  return [
    formattedDate,
    order.id,
    order.workStartDate || order.formData?.workStartDate || 'N/A',
    order.weekEndingDate || order.formData?.weekEndingDate || 'N/A',
    order.vendorName || order.formData?.vendorName || order.requester?.fullName || 'N/A',
    order.city || order.formData?.city || 'N/A',
    order.blBoard || order.formData?.blBoard || 'N/A',
    artworkSummary,
    order.totalQuantity || order.pricing?.quantity || 0,
    order.status.toUpperCase(),
    order.requester?.email || order.formData?.submitterEmail || 'N/A',
    fileLinks || 'None',
    order.formData?.specialNotes || order.formData?.specialInstructions || ''
  ];
}

/**
 * Appends a single order row to the specified Google Sheet.
 */
export async function appendOrderToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  order: PrintOrder,
  sheetName: string = DEFAULT_SHEET_NAME
): Promise<boolean> {
  const rowValues = formatOrderToSheetRow(order);
  const range = `${sheetName}!A:M`;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to append row to Google Sheet (${response.status})`);
  }

  return true;
}

/**
 * Batch appends multiple orders to Google Sheet.
 */
export async function batchAppendOrdersToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: PrintOrder[],
  sheetName: string = DEFAULT_SHEET_NAME
): Promise<number> {
  if (orders.length === 0) return 0;

  const rows = orders.map(formatOrderToSheetRow);
  const range = `${sheetName}!A:M`;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to batch sync orders (${response.status})`);
  }

  return orders.length;
}

/**
 * Generates and updates automated Monthly Reporting Cycle summary in the second sheet tab.
 */
export async function updateMonthlyReportingCycleInSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: PrintOrder[]
): Promise<boolean> {
  // Aggregate orders by Month (YYYY-MM)
  const monthMap: Record<string, {
    monthLabel: string;
    totalOrders: number;
    totalQuantity: number;
    completed: number;
    inProgress: number;
    vendors: Record<string, number>;
    cities: Record<string, number>;
    artworkTypes: Record<string, number>;
  }> = {};

  orders.forEach(order => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        monthLabel,
        totalOrders: 0,
        totalQuantity: 0,
        completed: 0,
        inProgress: 0,
        vendors: {},
        cities: {},
        artworkTypes: {}
      };
    }

    const group = monthMap[monthKey];
    group.totalOrders += 1;
    group.totalQuantity += (order.totalQuantity || order.pricing?.quantity || 1);

    if (order.status === 'completed') {
      group.completed += 1;
    } else if (['pending', 'proof_review', 'printing', 'finishing'].includes(order.status)) {
      group.inProgress += 1;
    }

    const vendor = order.vendorName || order.requester?.fullName || 'General';
    group.vendors[vendor] = (group.vendors[vendor] || 0) + 1;

    const city = order.city || 'Standard';
    group.cities[city] = (group.cities[city] || 0) + 1;

    (order.artworkItems || []).forEach(item => {
      const type = item.artworkType || 'General Signage';
      group.artworkTypes[type] = (group.artworkTypes[type] || 0) + (Number(item.quantity) || 1);
    });
  });

  // Convert map to reporting rows sorted descending by month
  const reportRows = Object.keys(monthMap).sort().reverse().map(key => {
    const g = monthMap[key];
    
    // Determine top vendor
    const topVendor = Object.entries(g.vendors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    // Determine top city
    const topCity = Object.entries(g.cities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    // Determine top artwork type
    const topArtworkType = Object.entries(g.artworkTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Signage';

    return [
      g.monthLabel,
      g.totalOrders,
      g.totalQuantity,
      g.completed,
      g.inProgress,
      topVendor,
      topCity,
      topArtworkType,
      new Date().toLocaleString()
    ];
  });

  if (reportRows.length === 0) {
    return true;
  }

  // Clear existing reporting data rows (from row 2 downwards)
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${REPORT_SHEET_NAME}!A2:I100:clear`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (clearErr) {
    console.warn('Could not clear old report rows:', clearErr);
  }

  // Write newly aggregated monthly summary rows
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${REPORT_SHEET_NAME}!A2:I${1 + reportRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: reportRows
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to write monthly reporting summary');
  }

  return true;
}

/**
 * Extracts spreadsheet ID from Google Sheet URL or ID string
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}
