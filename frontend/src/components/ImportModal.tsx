import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface ImportModalProps {
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

const ImportModal = ({ onClose, onImportComplete }: ImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validTypes.includes(selected.type)) {
      setError('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selected);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data.data);
      onImportComplete(response.data.data.imported);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Import failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const XLSX_lib = XLSX;
    const templateData = [
      {
        'College Name': 'IIT Bombay',
        'Assigned Employee': 'Pravar',
        'Status': 'Upcoming',
        'Visit Date': '2026-07-15',
        'Notes': 'Initial contact made',
        'Follow Up Date': '2026-07-20',
        'Follow Up Notes': 'Send proposal',
      },
    ];

    const worksheet = XLSX_lib.utils.json_to_sheet(templateData);
    const workbook = XLSX_lib.utils.book_new();
    XLSX_lib.utils.book_append_sheet(workbook, worksheet, 'Colleges');

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 30 },
    ];

    XLSX_lib.writeFile(workbook, 'college-outreach-template.xlsx');
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-cream w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-warmgray rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-warmgray">
          <h2 className="text-lg font-bold text-ink">Import from Excel</h2>
          <button
            onClick={onClose}
            className="text-sage hover:text-ink text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 pb-28">
          {/* Template download */}
          <div className="bg-white rounded-2xl p-4 border border-warmgray">
            <p className="text-sm font-medium text-ink mb-1">First time importing?</p>
            <p className="text-xs text-sage mb-3">
              Download the template to make sure your Excel file has the correct column headers.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="w-full border border-forest text-forest font-medium py-2.5 rounded-xl text-sm hover:bg-forest/5 transition-colors"
            >
              Download Template
            </button>
          </div>

          {/* File picker */}
          <div>
            <p className="text-sm font-medium text-ink mb-2">Select your Excel file</p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors
                ${file ? 'border-forest bg-forest/5' : 'border-warmgray hover:border-forest/50'}`}
            >
              <p className="text-3xl mb-2">📂</p>
              {file ? (
                <>
                  <p className="text-sm font-medium text-forest truncate">{file.name}</p>
                  <p className="text-xs text-sage mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Tap to change
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-sage">Tap to select file</p>
                  <p className="text-xs text-sage/70 mt-1">.xlsx or .xls only</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-white rounded-2xl border border-warmgray p-4 space-y-3">
              <p className="text-sm font-bold text-ink">Import Complete</p>
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                  <p className="text-xs text-green-600 mt-1">Imported</p>
                </div>
                <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
                  <p className="text-xs text-amber-600 mt-1">Skipped</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-sage mb-2">Skipped reasons:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          {!result ? (
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full bg-forest hover:bg-forest-dark disabled:bg-forest/40 text-white font-semibold py-3 rounded-xl transition-colors text-base"
            >
              {loading ? 'Importing...' : 'Import Colleges'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3 rounded-xl transition-colors text-base"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;