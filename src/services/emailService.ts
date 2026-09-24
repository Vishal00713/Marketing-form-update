import { PrintOrder } from '../types/form';

export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  sentAt: string;
}

export function generateEmailConfirmationHtml(order: PrintOrder, businessName = 'Signage & Artwork Operations'): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const artworkItemsHtml = (order.artworkItems && order.artworkItems.length > 0)
    ? order.artworkItems.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px;">
        <span style="color: #475569; font-weight: 500;">${item.artworkType}</span>
        <span style="color: #0f172a; font-weight: 600;">${item.quantity} units</span>
      </div>
    `).join('')
    : `<div style="padding: 6px 0; font-size: 13px; color: #0f172a;">Quantity: ${order.totalQuantity || order.pricing?.quantity || 1} units</div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; }
    .email-header { background: #673ab7; color: #ffffff; padding: 28px 24px; text-align: center; }
    .email-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .email-header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; }
    .tracking-badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 5px 14px; border-radius: 9999px; font-family: monospace; font-weight: 600; font-size: 14px; margin-top: 12px; }
    .email-body { padding: 24px; }
    .info-box { background: #fdfaff; border-radius: 8px; padding: 14px; margin: 16px 0; border-left: 4px solid #673ab7; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-val { color: #0f172a; font-weight: 600; text-align: right; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0 4px 0; font-size: 16px; font-weight: 700; color: #673ab7; border-top: 2px solid #cbd5e1; }
    .email-footer { background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Weekly Signage / Artwork Submission Received</h1>
      <p>${businessName}</p>
      <div class="tracking-badge">Tracking ID: ${order.id}</div>
    </div>
    
    <div class="email-body">
      <p>Hello,</p>
      <p>Your response for <strong>Weekly Signage / Artwork Quantity Tracker</strong> has been recorded and queued for audit verification.</p>

      <div class="info-box">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e1b4b;">Vendor: ${order.vendorName || order.requester?.fullName || 'N/A'}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">BL Board: ${order.blBoard || 'N/A'} &bull; City: ${order.city || 'N/A'}</p>
      </div>

      <div style="margin: 16px 0;">
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-val" style="color: #673ab7; text-transform: uppercase;">Recorded / In Review</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submission Date:</span>
          <span class="detail-val">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Work Star Date:</span>
          <span class="detail-val">${order.workStartDate || order.formData?.workStartDate || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Week Ending Date:</span>
          <span class="detail-val">${order.weekEndingDate || order.formData?.weekEndingDate || 'N/A'}</span>
        </div>
        
        <div style="margin-top: 14px; margin-bottom: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b;">
          Artwork Breakdown
        </div>
        ${artworkItemsHtml}

        <div class="total-row">
          <span>Total Artwork Quantity:</span>
          <span>${order.totalQuantity || order.pricing?.quantity || 1} units</span>
        </div>
      </div>

      ${order.files && order.files.length > 0 ? `
      <div style="margin-top: 16px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          Uploaded Proof Files (${order.files.length})
        </div>
        ${order.files.map(f => `
          <div style="font-size: 12px; color: #0f172a; padding: 4px 0;">
            &bull; ${f.name} ${f.driveViewLink ? `<a href="${f.driveViewLink}" target="_blank" style="color: #673ab7;">(View on Drive)</a>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        This record is automatically synchronized with your central Google Sheet for recurring monthly reporting.
      </p>
    </div>

    <div class="email-footer">
      <p style="margin: 0;">${businessName} &bull; Signage & Artwork Operations</p>
      <p style="margin: 4px 0 0 0;">Weekly Signage / Artwork Quantity Tracker</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateOrderConfirmationEmail(order: PrintOrder, businessName = 'Signage & Artwork Operations'): EmailPayload {
  const htmlContent = generateEmailConfirmationHtml(order, businessName);

  return {
    to: order.requester?.email || order.formData?.submitterEmail || 'user@example.com',
    subject: `Submission Recorded #${order.id} - ${order.vendorName || 'Weekly Signage Tracker'}`,
    htmlContent,
    sentAt: new Date().toISOString()
  };
}
