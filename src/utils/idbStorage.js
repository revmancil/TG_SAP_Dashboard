/**
 * IndexedDB helpers for large datasets that exceed localStorage's ~5 MB limit.
 */
const DB_NAME = 'sap_ap_dashboard';
const STORE   = 'datasets';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE);
    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror    = (e) => reject(e.target.error);
  });
}

export async function idbSave(key, data) {
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(data, key);
      tx.oncomplete = res;
      tx.onerror    = (e) => rej(e.target.error);
    });
  } catch (err) {
    console.warn('idbSave failed:', err);
  }
}

export async function idbLoad(key) {
  try {
    const db = await openDB();
    return await new Promise((res, rej) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = (e) => res(e.target.result ?? null);
      req.onerror   = (e) => rej(e.target.error);
    });
  } catch {
    return null;
  }
}

export async function idbDelete(key) {
  try {
    const db = await openDB();
    await new Promise((res) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = res;
    });
  } catch {}
}
