/**
 * SPFx-aware data service.
 * Uses SPHttpClient (from the web part context) so SharePoint handles auth
 * and CSRF tokens automatically — no manual form digest needed.
 *
 * Data is stored as JSON files in the configured document library folder.
 * Files: dashboard-data-{key}.json
 *
 * Call initDataService() once from the web part's render() before any component mounts.
 */

import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';

let _client: SPHttpClient;
let _webAbsoluteUrl: string;
let _webServerRelativeUrl: string;
let _dataFolder: string; // e.g. "Shared Documents/AP Dashboard Data"

export function initDataService(
  client: SPHttpClient,
  webAbsoluteUrl: string,
  webServerRelativeUrl: string,
  dataFolder: string,
): void {
  _client = client;
  _webAbsoluteUrl = webAbsoluteUrl;
  _webServerRelativeUrl = webServerRelativeUrl;
  _dataFolder = dataFolder.replace(/^\/|\/$/g, ''); // strip leading/trailing slashes
}

// ── Path helpers ───────────────────────────────────────────────────────────────

function folderServerRelPath(): string {
  return `${_webServerRelativeUrl}/${_dataFolder}`;
}

function fileAbsUrl(key: string): string {
  return `${_webAbsoluteUrl}/${_dataFolder}/dashboard-data-${key}.json`;
}

// ── SharePoint file I/O ────────────────────────────────────────────────────────

async function spRead(key: string): Promise<any> {
  try {
    const res: SPHttpClientResponse = await _client.get(
      fileAbsUrl(key) + `?_=${Date.now()}`, // cache-bust
      SPHttpClient.configurations.v1,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function spWrite(key: string, data: any): Promise<void> {
  const folder = folderServerRelPath();
  const filename = `dashboard-data-${key}.json`;

  // Ensure the folder exists first
  await ensureFolder(folder);

  const endpoint =
    `${_webAbsoluteUrl}/_api/web/GetFolderByServerRelativePath` +
    `(decodedurl='${encodeURIComponent(folder)}')/Files/add(url='${encodeURIComponent(filename)}',overwrite=true)`;

  const options: ISPHttpClientOptions = {
    headers: {
      Accept: 'application/json;odata=verbose',
      'Content-Type': 'application/octet-stream',
    },
    body: JSON.stringify(data),
  };

  const res: SPHttpClientResponse = await _client.post(
    endpoint,
    SPHttpClient.configurations.v1,
    options,
  );

  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status));
    throw new Error(`SharePoint write failed (${res.status}): ${text}`);
  }
}

async function spDelete(key: string): Promise<void> {
  try {
    const filePath = `${folderServerRelPath()}/dashboard-data-${key}.json`;
    await _client.fetch(
      `${_webAbsoluteUrl}/_api/web/GetFileByServerRelativePath(decodedurl='${encodeURIComponent(filePath)}')`,
      SPHttpClient.configurations.v1,
      { method: 'DELETE', headers: { 'IF-MATCH': '*' } },
    );
  } catch { /* file may not exist */ }
}

async function ensureFolder(serverRelPath: string): Promise<void> {
  try {
    // Try to get the folder — if it exists we're done
    const checkRes = await _client.get(
      `${_webAbsoluteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${encodeURIComponent(serverRelPath)}')`,
      SPHttpClient.configurations.v1,
    );
    if (checkRes.ok) return;

    // Create it
    await _client.post(
      `${_webAbsoluteUrl}/_api/web/folders`,
      SPHttpClient.configurations.v1,
      {
        headers: { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose' },
        body: JSON.stringify({ ServerRelativeUrl: serverRelPath }),
      },
    );
  } catch { /* best-effort */ }
}

// ── Public dataset API (mirrors dataService.js interface) ──────────────────────

export const DS = {
  APPROVALS:        'approvals',
  MRBR:             'mrbr',
  MB5S:             'mb5s',
  PENDING_RECEIPTS: 'pending_receipts',
  AP_AGING:         'ap_aging',
} as const;

export async function loadDataset(key: string): Promise<any> {
  return spRead(key);
}

export async function saveDataset(key: string, rows: any): Promise<void> {
  return spWrite(key, rows);
}

export async function deleteDataset(key: string): Promise<void> {
  return spDelete(key);
}

export function subscribeDataset(key: string, onRefresh: () => void): { unsubscribe: () => void } {
  const id = setInterval(onRefresh, 60_000);
  return { unsubscribe: () => clearInterval(id) };
}

// ── MRBR Resolved set ──────────────────────────────────────────────────────────

const RESOLVED_KEY = 'mrbr_resolved';

export async function loadResolvedSet(): Promise<Set<string>> {
  const data = await spRead(RESOLVED_KEY);
  return new Set<string>(Array.isArray(data) ? data : []);
}

export async function markResolved(rowKey: string): Promise<void> {
  const set = await loadResolvedSet();
  set.add(rowKey);
  await spWrite(RESOLVED_KEY, [...set]);
}

export async function unmarkResolved(rowKey: string): Promise<void> {
  const set = await loadResolvedSet();
  set.delete(rowKey);
  await spWrite(RESOLVED_KEY, [...set]);
}

export function subscribeResolved(onRefresh: () => void): { unsubscribe: () => void } {
  const id = setInterval(onRefresh, 60_000);
  return { unsubscribe: () => clearInterval(id) };
}
