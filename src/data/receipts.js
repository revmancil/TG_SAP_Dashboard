/**
 * Mock SAP data for Dashboard 2: Pending Receipts (GR/IR Reconciliation)
 *
 * Sources:
 *   EKKO  – Purchasing Order Header
 *   EKPO  – Purchasing Order Item
 *   EKBE  – History per Purchasing Document (GR/IR movements)
 *
 * Transaction references for supplemental data:
 *   MRBR  – Release Blocked Invoices       → "IR without GR" items
 *   MB5S  – Display GR/IR Balances         → Unvouchered liabilities
 *   ME2M  – Purchase Orders by Material    → Open PO overview
 *   MR11  – GR/IR Account Maintenance      → Account clearing
 */

const TODAY = new Date('2026-04-02');

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── EKKO – PO Header ─────────────────────────────────────────────────────────
export const EKKO = [
  { EBELN: '4500012301', LIFNR: 'V-10045', VENDOR_NAME: 'Acme Industrial Supply',    BEDAT: daysAgo(30), EKORG: '1000', ZTERM: 'ZB01', BUKRS: '1000' },
  { EBELN: '4500012302', LIFNR: 'V-10078', VENDOR_NAME: 'Global Logistics Inc.',      BEDAT: daysAgo(22), EKORG: '1000', ZTERM: 'ZB03', BUKRS: '1000' },
  { EBELN: '4500012303', LIFNR: 'V-20012', VENDOR_NAME: 'Premier Tech Solutions',     BEDAT: daysAgo(45), EKORG: '1000', ZTERM: 'ZB02', BUKRS: '1000' },
  { EBELN: '4500012304', LIFNR: 'V-30099', VENDOR_NAME: 'Orion Manufacturing Co.',    BEDAT: daysAgo(18), EKORG: '1000', ZTERM: 'ZB03', BUKRS: '1000' },
  { EBELN: '4500012305', LIFNR: 'V-40021', VENDOR_NAME: 'Summit Energy Services',    BEDAT: daysAgo(60), EKORG: '1000', ZTERM: 'ZB04', BUKRS: '1000' },
  { EBELN: '4500012306', LIFNR: 'V-50007', VENDOR_NAME: 'Horizon Consulting Group',  BEDAT: daysAgo(10), EKORG: '1000', ZTERM: 'ZB05', BUKRS: '1000' },
  { EBELN: '4500012307', LIFNR: 'V-60033', VENDOR_NAME: 'Atlas Construction Ltd.',   BEDAT: daysAgo(35), EKORG: '1000', ZTERM: 'ZB03', BUKRS: '1000' },
  { EBELN: '4500012308', LIFNR: 'V-70014', VENDOR_NAME: 'Meridian Raw Materials',    BEDAT: daysAgo(50), EKORG: '1000', ZTERM: 'ZB01', BUKRS: '1000' },
  { EBELN: '4500012309', LIFNR: 'V-80002', VENDOR_NAME: 'Pacific Freight Carriers',  BEDAT: daysAgo(14), EKORG: '1000', ZTERM: 'ZB04', BUKRS: '1000' },
  { EBELN: '4500012310', LIFNR: 'V-90088', VENDOR_NAME: 'Nordic Chemical Corp.',     BEDAT: daysAgo(40), EKORG: '1000', ZTERM: 'ZB01', BUKRS: '1000' },
];

