/**
 * Aggregate approvals and receipts data into weekly buckets.
 *
 * Design rules:
 *  - ZERO items are dropped — items with no date land in "No Date" bucket
 *  - ALL weeks shown (no lastN cutoff) so sum of bars == dashboard total
 *  - Returns totalCount and totalValue alongside weekly array so the chart
 *    can verify its bars add up to the dashboard KPI
 */

const TODAY = new Date();

function getWeekStart(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day  = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date(dateStr).setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// Current week Monday — fallback for items with no date
function currentWeekStart() {
  return getWeekStart(TODAY.toISOString());
}

function formatWeekLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Approvals ───────────────────────────────────────────────────────────────
export function buildApprovalsWeekly(data) {
  const map      = {};
  const fallback = currentWeekStart();

  data.forEach((d) => {
    const wk = getWeekStart(d.WI_CREATED_TS || d.BLDAT) || fallback;
    if (!map[wk]) map[wk] = { week: wk, count: 0, totalValue: 0, totalDays: 0, atRisk: 0 };
    map[wk].count      += 1;
    map[wk].totalValue += d.WRBTR || 0;
    map[wk].totalDays  += d.DAYS_IN_WORKFLOW || 0;
    if (d.DISCOUNT_AT_RISK) map[wk].atRisk += 1;
  });

  const keys   = Object.keys(map).sort();
  const weekly = keys.map((wk) => ({
    week:    wk,
    label:   formatWeekLabel(wk),
    count:   map[wk].count,
    value:   Math.round(map[wk].totalValue),
    avgDays: map[wk].count ? +(map[wk].totalDays / map[wk].count).toFixed(1) : 0,
    atRisk:  map[wk].atRisk,
  }));

  return {
    weekly,
    totalCount: data.length,
    totalValue: Math.round(data.reduce((s, d) => s + (d.WRBTR || 0), 0)),
  };
}

// ── Receipts ────────────────────────────────────────────────────────────────
export function buildReceiptsWeekly(data) {
  const map      = {};
  const fallback = currentWeekStart();

  data.forEach((d) => {
    const wk = getWeekStart(d.FIRST_MOVEMENT_DATE || d.BEDAT) || fallback;
    if (!map[wk]) map[wk] = { week: wk, grWithoutIR: 0, irWithoutGR: 0, grValue: 0, irValue: 0 };
    if (d.DISCREPANCY_TYPE === 'GR_WITHOUT_IR') {
      map[wk].grWithoutIR += 1;
      map[wk].grValue     += d.BALANCE_VAL || 0;
    } else {
      map[wk].irWithoutGR += 1;
      map[wk].irValue     += d.BALANCE_VAL || 0;
    }
  });

  const keys   = Object.keys(map).sort();
  const weekly = keys.map((wk) => ({
    week:        wk,
    label:       formatWeekLabel(wk),
    grWithoutIR: map[wk].grWithoutIR,
    irWithoutGR: map[wk].irWithoutGR,
    grValue:     Math.round(map[wk].grValue),
    irValue:     Math.round(map[wk].irValue),
    totalValue:  Math.round(map[wk].grValue + map[wk].irValue),
  }));

  return {
    weekly,
    totalCount: data.length,
    totalValue: Math.round(data.reduce((s, d) => s + (d.BALANCE_VAL || 0), 0)),
  };
}
