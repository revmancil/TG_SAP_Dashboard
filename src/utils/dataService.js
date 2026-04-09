import { supabase } from './supabase';

// Dataset keys — one per report tab
export const DS = {
  APPROVALS:        'approvals',
  MRBR:             'mrbr',
  MB5S:             'mb5s',
  PENDING_RECEIPTS: 'pending_receipts',
  AP_AGING:         'ap_aging',
};

// ── Dataset CRUD ──────────────────────────────────────────────────────────────

export async function loadDataset(key) {
  const { data, error } = await supabase
    .from('dashboard_datasets')
    .select('data')
    .eq('key', key)
    .maybeSingle();
  if (error) { console.error(`loadDataset(${key}):`, error.message); return null; }
  return data?.data ?? null;
}

export async function saveDataset(key, rows) {
  const { error } = await supabase
    .from('dashboard_datasets')
    .upsert({ key, data: rows, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) console.error(`saveDataset(${key}):`, error.message);
}

export async function deleteDataset(key) {
  const { error } = await supabase
    .from('dashboard_datasets')
    .delete()
    .eq('key', key);
  if (error) console.error(`deleteDataset(${key}):`, error.message);
}

// Subscribe to changes on a specific dataset key.
// Returns the channel — call channel.unsubscribe() to clean up.
export function subscribeDataset(key, onRefresh) {
  return supabase
    .channel(`ds_${key}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dashboard_datasets', filter: `key=eq.${key}` },
      () => onRefresh(),   // re-fetch rather than using payload (payload can be large)
    )
    .subscribe();
}

// ── MRBR Resolved state ───────────────────────────────────────────────────────

export async function loadResolvedSet() {
  const { data, error } = await supabase
    .from('mrbr_resolved')
    .select('row_key');
  if (error) { console.error('loadResolvedSet:', error.message); return new Set(); }
  return new Set((data ?? []).map((r) => r.row_key));
}

export async function markResolved(rowKey) {
  const { error } = await supabase
    .from('mrbr_resolved')
    .upsert({ row_key: rowKey, resolved_at: new Date().toISOString() }, { onConflict: 'row_key' });
  if (error) console.error('markResolved:', error.message);
}

export async function unmarkResolved(rowKey) {
  const { error } = await supabase
    .from('mrbr_resolved')
    .delete()
    .eq('row_key', rowKey);
  if (error) console.error('unmarkResolved:', error.message);
}

// Subscribe to resolved changes. Returns channel.
export function subscribeResolved(onRefresh) {
  return supabase
    .channel('mrbr_resolved_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mrbr_resolved' },
      () => onRefresh(),
    )
    .subscribe();
}
