/**
 * Maps SAP CSV/Excel export columns → Dashboard 2 GR/IR data structure.
 *
 * Supports exports from:
 *   MB5S  – GR/IR balance report
 *   MRBR  – Blocked invoices (IR without GR)
 *   ME2M  – Open POs by material
 *
 * Also supports the custom Pending Receipts report with columns:
 *   Invoice Number, Supplier Name, Invoice Date, Requester Name,
 *   PO Number, Invoice Amount, Invoice Year, AP Comments, Follow Up
 *   → All rows treated as IR_WITHOUT_GR (invoices pending goods receipt)
 */

const TODAY = new Date();

function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => { out[k.toUpperCase().trim()] = (obj[k] || '').toString().trim(); });
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
  const cleaned = String(str).replace(/[^0-9.\-,]/g, '').replace(/,(?=\d{3})/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d)) return 0;
  return Math.max(0, Math.floor((TODAY - d) / (1000 * 60 * 60 * 24)));
}

export const RECEIPTS_EXPECTED_COLUMNS = [
  'Invoice Number', 'Supplier Name', 'Invoice Date',
  'Requester Name', 'PO Number', 'Invoice Amount',
];

export function parseReceiptsCSV(rows) {
  const errors = [];
  const parsed = [];

  rows.forEach((rawRow, i) => {
    const row = norm(rawRow);

    // ── PO / Invoice reference ───────────────────────────────────────────
    const ebeln = pick(row,
      'PO NUMBER', 'PO_NUMBER', 'PURCHASE ORDER', 'PURCHASE_ORDER',
      'EBELN', 'BESTELLNR');
    const invoiceNum = pick(row,
      'INVOICE NUMBER', 'INVOICE_NUMBER', 'INVOICE NO', 'INVOICE #',
      'BELNR', 'INVOICE');
    const ebelp = pick(row, 'EBELP', 'PO_ITEM', 'PO ITEM', 'ITEM', 'POSITION') || '00010';

    // ── Vendor ───────────────────────────────────────────────────────────
    const vendor = pick(row,
      'SUPPLIER NAME', 'SUPPLIER_NAME', 'SUPPLIER',
      'VENDOR_NAME', 'NAME1', 'VENDOR NAME', 'VENDOR', 'LIEFERANT');
    const lifnr = pick(row,
      'LIFNR', 'VENDOR_ID', 'VENDOR ID', 'VENDOR NO', 'SUPPLIER ID');

    // ── Amounts ──────────────────────────────────────────────────────────
    const balanceVal = parseNum(pick(row,
      'INVOICE AMOUNT', 'INVOICE_AMOUNT',
      'BALANCE_VAL', 'BALANCE', 'OPEN_AMOUNT', 'OPEN AMOUNT',
      'WRBTR', 'AMOUNT', 'TOTAL', 'DMBTR'));

    // ── Dates ────────────────────────────────────────────────────────────
    const invoiceDate = parseDate(pick(row,
      'INVOICE DATE', 'INVOICE_DATE',
      'BLDAT', 'BUDAT', 'POSTING DATE', 'BELEGDATUM', 'DOC_DATE'));
    const poDate = parseDate(pick(row,
      'BEDAT', 'PO_DATE', 'PO DATE', 'ORDER_DATE'));

    // ── People ───────────────────────────────────────────────────────────
    const requester = pick(row,
      'REQUESTER NAME', 'REQUESTER_NAME', 'REQUESTER',
      'REQUESTED BY', 'REQUESTOR', 'APPROVER_NAME', 'CURRENT APPROVER');

    // ── Material / description ───────────────────────────────────────────
    const matnr = pick(row, 'MATNR', 'MATERIAL', 'MATERIAL_NO', 'MATERIAL NO');
    const txz01 = pick(row,
      'TXZ01', 'DESCRIPTION', 'MATERIAL_DESC', 'SHORT_TEXT', 'TEXT', 'ITEM_DESCRIPTION');

    // ── Quantities (may not be present in invoice-level reports) ────────
    const qtyOrdered = parseNum(pick(row, 'MENGE', 'QTY_ORDERED', 'QTY ORDERED', 'ORDER_QTY'));
    const qtyGR      = parseNum(pick(row, 'QTY_GR', 'GR_QTY', 'GR QTY', 'GOODS_RECEIPT_QTY', 'MENGE_GR'));
    const qtyIR      = parseNum(pick(row, 'QTY_IR', 'IR_QTY', 'IR QTY', 'INVOICE_QTY', 'MENGE_IR'));

    // Need at least a PO number or invoice number
    const ref = ebeln || invoiceNum;
    if (!ref) { errors.push(`Row ${i + 2}: Missing PO Number or Invoice Number`); return; }
    if (balanceVal < 0.01) return; // zero-value rows skipped

    // ── Discrepancy type ─────────────────────────────────────────────────
    // If explicit column present use it; if GR/IR qtys available derive it;
    // otherwise default to IR_WITHOUT_GR (invoices pending receipt confirmation)
    let discType = pick(row, 'DISCREPANCY_TYPE', 'TYPE', 'GR_IR_TYPE');
    if (!discType) {
      if (qtyGR > 0 || qtyIR > 0) {
        discType = (qtyGR - qtyIR) >= 0 ? 'GR_WITHOUT_IR' : 'IR_WITHOUT_GR';
      } else {
        discType = 'IR_WITHOUT_GR'; // default for invoice-level reports
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
      MEINS:               pick(row, 'MEINS', 'UOM', 'UNIT') || 'EA',
      QTY_ORDERED:         qtyOrdered,
      QTY_GR:              qtyGR,
      QTY_IR:              qtyIR,
      BALANCE_QTY:         Math.abs(qtyGR - qtyIR),
      BALANCE_VAL:         balanceVal,
      WAERS:               pick(row, 'WAERS', 'CURRENCY', 'CURR') || 'USD',
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
