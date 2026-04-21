/**
 * Mock SAP data for Dashboard 1: Pending Approvals
 *
 * Sources:
 *   SWWUSERWI  – Workflow work item to user assignment
 *   RBKP       – Invoice Receipt header (Logistics Invoice Verification)
 *   USR21      – User master address assignment (mapped to display names)
 *
 * To refresh with live data use SAP transaction:
 *   SWI2_FREQ  – Work items by task / agent (workflow reporting)
 *   FBL1N      – Vendor line-item display (supplement for invoice detail)
 */

// ── USR21 / HR Name mapping ─────────────────────────────────────────────────
export const USERS = {
  MWILSON:  { fullName: 'Marcus Wilson',   email: 'mwilson@corp.com',   dept: 'Finance' },
  JPARKER:  { fullName: 'Julia Parker',    email: 'jparker@corp.com',   dept: 'Finance' },
  RNGUYEN:  { fullName: 'Robert Nguyen',   email: 'rnguyen@corp.com',   dept: 'Procurement' },
  SLOMBARD: { fullName: 'Sophie Lombard',  email: 'slombard@corp.com',  dept: 'Finance' },
  DCHANG:   { fullName: 'David Chang',     email: 'dchang@corp.com',    dept: 'Operations' },
  ASMITH:   { fullName: 'Alice Smith',     email: 'asmith@corp.com',    dept: 'Finance' },
  BKOWALSKI:{ fullName: 'Brian Kowalski',  email: 'bkowalski@corp.com', dept: 'Procurement' },
  LFERNANDEZ:{ fullName: 'Lara Fernandez', email: 'lfernandez@corp.com',dept: 'Finance' },
};

// ── RBKP – Invoice Header ───────────────────────────────────────────────────
// BELNR=Doc#, GJAHR=Fiscal Year, LIFNR=Vendor, WRBTR=Gross Amount,
// ZTERM=Payment Terms, BLDAT=Invoice Date, BUDAT=Posting Date
const TODAY = new Date('2026-04-02');

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Payment terms: code → { description, discountDays, discountPct, netDays }
export const PAYMENT_TERMS = {
  ZB01: { description: '2/10 Net 30',  discountDays: 10, discountPct: 2.0, netDays: 30 },
  ZB02: { description: '1/15 Net 45',  discountDays: 15, discountPct: 1.0, netDays: 45 },
  ZB03: { description: 'Net 30',       discountDays: null, discountPct: 0,  netDays: 30 },
  ZB04: { description: '3/5 Net 20',   discountDays: 5,  discountPct: 3.0, netDays: 20 },
  ZB05: { description: 'Net 60',       discountDays: null, discountPct: 0,  netDays: 60 },
};

