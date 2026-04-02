/**
 * Maps SAP CSV export columns → Dashboard 2 GR/IR data structure.
 *
 * Supports exports from:
 *   MB5S  – GR/IR balance report (primary source)
 *   MRBR  – Blocked invoices (IR without GR)
 *   ME2M  – Open POs by material (supplement)
 *
 * A single MB5S export is the easiest — it shows both GR and IR quantities
 * per PO line and calculates the balance automatically.
 */

const TODAY = new Date();

function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => { out[k.toUpperCase().trim()] = (obj[k] || '').trim(); });
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
  const dmy = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  return str;
}

function parseNum(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.\-,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY - d) / (1000 * 60 * 60 * 24)));
}

export const RECEIPTS_EXPECTED_COLUMNS = [
  'EBELN', 'EBELP', 'LIFNR', 'VENDOR_NAME', 'MATNR', 'TXZ01',
  'MENGE', 'MEINS', 'QTY_GR', 'QTY_IR', 'BALANCE_VAL', 'BUDAT',
];

export function parseReceiptsCSV(rows) {
  const errors  = [];
  const parsed  = [];

  rows.forEach((rawRow, i) => {
    const row = norm(rawRow);

    const ebeln = pick(row, 'EBELN', 'PO_NUMBER', 'PO NUMBER', 'PURCHASE_ORDER', 'BESTELLNR');
    const ebelp = pick(row, 'EBELP', 'PO_ITEM', 'PO ITEM', 'ITEM', 'POSITION') || '00010';
    const lifnr = pick(row, 'LIFNR', 'VENDOR_ID', 'VENDOR ID', 'VENDOR NO');
    const vendor = pick(row, 'VENDOR_NAME', 'NAME1', 'VENDOR NAME', 'VENDOR', 'LIEFERANT');
    const matnr  = pick(row, 'MATNR', 'MATERIAL', 'MATERIAL_NO', 'MATERIAL NO');
    const txz01  = pick(row, 'TXZ01', 'DESCRIPTION', 'MATERIAL_DESC', 'SHORT_TEXT', 'TEXT');
    const meins  = pick(row, 'MEINS', 'UOM', 'UNIT', 'BASE_UOM') || 'EA';

    const qtyOrdered = parseNum(pick(row, 'MENGE', 'QTY_ORDERED', 'QTY ORDERED', 'ORDER_QTY', 'ORDERED_QTY'));
    const qtyGR      = parseNum(pick(row, 'QTY_GR', 'GR_QTY', 'GR QTY', 'GOODS_RECEIPT_QTY', 'MENGE_GR', 'DELIVERED_QTY'));
    const qtyIR      = parseNum(pick(row, 'QTY_IR', 'IR_QTY', 'IR QTY', 'INVOICE_QTY', 'MENGE_IR', 'INVOICED_QTY'));

    // Balance value — accept pre-calculated or derive from qty * price
    let balanceVal = parseNum(pick(row, 'BALANCE_VAL', 'BALANCE', 'OPEN_AMOUNT', 'OPEN AMOUNT', 'DMBTR_BALANCE', 'GR_IR_BALANCE'));
    if (!balanceVal) {
      const netpr = parseNum(pick(row, 'NETPR', 'UNIT_PRICE', 'PRICE', 'NET_PRICE'));
      balanceVal  = Math.abs((qtyGR - qtyIR) * netpr);
    }

    const budat = parseDate(pick(row, 'BUDAT', 'POSTING_DATE', 'POSTING DATE', 'GR_DATE', 'DATE', 'BUCHDAT'));
    const bedat = parseDate(pick(row, 'BEDAT', 'PO_DATE', 'PO DATE', 'ORDER_DATE'));

    if (!ebeln) { errors.push(`Row ${i + 2}: Missing PO number (EBELN)`); return; }
    if (Math.abs(balanceVal) < 0.01) return; // fully matched, skip

    // Determine discrepancy type from uploaded data or derive from qty balance
    let discType = pick(row, 'DISCREPANCY_TYPE', 'TYPE', 'GR_IR_TYPE');
    if (!discType) {
      const qtyBalance = qtyGR - qtyIR;
      if (qtyBalance !== 0) {
        discType = qtyBalance > 0 ? 'GR_WITHOUT_IR' : 'IR_WITHOUT_GR';
      } else {
        // Fall back to value sign if provided as signed number
        const rawBal = pick(row, 'BALANCE_VAL', 'BALANCE', 'OPEN_AMOUNT', 'GR_IR_BALANCE');
        discType = parseNum(rawBal) >= 0 ? 'GR_WITHOUT_IR' : 'IR_WITHOUT_GR';
      }
    } else {
      discType = discType.toUpperCase().replace(/\s/g, '_');
      if (discType.includes('IR') && discType.includes('GR') && discType.startsWith('IR')) discType = 'IR_WITHOUT_GR';
      else discType = 'GR_WITHOUT_IR';
    }

    const ageDate = budat || bedat;

    parsed.push({
      EBELN:            ebeln,
      EBELP:            ebelp,
      LIFNR:            lifnr || 'UNKNOWN',
      VENDOR_NAME:      vendor || lifnr || 'Unknown Vendor',
      BEDAT:            bedat,
      MATNR:            matnr || '—',
      TXZ01:            txz01 || matnr || '—',
      MEINS:            meins,
      QTY_ORDERED:      qtyOrdered,
      QTY_GR:           qtyGR,
      QTY_IR:           qtyIR,
      BALANCE_QTY:      Math.abs(qtyGR - qtyIR),
      BALANCE_VAL:      Math.abs(balanceVal),
      WAERS:            pick(row, 'WAERS', 'CURRENCY', 'CURR') || 'USD',
      DISCREPANCY_TYPE: discType,
      FIRST_MOVEMENT_DATE: ageDate,
      DAYS_OPEN:        daysBetween(ageDate),
      SAP_TRANSACTION:  discType === 'IR_WITHOUT_GR' ? 'MRBR' : 'MB5S',
    });
  });

  return {
    data: parsed.sort((a, b) => b.BALANCE_VAL - a.BALANCE_VAL),
    errors,
  };
}
