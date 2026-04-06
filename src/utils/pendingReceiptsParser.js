/**
 * Maps the custom AP "Pending Receipts" report columns → Dashboard 4 data structure.
 *
 * Supports the following headers from the user's actual export:
 *   Venue Name, Invoice Number, Supplier Name, Invoice Date,
 *   Requester Name, PO Number, Invoice Total, Invoice Year,
 *   AP Comments, Follow Up
 *
 * Also handles common SAP / alias column names for each field.
 */

const TODAY = new Date();

function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    // Normalize key: replace non-breaking spaces, collapse whitespace, uppercase, trim
    const normKey = k.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim();
    const val = obj[k];
    // Preserve 0 — don't coerce falsy values with || '' (0 is a valid cell value)
    const normVal = (val === null || val === undefined)
      ? ''
      : String(val).replace(/\u00a0/g, ' ').trim();
    out[normKey] = normVal;
  });
  return out;
}

function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return '';
}

function parseDate(str) {
  if (!str) return null;
  // Already a JS Date object (from SheetJS with cellDates: true)
  if (str instanceof Date) return str.toISOString().slice(0, 10);
  const s = String(str).trim();
  // DD.MM.YYYY
  const dmy = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Excel serial date number (5-digit integer)
  if (/^\d{5}$/.test(s)) {
    const d = new Date(Math.round((parseFloat(s) - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  return s || null;
}

function parseAmount(str) {
  if (!str) return 0;
  // Remove currency symbols, then remove all commas, then parseFloat
  const cleaned = String(str).replace(/[$€£¥]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d)) return 0;
  return Math.max(0, Math.floor((TODAY - d) / (1000 * 60 * 60 * 24)));
}

function agingBucket(days) {
  if (days > 90) return '90+ days';
  if (days > 60) return '61–90 days';
  if (days > 30) return '31–60 days';
  return '0–30 days';
}

// Required columns shown in the FileUpload hint panel
export const PENDING_RECEIPTS_EXPECTED_COLUMNS = [
  'Invoice Number', 'Supplier Name', 'Invoice Date',
  'Requester Name', 'PO Number', 'Invoice Total',
];

export function parsePendingReceiptsCSV(rows) {
  const errors = [];
  const parsed = [];

  rows.forEach((rawRow, i) => {
    const row = norm(rawRow);

    // ── Invoice Number ────────────────────────────────────────────────────
    const invoiceNum = pick(row,
      'INVOICE NUMBER', 'INVOICE #', 'INVOICE NO',
      'BELNR');

    // ── Venue / Department ────────────────────────────────────────────────
    const venueName = pick(row,
      'VENUE NAME', 'VENUE', 'LOCATION', 'DEPARTMENT', 'DEPT');

    // ── Supplier / Vendor name ────────────────────────────────────────────
    const vendorName = pick(row,
      'SUPPLIER NAME', 'SUPPLIER_NAME', 'SUPPLIER',
      'VENDOR NAME', 'VENDOR', 'NAME1')
      .replace(/\s*\([^)]*\)\s*$/, '').trim();

    // Skip rows with neither an invoice number nor a vendor name
    if (!invoiceNum && !vendorName) {
      errors.push(`Row ${i + 2}: Missing both Invoice Number and Supplier Name — skipped.`);
      return;
    }

    // ── Invoice Date ──────────────────────────────────────────────────────
    const invoiceDate = parseDate(pick(row,
      'INVOICE DATE', 'INVOICE_DATE', 'BLDAT', 'DOC_DATE'));

    // ── Requester ─────────────────────────────────────────────────────────
    const requester = pick(row,
      'REQUESTER NAME', 'REQUESTER_NAME', 'REQUESTER', 'REQUESTED BY');

    // ── PO Number ─────────────────────────────────────────────────────────
    const poNumber = pick(row,
      'PO NUMBER', 'PO_NUMBER', 'PURCHASING DOCUMENT', 'PURCHASE ORDER', 'EBELN');

    // ── Invoice Total ─────────────────────────────────────────────────────
    const amount = parseAmount(pick(row,
      'INVOICE TOTAL', 'TOTAL', 'INVOICE AMOUNT', 'AMOUNT', 'WRBTR'));

    // ── Invoice Year — fall back to year extracted from invoice date ───────
    let invoiceYear = pick(row, 'INVOICE YEAR', 'YEAR');
    if (!invoiceYear && invoiceDate) {
      invoiceYear = invoiceDate.slice(0, 4);
    }

    // ── AP Comments ───────────────────────────────────────────────────────
    const apComments = pick(row,
      'AP COMMENTS', 'AP_COMMENTS', 'COMMENTS', 'COMMENT');

    // ── Follow Up ─────────────────────────────────────────────────────────
    const followUp = pick(row,
      'FOLLOW UP', 'FOLLOW_UP', 'FOLLOWUP', 'FOLLOW-UP');

    // ── Derived aging fields ───────────────────────────────────────────────
    const daysOpen    = daysBetween(invoiceDate);
    const agingBucket_ = agingBucket(daysOpen);

    parsed.push({
      INVOICE_NUM:   invoiceNum  || '—',
      VENUE_NAME:    venueName   || '—',
      VENDOR_NAME:   vendorName  || '—',
      INVOICE_DATE:  invoiceDate || '',
      REQUESTER:     requester   || '—',
      PO_NUMBER:     poNumber    || '—',
      AMOUNT:        amount,
      INVOICE_YEAR:  invoiceYear || '—',
      AP_COMMENTS:   apComments  || '',
      FOLLOW_UP:     followUp    || '',
      DAYS_OPEN:     daysOpen,
      AGING_BUCKET:  agingBucket_,
    });
  });

  return {
    data: parsed.sort((a, b) => b.AMOUNT - a.AMOUNT),
    errors,
  };
}