export const RBKP = [
  { BELNR: '5105000123', GJAHR: 2026, LIFNR: 'V-10045', VENDOR_NAME: 'Acme Industrial Supply',    WRBTR: 142500.00, WAERS: 'USD', ZTERM: 'ZB01', BLDAT: daysAgo(8),  BUDAT: daysAgo(8)  },
  { BELNR: '5105000124', GJAHR: 2026, LIFNR: 'V-10078', VENDOR_NAME: 'Global Logistics Inc.',      WRBTR:  89300.50, WAERS: 'USD', ZTERM: 'ZB04', BLDAT: daysAgo(4),  BUDAT: daysAgo(4)  },
  { BELNR: '5105000125', GJAHR: 2026, LIFNR: 'V-20012', VENDOR_NAME: 'Premier Tech Solutions',     WRBTR: 210000.00, WAERS: 'USD', ZTERM: 'ZB02', BLDAT: daysAgo(12), BUDAT: daysAgo(12) },
  { BELNR: '5105000126', GJAHR: 2026, LIFNR: 'V-30099', VENDOR_NAME: 'Orion Manufacturing Co.',    WRBTR:  55750.00, WAERS: 'USD', ZTERM: 'ZB03', BLDAT: daysAgo(2),  BUDAT: daysAgo(2)  },
  { BELNR: '5105000127', GJAHR: 2026, LIFNR: 'V-10045', VENDOR_NAME: 'Acme Industrial Supply',    WRBTR:  98400.00, WAERS: 'USD', ZTERM: 'ZB01', BLDAT: daysAgo(6),  BUDAT: daysAgo(6)  },
  { BELNR: '5105000128', GJAHR: 2026, LIFNR: 'V-40021', VENDOR_NAME: 'Summit Energy Services',    WRBTR: 315000.00, WAERS: 'USD', ZTERM: 'ZB04', BLDAT: daysAgo(3),  BUDAT: daysAgo(3)  },
  { BELNR: '5105000129', GJAHR: 2026, LIFNR: 'V-50007', VENDOR_NAME: 'Horizon Consulting Group',  WRBTR:  67200.00, WAERS: 'USD', ZTERM: 'ZB05', BLDAT: daysAgo(15), BUDAT: daysAgo(15) },
  { BELNR: '5105000130', GJAHR: 2026, LIFNR: 'V-20012', VENDOR_NAME: 'Premier Tech Solutions',    WRBTR: 183600.00, WAERS: 'USD', ZTERM: 'ZB02', BLDAT: daysAgo(7),  BUDAT: daysAgo(7)  },
  { BELNR: '5105000131', GJAHR: 2026, LIFNR: 'V-60033', VENDOR_NAME: 'Atlas Construction Ltd.',   WRBTR:  41000.00, WAERS: 'USD', ZTERM: 'ZB03', BLDAT: daysAgo(1),  BUDAT: daysAgo(1)  },
  { BELNR: '5105000132', GJAHR: 2026, LIFNR: 'V-70014', VENDOR_NAME: 'Meridian Raw Materials',    WRBTR: 520000.00, WAERS: 'USD', ZTERM: 'ZB01', BLDAT: daysAgo(11), BUDAT: daysAgo(11) },
  { BELNR: '5105000133', GJAHR: 2026, LIFNR: 'V-80002', VENDOR_NAME: 'Pacific Freight Carriers',  WRBTR:  32750.00, WAERS: 'USD', ZTERM: 'ZB04', BLDAT: daysAgo(5),  BUDAT: daysAgo(5)  },
  { BELNR: '5105000134', GJAHR: 2026, LIFNR: 'V-30099', VENDOR_NAME: 'Orion Manufacturing Co.',   WRBTR: 278000.00, WAERS: 'USD', ZTERM: 'ZB02', BLDAT: daysAgo(9),  BUDAT: daysAgo(9)  },
  { BELNR: '5105000135', GJAHR: 2026, LIFNR: 'V-90088', VENDOR_NAME: 'Nordic Chemical Corp.',     WRBTR: 156000.00, WAERS: 'USD', ZTERM: 'ZB01', BLDAT: daysAgo(3),  BUDAT: daysAgo(3)  },
  { BELNR: '5105000136', GJAHR: 2026, LIFNR: 'V-10045', VENDOR_NAME: 'Acme Industrial Supply',   WRBTR:  73500.00, WAERS: 'USD', ZTERM: 'ZB04', BLDAT: daysAgo(14), BUDAT: daysAgo(14) },
  { BELNR: '5105000137', GJAHR: 2026, LIFNR: 'V-40021', VENDOR_NAME: 'Summit Energy Services',   WRBTR: 445000.00, WAERS: 'USD', ZTERM: 'ZB01', BLDAT: daysAgo(2),  BUDAT: daysAgo(2)  },
];

