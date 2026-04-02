/**
 * Maps SAP CSV export columns → Dashboard 1 data structure.
 *
 * Supports exports from:
 *   SWI2_FREQ  – Work items by task/agent
 *   FBL1N      – Vendor open items (supplement)
 *
 * Column names are normalised to UPPERCASE before matching,
 * so exports in any language casing will work.
 */

const TODAY = new Date();

function norm(obj) {
  // Return a version of the row with all keys uppercased + trimmed
  const out = {};
  Object.keys(obj).forEach((k) => { out[k.toUpperCase().trim()] = (obj[k] || '').trim(); });
  return out;
}

// Try multiple possible column names for each field
function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return '';
}

function parseDate(str) {
  if (!str) return null;
  // Handle DD.MM.YYYY (SAP default), MM/DD/YYYY, YYYY-MM-DD
  const dmy = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  return str; // assume ISO already
}

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY - d) / (1000 * 60 * 60 * 24)));
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.floor((d - TODAY) / (1000 * 60 * 60 * 24));
}

function parseAmount(str) {
  if (!str) return 0;
  // Remove currency symbols, spaces, thousand separators
  const cleaned = str.replace(/[^0-9.\-,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function agingBucket(days) {
  if (days <= 5)  return '0–5 days';
  if (days <= 10) return '6–10 days';
  return '10+ days';
}

export const APPROVALS_EXPECTED_COLUMNS = [
  'BELNR', 'LIFNR', 'VENDOR_NAME', 'WRBTR', 'ZTERM',
  'BLDAT', 'WI_STAT', 'APPROVER_ID', 'APPROVER_NAME', 'WI_CREATED_TS',
];

export function parseApprovalsCSV(rows) {
  const errors = [];
  const parsed = [];

  rows.forEach((rawRow, i) => {
    const row = norm(rawRow);

    const belnr = pick(row, 'BELNR', 'INVOICE', 'INVOICE_NO', 'INVOICE #', 'DOC_NO', 'DOCUMENT NUMBER');
    const vendor = pick(row, 'VENDOR_NAME', 'NAME1', 'VENDOR NAME', 'VENDOR', 'LIEFERANT');
    const lifnr  = pick(row, 'LIFNR', 'VENDOR_ID', 'VENDOR ID', 'VENDOR NO');
    const amtStr = pick(row, 'WRBTR', 'AMOUNT', 'GROSS_AMOUNT', 'GROSS AMOUNT', 'BETRAG', 'INV_AMOUNT');
    const zterm  = pick(row, 'ZTERM', 'PAYMENT_TERMS', 'PAYMENT TERMS', 'PAY TERMS', 'ZAHLBED');
    const bldat  = parseDate(pick(row, 'BLDAT', 'INVOICE_DATE', 'INVOICE DATE', 'BELEGDATUM', 'DOC_DATE'));
    const wiStat = pick(row, 'WI_STAT', 'STATUS', 'WI_STATUS', 'WORKFLOW_STATUS') || 'READY';
    const wiDate = parseDate(pick(row, 'WI_CREATED_TS', 'WI_DATE', 'CREATED_DATE', 'WORKFLOW_DATE', 'CREATED_ON', 'ERDAT')) || bldat;
    const approverId   = pick(row, 'APPROVER_ID', 'ACTUAL_AGENT', 'AGENT', 'USER_ID', 'BENUTZER', 'USNAM');
    const approverName = pick(row, 'APPROVER_NAME', 'AGENT_NAME', 'APPROVER', 'FULL_NAME', 'NAME');

    if (!belnr) { errors.push(`Row ${i + 2}: Missing invoice number (BELNR)`); return; }

    const amount     = parseAmount(amtStr);
    const daysInWF   = daysBetween(wiDate);
    const discountDays = zterm === 'ZB01' ? 10 : zterm === 'ZB04' ? 5 : zterm === 'ZB02' ? 15 : null;
    let discDeadline = null;
    if (discountDays && bldat) {
      const d = new Date(bldat);
      d.setDate(d.getDate() + discountDays);
      discDeadline = d.toISOString().slice(0, 10);
    }
    const daysToDiscount = daysUntil(discDeadline);
    const discountPct = zterm === 'ZB01' ? 2 : zterm === 'ZB04' ? 3 : zterm === 'ZB02' ? 1 : 0;

    parsed.push({
      WI_ID:          `WI-UPLOAD-${i}`,
      BELNR:          belnr,
      LIFNR:          lifnr || 'UNKNOWN',
      VENDOR_NAME:    vendor || lifnr || 'Unknown Vendor',
      WRBTR:          amount,
      WAERS:          pick(row, 'WAERS', 'CURRENCY', 'CURR') || 'USD',
      ZTERM:          zterm,
      ZTERM_DESC:     pick(row, 'ZTERM_DESC', 'TERMS_DESC', 'PAYMENT_TERMS_DESC') || zterm || '—',
      BLDAT:          bldat,
      WI_STAT:        wiStat.toUpperCase().replace(' ', '_'),
      WI_CREATED_TS:  wiDate,
      APPROVER_ID:    approverId || 'UNKNOWN',
      APPROVER_NAME:  approverName || approverId || 'Unknown',
      APPROVER_DEPT:  pick(row, 'DEPT', 'DEPARTMENT', 'KOSTL', 'COST_CENTER') || '—',
      DAYS_IN_WORKFLOW: daysInWF,
      AGING_BUCKET:   agingBucket(daysInWF),
      DISCOUNT_DEADLINE: discDeadline,
      DAYS_TO_DISCOUNT:  daysToDiscount,
      DISCOUNT_AMOUNT:   discountPct ? (amount * discountPct) / 100 : 0,
      DISCOUNT_AT_RISK:  daysToDiscount !== null && daysToDiscount < 5,
    });
  });

  return {
    data: parsed.sort((a, b) => b.WRBTR - a.WRBTR),
    errors,
  };
}
