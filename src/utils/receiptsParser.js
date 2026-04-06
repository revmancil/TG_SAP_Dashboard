/**
 * Maps SAP CSV/Excel export columns → Dashboard 2 GR/IR data structure.
 *
 * Supports exports from:
 *   MB5S  – GR/IR balance report
 *     Columns: Purch. Organization, Purchasing Group, Supplier, Purchasing Document,
 *              Item, Freight Supplier, Condition type, Quantity Received, Invoice Quantity,
 *              Order Unit, Value of goods rec., Invoice amount LC, Currency, Stock Segment
 *   MRBR  – Blocked invoices (IR without GR)
 *     Columns: Status, Document Type, Invoicing Party, Name, Log. payment block,
 *              Invoice Document No., Posting Date, User Name, Amount, Currency,
 *              Purchasing Document, Item, Blockg Reas. Price (Icon), Difference Value,
 *              Blockg Reason Qty (Icon), Difference Quantity, Quantity, Order Unit,
 *              Company Code, Reference Document, Fiscal Year, Plant
 */

const TODAY = new Date();

function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    // Normalize key: replace non-breaking spaces, collapse whitespace, uppercase
    const normKey = k.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim();
    const val = obj[k];
    // Preserve 0 — don't coerce falsy values to '' (0 is a valid cell value)
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
  // Already a JS Date object (from SheetJS with cellDates:true)
  if (str instanceof Date) return str.toISOString().slice(0, 10);
  const s = String(str).trim();
  const dmy = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  // Excel serial date number
  if (/^\d{5}$/.test(s)) {
    const d = new Date(Math.round((parseFloat(s) - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  return s || null;
}

function parseNum(str) {
  if (!str) return 0;
  // Remove currency symbols, whitespace, and comma thousands separators (US format)
  const cleaned = String(str).replace(/[$€£¥\s]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d)) return 0;
  return Math.max(0, Math.floor((TODAY - d) / (1000 * 60 * 60 * 24)));
}

// MB5S columns that must be present
export const RECEIPTS_EXPECTED_COLUMNS_MB5S = [
  'Purchasing Document', 'Supplier', 'Quantity Received', 'Invoice Quantity',
  'Value of goods rec.', 'Invoice amount LC', 'Currency',
];
// MRBR columns that must be present
export const RECEIPTS_EXPECTED_COLUMNS_MRBR = [
  'Invoice Document No.', 'Invoicing Party', 'Name', 'Purchasing Document',
  'Amount', 'Currency', 'Posting Date',
];
// Legacy custom report columns (still supported)
export const RECEIPTS_EXPECTED_COLUMNS = [
  'Invoice Number', 'Supplier Name', 'Invoice Date',
  'Requester Name', 'PO Number', 'Invoice Amount',
];

export function parseReceiptsCSV(rows) {
  const errors = [];
  const parsed = [];

  rows.forEach((rawRow, i) => {
    const row = norm(rawRow);

    // ── Purchasing Document (PO number) ──────────────────────────────────
    // MB5S: "Purchasing Document" | MRBR: "Purchasing Document"
    const ebeln = pick(row,
      'PURCHASING DOCUMENT',                          // MB5S + MRBR
      'PO NUMBER', 'PO_NUMBER', 'PURCHASE ORDER', 'PURCHASE_ORDER',
      'EBELN', 'BESTELLNR');

    // ── Reference Number (invoice document) ──────────────────────────────
    // MRBR: "Invoice Document No."
    const invoiceNum = pick(row,
      'INVOICE DOCUMENT NO.', 'INVOICE DOCUMENT NO',  // MRBR
      'INVOICE NUMBER', 'INVOICE_NUMBER', 'INVOICE NO', 'INVOICE #',
      'BELNR', 'INVOICE');

    const ebelp = pick(row, 'ITEM', 'EBELP', 'PO_ITEM', 'PO ITEM', 'POSITION') || '00010';

    // ── Vendor ───────────────────────────────────────────────────────────
    // MB5S: "Supplier" (vendor ID)  |  MRBR: "Invoicing Party" (ID) + "Name" (name)
    const lifnr = pick(row,
      'INVOICING PARTY',                              // MRBR vendor ID
      'SUPPLIER',                                     // MB5S vendor ID
      'LIFNR', 'VENDOR_ID', 'VENDOR ID', 'VENDOR NO', 'SUPPLIER ID');
    const vendor = pick(row,
      'NAME',                                         // MRBR vendor name
      'SUPPLIER NAME', 'SUPPLIER_NAME',               // custom report
      'VENDOR_NAME', 'NAME1', 'VENDOR NAME', 'VENDOR', 'LIEFERANT')
      .replace(/\s*\([^)]*\)\s*$/, '').trim();

    // ── Amounts ──────────────────────────────────────────────────────────
    // MB5S: "Invoice amount LC"  |  MRBR: "Amount"
    const balanceVal = parseNum(pick(row,
      'INVOICE AMOUNT LC',                            // MB5S
      'AMOUNT',                                       // MRBR
      'INVOICE AMOUNT', 'INVOICE_AMOUNT',
      'BALANCE_VAL', 'BALANCE', 'OPEN_AMOUNT', 'OPEN AMOUNT',
      'WRBTR', 'TOTAL', 'DMBTR'));

    // ── Dates ────────────────────────────────────────────────────────────
    // MRBR: "Posting Date"
    const invoiceDate = parseDate(pick(row,
      'POSTING DATE',                                 // MRBR
      'INVOICE DATE', 'INVOICE_DATE',
      'BLDAT', 'BUDAT', 'BELEGDATUM', 'DOC_DATE'));
    const poDate = parseDate(pick(row,
      'BEDAT', 'PO_DATE', 'PO DATE', 'ORDER_DATE'));

    // ── People ───────────────────────────────────────────────────────────
    // MRBR: "User Name"
    const requester = pick(row,
      'USER NAME',                                    // MRBR
      'REQUESTER NAME', 'REQUESTER_NAME', 'REQUESTER',
      'REQUESTED BY', 'REQUESTOR', 'APPROVER_NAME', 'CURRENT APPROVER');

    // ── Material / description ───────────────────────────────────────────
    const matnr = pick(row, 'MATNR', 'MATERIAL', 'MATERIAL_NO', 'MATERIAL NO');
    const txz01 = pick(row,
      'CONDITION TYPE',                               // MB5S
      'TXZ01', 'DESCRIPTION', 'MATERIAL_DESC', 'SHORT_TEXT', 'TEXT', 'ITEM_DESCRIPTION');

    // ── Quantities ───────────────────────────────────────────────────────
    // MB5S: "Quantity Received" (GR) + "Invoice Quantity" (IR)
    // MRBR: "Quantity" (IR), "Difference Quantity"
    const qtyOrdered = parseNum(pick(row, 'MENGE', 'QTY_ORDERED', 'QTY ORDERED', 'ORDER_QTY'));
    const qtyGR      = parseNum(pick(row,
      'QUANTITY RECEIVED',                            // MB5S
      'QTY_GR', 'GR_QTY', 'GR QTY', 'GOODS_RECEIPT_QTY', 'MENGE_GR'));
    const qtyIR      = parseNum(pick(row,
      'INVOICE QUANTITY',                             // MB5S
      'QUANTITY',                                     // MRBR
      'QTY_IR', 'IR_QTY', 'IR QTY', 'INVOICE_QTY', 'MENGE_IR'));

    // Need at least a Purchasing Document or Invoice Document No.
    const ref = ebeln || invoiceNum;
    if (!ref) { errors.push(`Row ${i + 2}: Missing Purchasing Document or Invoice Document No.`); return; }
    // Use absolute value — SAP may export credits/adjustments as negative amounts
    const absVal = Math.abs(balanceVal);

    // ── Discrepancy type ─────────────────────────────────────────────────
    // MB5S: derive from Quantity Received vs Invoice Quantity
    // MRBR: always IR_WITHOUT_GR (blocked invoices awaiting goods receipt)
    // Custom report: default IR_WITHOUT_GR
    let discType = pick(row, 'DISCREPANCY_TYPE', 'TYPE', 'GR_IR_TYPE');
    if (!discType) {
      if (qtyGR > 0 || qtyIR > 0) {
        discType = (qtyGR - qtyIR) >= 0 ? 'GR_WITHOUT_IR' : 'IR_WITHOUT_GR';
      } else {
        discType = 'IR_WITHOUT_GR';
      }
    } else {
      discType = discType.toUpperCase().replace(/\s/g, '_');
      discType = (discType.startsWith('IR') || discType.includes('BLOCKED')) ? 'IR_WITHOUT_GR' : 'GR_WITHOUT_IR';
    }

    const ageDate = invoiceDate || poDate;

    parsed.push({
      EBELN:               ebeln || invoiceNum,
      EBELP:               ebelp,
      INVOICE_NUM:         invoiceNum,
      LIFNR:               lifnr || 'UNKNOWN',
      VENDOR_NAME:         vendor || lifnr || 'Unknown Supplier',
      BEDAT:               poDate,
      MATNR:               matnr || '—',
      TXZ01:               txz01 || '—',
      REQUESTER:           requester || '—',
      MEINS:               pick(row, 'ORDER UNIT', 'MEINS', 'UOM', 'UNIT') || 'EA',
      QTY_ORDERED:         qtyOrdered,
      QTY_GR:              qtyGR,
      QTY_IR:              qtyIR,
      BALANCE_QTY:         Math.abs(qtyGR - qtyIR),
      BALANCE_VAL:         absVal,
      WAERS:               pick(row, 'CURRENCY', 'WAERS', 'CURR') || 'USD',
      DISCREPANCY_TYPE:    discType,
      FIRST_MOVEMENT_DATE: ageDate,
      DAYS_OPEN:           daysBetween(ageDate),
      SAP_TRANSACTION:     discType === 'IR_WITHOUT_GR' ? 'MRBR' : 'MB5S',
    });
  });

  return {
    data: parsed.sort((a, b) => b.BALANCE_VAL - a.BALANCE_VAL),
    errors,
  };
}
