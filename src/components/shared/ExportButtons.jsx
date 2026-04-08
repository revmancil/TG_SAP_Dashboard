import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Renders "Export: XLSX  CSV" buttons for any detail table.
 *
 * Props:
 *   data      – array of row objects (all currently filtered rows)
 *   filename  – base filename without extension  (e.g. "ap_aging_detail")
 *   columns   – optional [{ key, label }] to rename / reorder columns.
 *               If omitted every key in the first row is used as-is.
 */
export default function ExportButtons({ data, filename, columns }) {
  if (!data?.length) return null;

  function prepareRows() {
    if (!columns?.length) return data;
    return data.map((row) => {
      const out = {};
      columns.forEach(({ key, label }) => { out[label ?? key] = row[key]; });
      return out;
    });
  }

  function exportXLSX() {
    const ws = XLSX.utils.json_to_sheet(prepareRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  function exportCSV() {
    const ws  = XLSX.utils.json_to_sheet(prepareRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a   = Object.assign(document.createElement('a'), { href: url, download: `${filename}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={exportXLSX}
        title="Download as Excel"
        className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded font-medium transition-colors"
      >
        <Download size={11} /> XLSX
      </button>
      <button
        onClick={exportCSV}
        title="Download as CSV"
        className="flex items-center gap-1 text-xs bg-sap-blue hover:bg-sap-darkblue text-white px-2 py-1 rounded font-medium transition-colors"
      >
        <Download size={11} /> CSV
      </button>
    </div>
  );
}
