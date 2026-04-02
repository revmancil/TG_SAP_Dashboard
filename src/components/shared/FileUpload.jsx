import { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function FileUpload({ label, expectedColumns, onData, onClear, hasData }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [fileName, setFileName] = useState(null);

  function parseFile(file) {
    if (!file) return;
    if (!file.name.match(/\.(csv|txt)$/i)) {
      setStatus({ type: 'error', message: 'Please upload a CSV file (.csv or .txt)' });
      return;
    }
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
        onData(results.data, results.meta.fields);
      },
      error: (err) => {
        setStatus({ type: 'error', message: `Parse error: ${err.message}` });
      },
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    parseFile(e.dataTransfer.files[0]);
  }

  function handleClear() {
    setStatus(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-sap-border bg-white p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: drop zone */}
        <div
          className={`flex-1 min-w-[200px] flex flex-col items-center justify-center gap-2 rounded-lg p-4 cursor-pointer transition-colors ${
            dragOver ? 'bg-sap-lightblue border-sap-blue border-2' : 'bg-sap-gray hover:bg-sap-lightblue'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={20} className="text-sap-blue" />
          <div className="text-center">
            <p className="text-xs font-semibold text-sap-text">
              {label}
            </p>
            <p className="text-xs text-sap-subtext mt-0.5">
              Drag & drop or click to browse — CSV format
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => parseFile(e.target.files[0])}
          />
        </div>

        {/* Right: expected columns hint */}
        <div className="text-xs text-sap-subtext max-w-xs">
          <p className="font-semibold text-sap-text mb-1">Expected SAP columns:</p>
          <div className="flex flex-wrap gap-1">
            {expectedColumns.map((col) => (
              <span key={col} className="font-mono bg-sap-gray px-1.5 py-0.5 rounded text-xs">
                {col}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sap-subtext">
            Extra columns are ignored. Column names are case-insensitive.
          </p>
        </div>
      </div>

      {/* Status bar */}
      {status && (
        <div className={`mt-3 flex items-center justify-between gap-2 rounded px-3 py-2 text-xs ${
          status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center gap-1.5">
            {status.type === 'success'
              ? <CheckCircle size={13} />
              : <AlertCircle size={13} />}
            <span>{status.message}</span>
          </div>
          {status.type === 'success' && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-sap-subtext hover:text-red-600 font-medium ml-4"
            >
              <X size={12} /> Revert to sample data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