// ── EKPO – PO Item ───────────────────────────────────────────────────────────
// VGABE: 1=GR, 2=Invoice Receipt
export const EKPO = [
  { EBELN: '4500012301', EBELP: '00010', MATNR: 'MAT-5500-A', TXZ01: 'Industrial Pump Assembly',     MENGE: 50,  MEINS: 'EA', NETPR: 1200.00, NETWR:  60000.00, WAERS: 'USD' },
  { EBELN: '4500012301', EBELP: '00020', MATNR: 'MAT-5501-B', TXZ01: 'Hydraulic Filter Set',          MENGE: 200, MEINS: 'EA', NETPR:  185.50, NETWR:  37100.00, WAERS: 'USD' },
  { EBELN: '4500012302', EBELP: '00010', MATNR: 'SVC-7700',   TXZ01: 'Freight – LTL Domestic',        MENGE: 1,   MEINS: 'AU', NETPR: 48000.00, NETWR:  48000.00, WAERS: 'USD' },
  { EBELN: '4500012303', EBELP: '00010', MATNR: 'MAT-3300-X', TXZ01: 'Server Rack Enclosure (42U)',   MENGE: 10,  MEINS: 'EA', NETPR: 8500.00,  NETWR:  85000.00, WAERS: 'USD' },
  { EBELN: '4500012303', EBELP: '00020', MATNR: 'SVC-8800',   TXZ01: 'IT Infrastructure Consulting',  MENGE: 250, MEINS: 'HR', NETPR:  320.00,  NETWR:  80000.00, WAERS: 'USD' },
  { EBELN: '4500012304', EBELP: '00010', MATNR: 'MAT-1100-Z', TXZ01: 'Steel Coil Grade 304',          MENGE: 500, MEINS: 'KG', NETPR:   12.40,  NETWR:   6200.00, WAERS: 'USD' },
  { EBELN: '4500012304', EBELP: '00020', MATNR: 'MAT-1101-Z', TXZ01: 'Aluminum Sheet 3mm',            MENGE: 800, MEINS: 'KG', NETPR:    9.75,  NETWR:   7800.00, WAERS: 'USD' },
  { EBELN: '4500012305', EBELP: '00010', MATNR: 'SVC-9900',   TXZ01: 'Natural Gas Supply – Q2',       MENGE: 1,   MEINS: 'AU', NETPR:245000.00,  NETWR: 245000.00, WAERS: 'USD' },
  { EBELN: '4500012306', EBELP: '00010', MATNR: 'SVC-6600',   TXZ01: 'Management Consulting Retainer',MENGE: 160, MEINS: 'HR', NETPR:  450.00,  NETWR:  72000.00, WAERS: 'USD' },
  { EBELN: '4500012307', EBELP: '00010', MATNR: 'MAT-2200-P', TXZ01: 'Concrete Mix – Grade C30',      MENGE: 1000,MEINS: 'TO', NETPR:   88.00,  NETWR:  88000.00, WAERS: 'USD' },
  { EBELN: '4500012307', EBELP: '00020', MATNR: 'SVC-5500',   TXZ01: 'Site Civil Works – Phase 2',    MENGE: 1,   MEINS: 'AU', NETPR:125000.00,  NETWR: 125000.00, WAERS: 'USD' },
  { EBELN: '4500012308', EBELP: '00010', MATNR: 'MAT-4400-R', TXZ01: 'Copper Rod 8mm',                MENGE: 2000,MEINS: 'KG', NETPR:   14.20,  NETWR:  28400.00, WAERS: 'USD' },
  { EBELN: '4500012308', EBELP: '00020', MATNR: 'MAT-4401-R', TXZ01: 'Nickel Alloy Plate',            MENGE: 500, MEINS: 'KG', NETPR:   38.60,  NETWR:  19300.00, WAERS: 'USD' },
  { EBELN: '4500012309', EBELP: '00010', MATNR: 'SVC-4400',   TXZ01: 'Air Freight – International',   MENGE: 1,   MEINS: 'AU', NETPR: 31500.00,  NETWR:  31500.00, WAERS: 'USD' },
  { EBELN: '4500012310', EBELP: '00010', MATNR: 'MAT-6600-C', TXZ01: 'Caustic Soda – Industrial',     MENGE: 1500,MEINS: 'KG', NETPR:    2.85,  NETWR:   4275.00, WAERS: 'USD' },
  { EBELN: '4500012310', EBELP: '00020', MATNR: 'MAT-6601-C', TXZ01: 'Hydrochloric Acid 32%',         MENGE: 800, MEINS: 'LT', NETPR:    4.10,  NETWR:   3280.00, WAERS: 'USD' },
];