// ── SWWUSERWI – Workflow work item assignments ──────────────────────────────
// WI_ID, WI_RH_TASK (task type), WI_STAT (READY/SELECTED/IN_PROCESS),
// WI_CREATED_TS (created timestamp), ACTUAL_AGENT (current approver user id)
// Linked to RBKP via object key OBJKEY = BELNR+GJAHR
export const SWWUSERWI = [
  { WI_ID: 'WI-00445231', BELNR: '5105000123', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(8),  ACTUAL_AGENT: 'MWILSON'   },
  { WI_ID: 'WI-00445232', BELNR: '5105000124', WI_RH_TASK: 'TS20000113', WI_STAT: 'IN_PROCESS',  WI_CREATED_TS: daysAgo(4),  ACTUAL_AGENT: 'JPARKER'   },
  { WI_ID: 'WI-00445233', BELNR: '5105000125', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(12), ACTUAL_AGENT: 'RNGUYEN'   },
  { WI_ID: 'WI-00445234', BELNR: '5105000126', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(2),  ACTUAL_AGENT: 'MWILSON'   },
  { WI_ID: 'WI-00445235', BELNR: '5105000127', WI_RH_TASK: 'TS20000113', WI_STAT: 'IN_PROCESS',  WI_CREATED_TS: daysAgo(6),  ACTUAL_AGENT: 'SLOMBARD'  },
  { WI_ID: 'WI-00445236', BELNR: '5105000128', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(3),  ACTUAL_AGENT: 'DCHANG'    },
  { WI_ID: 'WI-00445237', BELNR: '5105000129', WI_RH_TASK: 'TS20000114', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(15), ACTUAL_AGENT: 'RNGUYEN'   },
  { WI_ID: 'WI-00445238', BELNR: '5105000130', WI_RH_TASK: 'TS20000113', WI_STAT: 'IN_PROCESS',  WI_CREATED_TS: daysAgo(7),  ACTUAL_AGENT: 'JPARKER'   },
  { WI_ID: 'WI-00445239', BELNR: '5105000131', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(1),  ACTUAL_AGENT: 'ASMITH'    },
  { WI_ID: 'WI-00445240', BELNR: '5105000132', WI_RH_TASK: 'TS20000114', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(11), ACTUAL_AGENT: 'BKOWALSKI' },
  { WI_ID: 'WI-00445241', BELNR: '5105000133', WI_RH_TASK: 'TS20000113', WI_STAT: 'IN_PROCESS',  WI_CREATED_TS: daysAgo(5),  ACTUAL_AGENT: 'SLOMBARD'  },
  { WI_ID: 'WI-00445242', BELNR: '5105000134', WI_RH_TASK: 'TS20000114', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(9),  ACTUAL_AGENT: 'LFERNANDEZ'},
  { WI_ID: 'WI-00445243', BELNR: '5105000135', WI_RH_TASK: 'TS20000113', WI_STAT: 'IN_PROCESS',  WI_CREATED_TS: daysAgo(3),  ACTUAL_AGENT: 'MWILSON'   },
  { WI_ID: 'WI-00445244', BELNR: '5105000136', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(14), ACTUAL_AGENT: 'DCHANG'    },
  { WI_ID: 'WI-00445245', BELNR: '5105000137', WI_RH_TASK: 'TS20000113', WI_STAT: 'READY',       WI_CREATED_TS: daysAgo(2),  ACTUAL_AGENT: 'BKOWALSKI' },
];

// ── Derived / computed dataset ──────────────────────────────────────────────
function daysBetween(dateStr) {
  const d = new Date(dateStr);
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

function discountDeadline(invoice) {
  const terms = PAYMENT_TERMS[invoice.ZTERM];
  if (!terms || !terms.discountDays) return null;
  const baseDate = new Date(invoice.BLDAT);
  baseDate.setDate(baseDate.getDate() + terms.discountDays);
  return baseDate.toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.floor((d - TODAY) / (1000 * 60 * 60 * 24));
}

export function buildApprovalsDataset() {
  return SWWUSERWI.map((wi) => {
    const invoice = RBKP.find((r) => r.BELNR === wi.BELNR);
    const user = USERS[wi.ACTUAL_AGENT] || { fullName: wi.ACTUAL_AGENT, dept: 'Unknown' };
    const daysInWF = daysBetween(wi.WI_CREATED_TS);
    const discDeadline = discountDeadline(invoice);
    const daysToDiscount = daysUntil(discDeadline);
    const terms = PAYMENT_TERMS[invoice.ZTERM];
    const discountAmount = terms?.discountPct
      ? (invoice.WRBTR * terms.discountPct) / 100
      : 0;

    let agingBucket;
    if (daysInWF <= 5) agingBucket = '0–5 days';
    else if (daysInWF <= 10) agingBucket = '6–10 days';
    else agingBucket = '10+ days';

    return {
      WI_ID: wi.WI_ID,
      BELNR: invoice.BELNR,
      LIFNR: invoice.LIFNR,
      VENDOR_NAME: invoice.VENDOR_NAME,
      WRBTR: invoice.WRBTR,
      WAERS: invoice.WAERS,
      ZTERM: invoice.ZTERM,
      ZTERM_DESC: terms?.description || invoice.ZTERM,
      BLDAT: invoice.BLDAT,
      WI_STAT: wi.WI_STAT,
      WI_CREATED_TS: wi.WI_CREATED_TS,
      APPROVER_ID: wi.ACTUAL_AGENT,
      APPROVER_NAME: user.fullName,
      APPROVER_DEPT: user.dept,
      DAYS_IN_WORKFLOW: daysInWF,
      AGING_BUCKET: agingBucket,
      DISCOUNT_DEADLINE: discDeadline,
      DAYS_TO_DISCOUNT: daysToDiscount,
      DISCOUNT_AMOUNT: discountAmount,
      DISCOUNT_AT_RISK: daysToDiscount !== null && daysToDiscount < 5,
    };
  }).sort((a, b) => b.WRBTR - a.WRBTR); // highest value first
}
