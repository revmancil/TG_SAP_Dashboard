/**
 * Aggregate approvals and receipts data into weekly buckets for trend charts.
 * Week key = ISO week start (Monday) in YYYY-MM-DD format.
 */

function getWeekStart(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function sortedWeekKeys(map) {
  return Object.keys(map).filter(Boolean).sort();
}

function lastN(arr, n) {
  return arr.slice(-n);
}

// ── Approvals weekly aggregation ────────────────────────────────────────────
export function buildApprovalsWeekly(data, weeks = 12) {
  const map = {};

  data.forEach((d) => {
    const wk = getWeekStart(d.WI_CREATED_TS || d.BLDAT);
    if (!wk) return;
    if (!map[wk]) map[wk] = { week: wk, count: 0, totalValue: 0, totalDays: 0, atRisk: 0 };
    map[wk].count      += 1;
    map[wk].totalValue += d.WRBTR || 0;
    map[wk].totalDays  += d.DAYS_IN_WORKFLOW || 0;
    if (d.DISCOUNT_AT_RISK) map[wk].atRisk += 1;
  });

  const keys = sortedWeekKeys(map);
  return lastN(keys, weeks).map((wk) => ({
    week:     wk,
    label:    formatWeekLabel(wk),
    count:    map[wk].count,
    value:    Math.round(map[wk].totalValue),
    avgDays:  map[wk].count ? +(map[wk].totalDays / map[wk].count).toFixed(1) : 0,
    atRisk:   map[wk].atRisk,
  }));
}

// ── Receipts weekly aggregation ─────────────────────────────────────────────
export function buildReceiptsWeekly(data, weeks = 12) {
  const map = {};

  data.forEach((d) => {
    const wk = getWeekStart(d.FIRST_MOVEMENT_DATE || d.BEDAT);
    if (!wk) return;
    if (!map[wk]) map[wk] = { week: wk, grWithoutIR: 0, irWithoutGR: 0, grValue: 0, irValue: 0 };
    if (d.DISCREPANCY_TYPE === 'GR_WITHOUT_IR') {
      map[wk].grWithoutIR += 1;
      map[wk].grValue     += d.BALANCE_VAL || 0;
    } else {
      map[wk].irWithoutGR += 1;
      map[wk].irValue     += d.BALANCE_VAL || 0;
    }
  });

  const keys = sortedWeekKeys(map);
  return lastN(keys, weeks).map((wk) => ({
    week:       wk,
    label:      formatWeekLabel(wk),
    grWithoutIR: map[wk].grWithoutIR,
    irWithoutGR: map[wk].irWithoutGR,
    grValue:    Math.round(map[wk].grValue),
    irValue:    Math.round(map[wk].irValue),
    totalValue: Math.round(map[wk].grValue + map[wk].irValue),
  }));
}

function formatWeekLabel(iso) {
  // "Apr 7" style from YYYY-MM-DD
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