// ── EKBE – History per PO (GR/IR movements) ──────────────────────────────────
// VGABE: 1=Goods Receipt, 2=Invoice Receipt
// BEWTP: E=GR, Q=Subsequent debit/credit, R=Invoice
// Partial receipts and missing invoices are intentional
export const EKBE = [
  // PO 4500012301 – Partial GR, IR posted for full → GR without IR on remaining
  { EBELN: '4500012301', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 30,  DMBTR: 36000.00, BUDAT: daysAgo(25), BELNR: '5000000901' },
  { EBELN: '4500012301', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 30,  DMBTR: 36000.00, BUDAT: daysAgo(24), BELNR: '5105000100' },
  { EBELN: '4500012301', EBELP: '00020', VGABE: '1', BEWTP: 'E', MENGE: 200, DMBTR: 37100.00, BUDAT: daysAgo(20), BELNR: '5000000902' },
  // No IR for item 00020 → GR without IR

  // PO 4500012302 – IR posted before GR → IR without GR (blocked invoice)
  { EBELN: '4500012302', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 1,   DMBTR: 48000.00, BUDAT: daysAgo(15), BELNR: '5105000101' },
  // No GR → IR without GR

  // PO 4500012303 – GR done, IR partially done
  { EBELN: '4500012303', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 10,  DMBTR: 85000.00, BUDAT: daysAgo(40), BELNR: '5000000903' },
  { EBELN: '4500012303', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 6,   DMBTR: 51000.00, BUDAT: daysAgo(38), BELNR: '5105000102' },
  // GR qty 10, IR qty 6 → GR without IR for 4 units (value $34,000)
  { EBELN: '4500012303', EBELP: '00020', VGABE: '2', BEWTP: 'R', MENGE: 250, DMBTR: 80000.00, BUDAT: daysAgo(35), BELNR: '5105000103' },
  // No GR for consulting → IR without GR

  // PO 4500012304 – Both items fully receipted and invoiced
  { EBELN: '4500012304', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 500, DMBTR:  6200.00, BUDAT: daysAgo(15), BELNR: '5000000904' },
  { EBELN: '4500012304', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 500, DMBTR:  6200.00, BUDAT: daysAgo(14), BELNR: '5105000104' },
  { EBELN: '4500012304', EBELP: '00020', VGABE: '1', BEWTP: 'E', MENGE: 800, DMBTR:  7800.00, BUDAT: daysAgo(13), BELNR: '5000000905' },
  { EBELN: '4500012304', EBELP: '00020', VGABE: '2', BEWTP: 'R', MENGE: 800, DMBTR:  7800.00, BUDAT: daysAgo(12), BELNR: '5105000105' },

  // PO 4500012305 – GR posted, IR not yet → large unvouchered liability
  { EBELN: '4500012305', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 1,   DMBTR:245000.00, BUDAT: daysAgo(55), BELNR: '5000000906' },
  // No IR → GR without IR ($245,000 liability)

  // PO 4500012306 – Service entry sheet created, IR done, GR (SES confirmation) pending
  { EBELN: '4500012306', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 160, DMBTR: 72000.00, BUDAT: daysAgo(8),  BELNR: '5105000106' },
  // No GR → IR without GR

  // PO 4500012307 – Partial GR, no IR
  { EBELN: '4500012307', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 600, DMBTR: 52800.00, BUDAT: daysAgo(30), BELNR: '5000000907' },
  // GR qty 600/1000 for concrete, no IR

  // PO 4500012308 – GR done both items, IR done only first
  { EBELN: '4500012308', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 2000,DMBTR: 28400.00, BUDAT: daysAgo(45), BELNR: '5000000908' },
  { EBELN: '4500012308', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 2000,DMBTR: 28400.00, BUDAT: daysAgo(44), BELNR: '5105000107' },
  { EBELN: '4500012308', EBELP: '00020', VGABE: '1', BEWTP: 'E', MENGE: 500, DMBTR: 19300.00, BUDAT: daysAgo(43), BELNR: '5000000909' },
  // No IR for item 00020 → GR without IR ($19,300)

  // PO 4500012309 – IR posted, GR in transit → IR without GR
  { EBELN: '4500012309', EBELP: '00010', VGABE: '2', BEWTP: 'R', MENGE: 1,   DMBTR: 31500.00, BUDAT: daysAgo(10), BELNR: '5105000108' },

  // PO 4500012310 – GR done, IR not yet
  { EBELN: '4500012310', EBELP: '00010', VGABE: '1', BEWTP: 'E', MENGE: 1500,DMBTR:  4275.00, BUDAT: daysAgo(38), BELNR: '5000000910' },
  { EBELN: '4500012310', EBELP: '00020', VGABE: '1', BEWTP: 'E', MENGE: 800, DMBTR:  3280.00, BUDAT: daysAgo(37), BELNR: '5000000911' },
  // No IR for either item
];

