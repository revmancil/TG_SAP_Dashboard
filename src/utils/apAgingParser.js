/**
 * Parser for AP Aging report
 *
 * Expected columns:
 *   Company Code, Company Code - Key, Vendor, Vendor - Key,
 *   Payment Method Description, Payment Method ID, Document type,
 *   Accounting Document Number, Document Date in Document,
 *   Posting Date in the Document, Reference Document Number, Item Text,
 *   Total Balance LC, Amount_LC No Due, Amount_LC 1_30, Amount_LC 31_60,
 *   Amount_LC 61_90, Amount_LC 91_120, Amount_LC Above 120, Amount_LC_Total_Due
 */

function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    const key = k.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim();
    const val = obj[k];
    out[key] = (val === null || val === undefined) ? '' : String(val).replace(/\u00a0/g, ' ').trim();
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
  if (str instanceof Date) return str.toISOString().slice(0, 10);
  const s = String(str).trim();
  const dmy = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  if (/^\d{5}$/.test(s)) {
    const d = new Date(Math.round((parseFloat(s) - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  return s || null;
}

function parseAmt(str) {
  if (str === null || str === undefined || str === '') return 0;
  let s = String(str).replace(/[$€£¥\s]/g, '').replace(/,/g, '');
  // SAP accounting format: (1234.56) = -1234.56
  if (/^\(.*\)$/.test(s)) return -(parseFloat(s.slice(1, -1)) || 0);
  // SAP trailing-minus format: 1234.56- = -1234.56
  if (/^[\d.]+[-]$/.test(s)) return -(parseFloat(s.slice(0, -1)) || 0);
  return parseFloat(s) || 0;
}

export const AP_AGING_EXPECTED_COLUMNS = [
  'Vendor', 'Accounting Document Number', 'Document Date in Document',
  'Total Balance LC', 'Amount_LC No Due', 'Amount_LC 1_30',
  'Amount_LC 31_60', 'Amount_LC 61_90', 'Amount_LC 91_120', 'Amount_LC Above 120',
];

export const AGING_BUCKETS = [
  { key: 'AMT_NOT_DUE',  label: 'Not Due',    col: 'AMOUNT_LC NO DUE',    color: '#2E7D32' },
  { key: 'AMT_1_30',     label: '1–30 Days',  col: 'AMOUNT_LC 1_30',      color: '#0070F2' },
  { key: 'AMT_31_60',    label: '31–60 Days', col: 'AMOUNT_LC 31_60',     color: '#E9730C' },
  { key: 'AMT_61_90',    label: '61–90 Days', col: 'AMOUNT_LC 61_90',     color: '#BB0000' },
  { key: 'AMT_91_120',   label: '91–120 Days',col: 'AMOUNT_LC 91_120',    color: '#8B0000' },
  { key: 'AMT_ABOVE_120',label: '120+ Days',  col: 'AMOUNT_LC ABOVE 120', color: '#4A0000' },
];

export function parseAPAgingCSV(rows) {
  const errors  = [];
  const parsed  = [];

  rows.forEach((rawRow, i) => {
    const row = norm(rawRow);

    const companyCode    = pick(row, 'COMPANY CODE - KEY', 'COMPANY CODE KEY', 'BUKRS', 'CO. CODE');
    const companyName    = pick(row, 'COMPANY CODE', 'COMPANY NAME', 'CO. CODE NAME');
    const vendorKey      = pick(row, 'VENDOR - KEY', 'VENDOR KEY', 'VENDOR_KEY', 'LIFNR');
    const vendorName     = pick(row, 'VENDOR', 'VENDOR NAME', 'SUPPLIER', 'NAME1')
                            .replace(/\s*\([^)]*\)\s*$/, '').trim();
    const paymentMethod  = pick(row, 'PAYMENT METHOD DESCRIPTION', 'PAYMENT METHOD DESC', 'PAYMENT_METHOD');
    const paymentMethodId= pick(row, 'PAYMENT METHOD ID', 'PAYMENT_METHOD_ID', 'ZLSCH');
    const docType        = pick(row, 'DOCUMENT TYPE', 'DOC TYPE', 'BLART');
    const docNumber      = pick(row, 'ACCOUNTING DOCUMENT NUMBER', 'DOCUMENT NUMBER', 'BELNR', 'DOC NO', 'DOC NUMBER');
    const docDate        = parseDate(pick(row, 'DOCUMENT DATE IN DOCUMENT', 'DOCUMENT DATE', 'DOC DATE', 'BLDAT'));
    const postingDate    = parseDate(pick(row, 'POSTING DATE IN THE DOCUMENT', 'POSTING DATE', 'BUDAT'));
    const refDoc         = pick(row, 'REFERENCE DOCUMENT NUMBER', 'REFERENCE DOCUMENT', 'REFERENCE', 'XBLNR');
    const itemText       = pick(row, 'ITEM TEXT', 'TEXT', 'BKTXT', 'SGTXT');
    const totalBalance   = parseAmt(pick(row, 'TOTAL BALANCE LC', 'TOTAL BALANCE', 'BALANCE LC', 'DMBTR'));
    const amtNotDue      = parseAmt(pick(row, 'AMOUNT_LC NO DUE', 'AMOUNT_LC_NO_DUE', 'AMT NO DUE', 'NOT DUE'));
    const amt1_30        = parseAmt(pick(row, 'AMOUNT_LC 1_30',   'AMOUNT_LC_1_30',   'AMT 1_30',  '1-30'));
    const amt31_60       = parseAmt(pick(row, 'AMOUNT_LC 31_60',  'AMOUNT_LC_31_60',  'AMT 31_60', '31-60'));
    const amt61_90       = parseAmt(pick(row, 'AMOUNT_LC 61_90',  'AMOUNT_LC_61_90',  'AMT 61_90', '61-90'));
    const amt91_120      = parseAmt(pick(row, 'AMOUNT_LC 91_120', 'AMOUNT_LC_91_120', 'AMT 91_120','91-120'));
    const amtAbove120    = parseAmt(pick(row, 'AMOUNT_LC ABOVE 120', 'AMOUNT_LC_ABOVE_120', 'ABOVE 120', '120+'));
    const totalDue       = parseAmt(pick(row, 'AMOUNT_LC_TOTAL_DUE', 'AMOUNT_LC TOTAL DUE', 'TOTAL DUE'));

    // Skip any row without a document number — these are header, subtotal, and SUM rows
    if (!docNumber) return;

    parsed.push({
      COMPANY_CODE:   companyCode || '—',
      COMPANY_NAME:   companyName || companyCode || '—',
      VENDOR_KEY:     vendorKey   || '—',
      VENDOR_NAME:    vendorName  || vendorKey   || 'Unknown Vendor',
      PAYMENT_METHOD: paymentMethod  || '—',
      PAYMENT_METHOD_ID: paymentMethodId || '—',
      DOC_TYPE:       docType     || '—',
      DOC_NUMBER:     docNumber   || '—',
      DOC_DATE:       docDate,
      POSTING_DATE:   postingDate,
      REF_DOC:        refDoc      || '—',
      ITEM_TEXT:      itemText    || '—',
      TOTAL_BALANCE:  totalBalance,
      AMT_NOT_DUE:    amtNotDue,
      AMT_1_30:       amt1_30,
      AMT_31_60:      amt31_60,
      AMT_61_90:      amt61_90,
      AMT_91_120:     amt91_120,
      AMT_ABOVE_120:  amtAbove120,
      TOTAL_DUE:      totalDue || (amt1_30 + amt31_60 + amt61_90 + amt91_120 + amtAbove120),
    });
  });

  return { data: parsed, errors };
}
