/**
 * Flexible parser for weekly analysis Excel sheets.
 *
 * Handles common AP weekly report formats:
 *   - Week Ending | Count | Total Amount | Avg Days | ...
 *   - Approver | Week | # Invoices | Total | ...
 *   - Week Of | New | Approved | Pending | $ Value | ...
 *
 * Column names are normalised to UPPERCASE before matching.
 */

function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    out[k.toUpperCase().trim()] = (obj[k] ?? '').toString().trim();
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
  // DD.MM.YYYY
  const dmy = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  // Excel serial
  if (/^\d{5}$/.test(s)) {
    const d = new Date(Math.round((parseFloat(s) - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  // Try native parse for ISO / long-form dates
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

function parseNum(str) {
  if (!str && str !== 0) return 0;
  const cleaned = String(str).replace(/[^0-9.\-,]/g, '').replace(/,(?=\d{3})/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function formatWeekLabel(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Approvals weekly ────────────────────────────────────────────────────────
export function parseApprovalsWeekly(rows) {
  return rows
    .map((rawRow, i) => {
      const row = norm(rawRow);

      const weekDate = parseDate(pick(row,
        'WEEK ENDING', 'WEEK_ENDING', 'WEEK OF', 'WEEK_OF', 'WEEK',
        'PERIOD', 'DATE', 'REPORT DATE', 'REPORT_DATE'));

      const count = parseNum(pick(row,
        '# INVOICES PENDING', '# INVOICES', 'INVOICE COUNT', 'COUNT',
        'PENDING COUNT', 'PENDING', 'NEW', 'TOTAL INVOICES', 'NUM INVOICES',
        'INVOICES'));

      const value = parseNum(pick(row,
        'TOTAL AMOUNT', 'TOTAL_AMOUNT', 'INVOICE VALUE', 'INVOICE_VALUE',
        '$ VALUE', 'VALUE', 'TOTAL', 'AMOUNT', 'SUM', 'GROSS AMOUNT'));

      const avgDays = parseNum(pick(row,
        'AVG DAYS PENDING', 'AVG DAYS', 'AVG_DAYS', 'AVERAGE DAYS',
        'AVERAGE_DAYS', 'DAYS PENDING', 'DAYS_PENDING', 'DAYS IN WORKFLOW',
        'AVG WORKFLOW DAYS'));

      const atRisk = parseNum(pick(row,
        'AT RISK', 'AT_RISK', 'DISCOUNTS AT RISK', 'RISK COUNT',
        'ESCALATED'));

      if (!weekDate && !value && !count) return null;

      return {
        week:    weekDate || `Week-${i + 1}`,
        label:   weekDate ? formatWeekLabel(weekDate) : `Wk ${i + 1}`,
        count:   Math.round(count),
        value:   Math.round(value),
        avgDays: avgDays || 0,
        atRisk:  Math.round(atRisk),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.week.localeCompare(b.week));
}

// ── Receipts weekly ─────────────────────────────────────────────────────────
export function parseReceiptsWeekly(rows) {
  return rows
    .map((rawRow, i) => {
      const row = norm(rawRow);

      const weekDate = parseDate(pick(row,
        'WEEK ENDING', 'WEEK_ENDING', 'WEEK OF', 'WEEK_OF', 'WEEK',
        'PERIOD', 'DATE', 'REPORT DATE', 'REPORT_DATE'));

      const grWithoutIR = parseNum(pick(row,
        'GR W/O IR', 'GR WITHOUT IR', 'GR_WITHOUT_IR', 'GR COUNT',
        'UNVOUCHERED COUNT', 'UNVOUCHERED', 'GOODS RECEIPT COUNT'));

      const irWithoutGR = parseNum(pick(row,
        'IR W/O GR', 'IR WITHOUT GR', 'IR_WITHOUT_GR', 'IR COUNT',
        'BLOCKED COUNT', 'BLOCKED', 'INVOICES PENDING RECEIPT',
        'STILL OPEN', 'OPEN COUNT', 'COUNT', '# POS OPEN', 'PENDING'));

      const grValue = parseNum(pick(row,
        'GR VALUE', 'GR_VALUE', 'UNVOUCHERED VALUE', 'UNVOUCHERED AMOUNT'));

      const irValue = parseNum(pick(row,
        'IR VALUE', 'IR_VALUE', 'BLOCKED VALUE', 'BLOCKED AMOUNT'));

      const totalValue = parseNum(pick(row,
        'TOTAL VALUE', 'TOTAL_VALUE', 'TOTAL AMOUNT', 'TOTAL OPEN',
        '$ VALUE', 'VALUE', 'TOTAL', 'AMOUNT', 'INVOICE AMOUNT',
        'TOTAL INVOICE AMOUNT', 'SUM'));

      if (!weekDate && !totalValue && !irWithoutGR && !grWithoutIR) return null;

      const computedTotal = totalValue || (grValue + irValue);

      return {
        week:        weekDate || `Week-${i + 1}`,
        label:       weekDate ? formatWeekLabel(weekDate) : `Wk ${i + 1}`,
        grWithoutIR: Math.round(grWithoutIR),
        irWithoutGR: Math.round(irWithoutGR),
        grValue:     Math.round(grValue),
        irValue:     Math.round(irValue),
        totalValue:  Math.round(computedTotal),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.week.localeCompare(b.week));
}