// ── Derived dataset ──────────────────────────────────────────────────────────
function daysBetween(dateStr) {
  const d = new Date(dateStr);
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

export function buildReceiptsDataset() {
  const exceptions = [];

  EKPO.forEach((item) => {
    const po = EKKO.find((k) => k.EBELN === item.EBELN);
    if (!po) return;

    const movements = EKBE.filter(
      (e) => e.EBELN === item.EBELN && e.EBELP === item.EBELP
    );

    const grMovements = movements.filter((m) => m.VGABE === '1');
    const irMovements = movements.filter((m) => m.VGABE === '2');

    const qtyGR = grMovements.reduce((s, m) => s + m.MENGE, 0);
    const qtyIR = irMovements.reduce((s, m) => s + m.MENGE, 0);
    const valGR = grMovements.reduce((s, m) => s + m.DMBTR, 0);
    const valIR = irMovements.reduce((s, m) => s + m.DMBTR, 0);

    const qtyOrdered = item.MENGE;
    const balanceQty = qtyGR - qtyIR;
    const balanceVal = valGR - valIR;

    // GR without IR → positive balance
    // IR without GR → negative balance
    if (Math.abs(balanceVal) < 0.01) return; // fully matched

    const firstGR = grMovements.length ? grMovements[0].BUDAT : null;
    const firstIR = irMovements.length ? irMovements[0].BUDAT : null;

    const discrepancyType =
      balanceVal > 0 ? 'GR_WITHOUT_IR' : 'IR_WITHOUT_GR';

    const ageDate = discrepancyType === 'GR_WITHOUT_IR'
      ? (firstGR || po.BEDAT)
      : (firstIR || po.BEDAT);

    exceptions.push({
      EBELN: item.EBELN,
      EBELP: item.EBELP,
      LIFNR: po.LIFNR,
      VENDOR_NAME: po.VENDOR_NAME,
      BEDAT: po.BEDAT,
      MATNR: item.MATNR,
      TXZ01: item.TXZ01,
      MEINS: item.MEINS,
      QTY_ORDERED: qtyOrdered,
      QTY_GR: qtyGR,
      QTY_IR: qtyIR,
      BALANCE_QTY: Math.abs(balanceQty),
      BALANCE_VAL: Math.abs(balanceVal),
      WAERS: item.WAERS,
      DISCREPANCY_TYPE: discrepancyType,
      FIRST_MOVEMENT_DATE: ageDate,
      DAYS_OPEN: daysBetween(ageDate),
      SAP_TRANSACTION: discrepancyType === 'IR_WITHOUT_GR' ? 'MRBR' : 'MB5S',
    });
  });

  return exceptions.sort((a, b) => b.BALANCE_VAL - a.BALANCE_VAL);
}

export function buildVendorSummary(exceptions) {
  const map = {};
  exceptions.forEach((e) => {
    if (!map[e.LIFNR]) {
      map[e.LIFNR] = {
        LIFNR: e.LIFNR,
        VENDOR_NAME: e.VENDOR_NAME,
        GR_WITHOUT_IR: 0,
        IR_WITHOUT_GR: 0,
        TOTAL_OPEN: 0,
        ITEM_COUNT: 0,
      };
    }
    const v = map[e.LIFNR];
    if (e.DISCREPANCY_TYPE === 'GR_WITHOUT_IR') v.GR_WITHOUT_IR += e.BALANCE_VAL;
    else v.IR_WITHOUT_GR += e.BALANCE_VAL;
    v.TOTAL_OPEN += e.BALANCE_VAL;
    v.ITEM_COUNT += 1;
  });
  return Object.values(map).sort((a, b) => b.TOTAL_OPEN - a.TOTAL_OPEN);
}
