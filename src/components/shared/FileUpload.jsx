import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function FileUpload({ label, expectedColumns, onData, onClear, hasData }) {
  const inputRef = useRef();
  const [dragOver, setDragOver]     = useState(false);
  const [status, setStatus]         = useState(null);
  const [fileName, setFileName]     = useState(null);
  const [sheets, setSheets]         = useState(null);   // list of sheet names from workbook
  const [workbook, setWorkbook]     = useState(null);   // raw XLSX workbook

  // ── Parse Excel ────────────────────────────────────────────────────────────
  function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        setWorkbook(wb);
        setFileName(file.name);

        if (wb.SheetNames.length === 1) {
          // Only one sheet — use it immediately
          loadSheet(wb, wb.SheetNames[0]);
        } else {
          // Multiple sheets — let user pick
          setSheets(wb.SheetNames);
          setStatus(null);
        }
      } catch (err) {
        setStatus({ type: 'error', message: `Could not read Excel file: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function loadSheet(wb, sheetName) {
    const ws   = wb.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

    if (!rows.length) {
      setStatus({ type: 'error', message: `Sheet "${sheetName}" is empty.` });
      return;
    }

    // SAP often puts report title / date rows above the real headers, causing
    // SheetJS to produce __EMPTY column names.  When that happens, re-read as a
    // raw 2-D array and find the first row that looks like a header (≥3 filled cells).
    const firstKeys = Object.keys(rows[0]);
    const allEmpty  = firstKeys.every((k) => k === '__EMPTY' || /^__EMPTY_\d+$/.test(k));
    if (allEmpty) {
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
      let headerIdx = -1;
      for (let i = 0; i < rawRows.length; i++) {
        const filled = rawRows[i].filter((v) => v && String(v).trim());
        if (filled.length >= 3) { headerIdx = i; break; }
      }
      if (headerIdx >= 0) {
        const headers = rawRows[headerIdx];
        rows = rawRows.slice(headerIdx + 1).map((rowArr) => {
          const obj = {};
          headers.forEach((h, j) => { obj[h || `_COL_${j}`] = rowArr[j] ?? ''; });
          return obj;
        });
      }
    }

    if (!rows.length) {
      setStatus({ type: 'error', message: `Sheet "${sheetName}" is empty.` });
      return;
    }
    setSheets(null);
    setStatus({ type: 'success', message: `${rows.length} rows loaded from sheet "${sheetName}" in ${fileName}` });
    onData(rows);
  }

  // ── Parse CSV ──────────────────────────────────────────────────────────────
  function parseCSV(file) {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (!results.data?.length) {
          setStatus({ type: 'error', message: 'File is empty or could not be parsed.' });
          return;
        }
        setStatus({ type: 'success', message: `${results.data.length} rows loaded from ${file.name}` });
        onData(results.data);
      },
      error: (err) => setStatus({ type: 'error', message: `Parse error: ${err.message}` }),
    });
  }

  // ── Entry point ───────────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return;
    setSheets(null);
    setWorkbook(null);
    setStatus(null);

    const ext = file.name.split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'xlsm', 'xlsb'].includes(ext)) {
      parseExcel(file);
    } else if (['csv', 'txt'].includes(ext)) {
      parseCSV(file);
    } else {
      setStatus({ type: 'error', message: 'Unsupported file type. Please upload an Excel (.xlsx) or CSV file.' });
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleClear() {
    setStatus(null);
    setFileName(null);
    setSheets(null);
    setWorkbook(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-sap-border bg-white p-4 space-y-3">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Drop zone */}
        <div
          className={`flex-1 min-w-[200px] flex flex-col items-center justify-center gap-2 rounded-lg p-4 cursor-pointer transition-colors ${
            dragOver ? 'bg-sap-lightblue border-2 border-sap-blue' : 'bg-sap-gray hover:bg-sap-lightblue'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={20} className="text-sap-blue" />
          <div className="text-center">
            <p className="text-xs font-semibold text-sap-text">{label}</p>
            <p className="text-xs text-sap-subtext mt-0.5">
              Drag & drop or click — Excel (.xlsx) or CSV
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* Expected columns hint */}
        <div className="text-xs text-sap-subtext max-w-xs">
          <p className="font-semibold text-sap-text mb-1">Expected columns (raw data sheet):</p>
          <div className="flex flex-wrap gap-1">
            {expectedColumns.map((col) => (
              <span key={col} className="font-mono bg-sap-gray px-1.5 py-0.5 rounded">{col}</span>
            ))}
          </div>
          <p className="mt-1.5">Extra columns ignored. Names are case-insensitive.</p>
        </div>
      </div>

      {/* Sheet picker (Excel with multiple sheets) */}
      {sheets && (
        <div className="bg-sap-lightblue border border-sap-blue rounded-lg p-3">
          <p className="text-xs font-semibold text-sap-blue mb-2">
            Multiple sheets found in <span className="font-mono">{fileName}</span> — select the raw data sheet:
          </p>
          <div className="flex flex-wrap gap-2">
            {sheets.map((name) => (
              <button
                key={name}
                onClick={() => loadSheet(workbook, name)}
                className="flex items-center gap-1 text-xs bg-white border border-sap-blue text-sap-blue px-3 py-1.5 rounded font-medium hover:bg-sap-blue hover:text-white transition-colors"
              >
                <ChevronRight size={12} />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status bar */}
      {status && (
        <div className={`flex items-center justify-between gap-2 rounded px-3 py-2 text-xs ${
          status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center gap-1.5">
            {status.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            <span>{status.message}</span>
          </div>
          {status.type === 'success' && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-sap-subtext hover:text-red-600 font-medium ml-4 flex-shrink-0"
            >
              <X size={12} /> Revert to sample data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
