import { useState, useEffect } from 'react';

export default function UploadExcel() {

  const [fileHistory, setFileHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token'); // Grab the user's token
      if (!token) return; // Don't fetch if they aren't logged in

      try {
        const response = await fetch('http://localhost:5000/api/files', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFileHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch upload history:", error);
      }
    };
    fetchHistory();
  }, []);

  // Centralized file processing
  const processFile = (file) => {
    if (file) {
      const isValidFileName = /^scope[1-3]ESG\.(csv|xlsx)$/i.test(file.name);

      if (!isValidFileName) {
        setErrorMessage('Invalid file name. Name must be formatted like "scope1ESG.csv" or "scope3ESG.xlsx".');
        setSelectedFile(file);
      } else {
        setErrorMessage('');
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(null);
      setErrorMessage('');
    }
  };

  // 2. Click-to-upload handler 
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    processFile(file);
  };

  // 3. Drag and Drop Event Handlers
  const handleDragOver = (event) => {
    event.preventDefault(); // Prevents the browser from opening the file in a new tab
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] || null;
    processFile(file);
  };

  // 4. Final Upload Handler
  const handleUpload = async () => {
    if (!selectedFile) return;

    // Package the file into a FormData object
    const formData = new FormData();
    formData.append('file', selectedFile);

    const token = localStorage.getItem('token'); // Get the user's token

    try {
      // Send the file to your backend
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
          // Do NOT set Content-Type; FormData handles it automatically!
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add the real database record (from result.newRecord) to the UI
        setFileHistory([result.newRecord, ...fileHistory]);
        
        setSelectedFile(null);
        alert('File successfully saved to database!');
      } else {
        alert(`Server Error: ${result.message || result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Could not connect to the server.');
    }
  };

  const handleDownload = async (file) => {
  try {
    // We fetch the file from the backend storage
    const response = await fetch(`http://localhost:5000/${file.file_path}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Set the original filename for the download
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Download failed:", error);
    alert("Could not download the file.");
  }
};

  const formattedSize = selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '';

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-slate-950 dark:ring-slate-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Detailed Entry</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Scope-based emissions entry</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
              Use the detailed forms above to enter comprehensive emissions data for each scope category.
            </p>
            <p className="mt-3 text-red-600 dark:text-grey-400 max-w-2xl">
              Fill proper data in file as per given entity inside the scope with proper file format and Name .
              ex:- scope1ESG.csv or scope3ESG.xlsx
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg dark:bg-blue-900/20 dark:border-blue-400">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">📋 Quick Reference</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="font-semibold text-red-600">🔴 Scope 1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Direct emissions from fuel</p>
              <p className="text-xs text-gray-500 mt-2">Fuel Type • Quantity • Unit • Source Type • Date • Location</p>
            </div>
            <div>
              <p className="font-semibold text-yellow-600">🟡 Scope 2</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Purchased electricity</p>
              <p className="text-xs text-gray-500 mt-2">kWh Consumed • Energy Source • Location • Billing Period</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">🔵 Scope 3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Value chain emissions</p>
              <p className="text-xs text-gray-500 mt-2">Transport • Goods • Spend • Travel</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-slate-950 dark:ring-slate-700">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              Upload insights
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Centralized ESG file uploads
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Import supplier emissions, energy usage, or sustainability score data with confidence. We support CSV and XLSX uploads for quick processing and analysis.
            </p>
          </div>

          <div className="rounded-[28px] bg-slate-50 p-6 text-right dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">File type</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">CSV / XLSX</p>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-200">Max size</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">10 MB per file</p>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-10 rounded-[28px] border-2 border-dashed p-10 text-center transition-colors
            ${isDragging
              ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/10'
              : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
            }`}
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[24px] bg-white text-4xl shadow-sm dark:bg-slate-950">
            📤
          </div>
          <div className="mt-8 space-y-3">
            <p className="text-xl font-semibold text-slate-950 dark:text-white">Drag &amp; drop files here</p>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Upload supplier-ledger files, energy statements, or carbon inventory spreadsheets to keep reporting current.
            </p>
          </div>

          <label className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            Select a file
            <input type="file" accept=".csv,.xlsx" className="sr-only" onChange={handleFileChange} />
          </label>

          {/* Show Error Block if validation fails */}
          {errorMessage && selectedFile && (
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-6 text-left shadow-sm dark:border-red-800/50 dark:bg-red-900/20">
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-red-800 dark:text-red-400">Upload Blocked</p>
                <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">Selected file: {selectedFile.name}</p>
              </div>
            </div>
          )}

          {/* Show Success Block & Upload Button if validation passes */}
          {!errorMessage && selectedFile && (
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-gray-100 dark:bg-slate-950 dark:ring-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-950 dark:text-white">{selectedFile.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formattedSize}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Ready to upload
                  </span>
                  <button
                    onClick={handleUpload}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {!selectedFile && (
            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">No file selected yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-slate-950 dark:ring-slate-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Upload history</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Recent uploads and processing status for your team.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {fileHistory.map((file) => (
              <div key={file.id} className="rounded-[28px] border border-slate-200 p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{file.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{file.details}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex items-center gap-3">
                      {/* NEW DOWNLOAD BUTTON */}
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Download File"
                      >
                        📥
                      </button>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${file.status === 'Processed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {file.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{file.uploaded}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl">
          <h3 className="text-xl font-semibold">Upload best practices</h3>
          <div className="mt-6 space-y-5 text-sm leading-6 text-slate-300">
            <div>
              <p className="font-semibold text-white">Use structured headers</p>
              <p>Headers should match the expected supplier, activity, and emissions fields for fast ingestion.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Keep values consistent</p>
              <p>Use standardized units and date formats across all supplier data files.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Validate before upload</p>
              <p>Review totals and key fields for accuracy before submitting to reduce processing delays.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
