/**
 * Data service — SharePoint REST API backend.
 *
 * When hosted on SharePoint (*.sharepoint.com), data is stored as JSON files
 * in the same document-library folder as index.html.
 *
 * Files created:
 *   dashboard-data-approvals.json
 *   dashboard-data-mrbr.json
 *   dashboard-data-mb5s.json
 *   dashboard-data-pending_receipts.json
 *   dashboard-data-ap_aging.json
 *   dashboard-data-mrbr_resolved.json
 *
 * Falls back to localStorage when not on SharePoint (local dev / file://).
 */

const IS_SHAREPOINT = /sharepoint\.com/i.test(window.location.hostname);

// ── Path helpers ──────────────────────────────────────────────────────────────

function fileUrl(key) {
  const base = window.location.href.split(/[?#]/)[0];
  const dir  = base.substring(0, base.lastIndexOf('/'));
  return `${dir}/dashboard-data-${key}.json`;
}

function serverRelPath(url) {
  return new URL(url).pathname;
}

function currentFolderServerRelPath() {
  const base = window.location.href.split(/[?#]/)[0];
  const dir  = base.substring(0, base.lastIndexOf('/'));
  return new URL(dir).pathname;
}

// ── Form Digest (required for SharePoint write/delete) ────────────────────────

let _digestValue  = null;
let _digestExpiry = 0;

async function getFormDigest() {
  if (_digestValue && Date.now() < _digestExpiry) return _digestValue;
  const res  = await fetch(`${window.location.origin}/_api/contextinfo`, {
    method: 'POST',
    headers: { Accept: 'application/json;odata=verbose' },
    credentials: 'include',
  });
  const json = await res.json();
  _digestValue  = json.d.GetContextWebInformation.FormDigestValue;
  _digestExpiry = Date.now() + 25 * 60 * 1000; // refresh before 30-min expiry
  return _digestValue;
}

// ── SharePoint file I/O ───────────────────────────────────────────────────────

async function spRead(key) {
  try {
    const res = await fetch(fileUrl(key), { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function spWrite(key, data) {
  const digest   = await getFormDigest();
  const folder   = currentFolderServerRelPath();
  const filename = `dashboard-data-${key}.json`;
  const endpoint = `${window.location.origin}/_api/web/GetFolderByServerRelativePath` +
    `(decodedurl='${encodeURIComponent(folder)}')/Files/add(url='${filename}',overwrite=true)`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-RequestDigest': digest,
      Accept: 'application/json;odata=verbose',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`SharePoint write failed (${res.status}): ${text}`);
  }
}

async function spDelete(key) {
  try {
    const digest   = await getFormDigest();
    const filePath = serverRelPath(fileUrl(key));
    await fetch(
      `${window.location.origin}/_api/web/GetFileByServerRelativePath(decodedurl='${encodeURIComponent(filePath)}')`,
      {
        method: 'DELETE',
        headers: { 'X-RequestDigest': digest, 'IF-MATCH': '*' },
        credentials: 'include',
      },
    );
  } catch { /* file may not exist — ignore */ }
}

// ── localStorage fallback (non-SharePoint / dev) ──────────────────────────────

const LS_PFX = 'spdash_';
function lsRead(key)       { try { const v = localStorage.getItem(LS_PFX + key); return v ? JSON.parse(v) : null; } catch { return null; } }
function lsWrite(key, d)   { try { localStorage.setItem(LS_PFX + key, JSON.stringify(d)); } catch {} }
function lsDelete(key)     { try { localStorage.removeItem(LS_PFX + key); } catch {} }

// ── Public dataset API ────────────────────────────────────────────────────────

export const DS = {
  APPROVALS:        'approvals',
  MRBR:             'mrbr',
  MB5S:             'mb5s',
  PENDING_RECEIPTS: 'pending_receipts',
  AP_AGING:         'ap_aging',
};

export async function loadDataset(key) {
  return IS_SHAREPOINT ? spRead(key) : lsRead(key);
}

export async function saveDataset(key, rows) {
  if (IS_SHAREPOINT) return spWrite(key, rows);
  lsWrite(key, rows);
}

export async function deleteDataset(key) {
  if (IS_SHAREPOINT) return spDelete(key);
  lsDelete(key);
}

/**
 * Poll-based "subscription" — checks for updates every 60 s.
 * Returns { unsubscribe() } to match the old Supabase channel API shape.
 */
export function subscribeDataset(key, onRefresh) {
  if (!IS_SHAREPOINT) return { unsubscribe: () => {} };
  const id = setInterval(onRefresh, 60_000);
  return { unsubscribe: () => clearInterval(id) };
}

// ── MRBR Resolved state (stored as JSON array in same folder) ─────────────────

const RESOLVED_KEY = 'mrbr_resolved';

export async function loadResolvedSet() {
  const data = IS_SHAREPOINT ? await spRead(RESOLVED_KEY) : lsRead(RESOLVED_KEY);
  return new Set(Array.isArray(data) ? data : []);
}

export async function markResolved(rowKey) {
  const set = await loadResolvedSet();
  set.add(rowKey);
  const arr = [...set];
  if (IS_SHAREPOINT) await spWrite(RESOLVED_KEY, arr);
  else lsWrite(RESOLVED_KEY, arr);
}

export async function unmarkResolved(rowKey) {
  const set = await loadResolvedSet();
  set.delete(rowKey);
  const arr = [...set];
  if (IS_SHAREPOINT) await spWrite(RESOLVED_KEY, arr);
  else lsWrite(RESOLVED_KEY, arr);
}

export function subscribeResolved(onRefresh) {
  if (!IS_SHAREPOINT) return { unsubscribe: () => {} };
  const id = setInterval(onRefresh, 60_000);
  return { unsubscribe: () => clearInterval(id) };
}
