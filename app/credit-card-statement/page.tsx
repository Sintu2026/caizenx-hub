'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
}

interface StatementSummary {
  cardNumber?: string;
  statementDate?: string;
  dueDate?: string;
  previousBalance?: number;
  totalPayments?: number;
  totalPurchases?: number;
  totalFees?: number;
  totalInterest?: number;
  newBalance?: number;
  minimumPayment?: number;
  creditLimit?: number;
  availableCredit?: number;
}

interface ParseResult {
  transactions: Transaction[];
  summary: StatementSummary;
  rawTextPreview: string;
  totalPages: number;
}

export default function CreditCardStatementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'summary' | 'categories'>('transactions');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'parse');

      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse statement');
      }

      const data: ParseResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setParsing(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'download');

      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-card-statement-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download Excel file');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return 'N/A';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Aggregate categories for display
  const categoryData = result ? (() => {
    const map = new Map<string, { count: number; total: number }>();
    result.transactions.forEach(tx => {
      const existing = map.get(tx.category) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += tx.type === 'debit' ? tx.amount : -tx.amount;
      map.set(tx.category, existing);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, data]) => ({ category, ...data }));
  })() : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              &larr; Back to Investment Hub
            </Link>
            <div className="h-5 w-px bg-gray-600" />
            <h1 className="text-xl font-bold text-blue-400">
              Credit Card Statement Parser
            </h1>
          </div>
          <span className="text-xs text-gray-500">Caizenx Hub</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            Upload Credit Card Statement (PDF)
          </h2>

          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-blue-400 bg-blue-900/20'
                : file
                ? 'border-green-500 bg-green-900/10'
                : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
              }}
            />

            {file ? (
              <div>
                <svg className="w-12 h-12 mx-auto mb-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-green-400">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {(file.size / 1024).toFixed(1)} KB - Click or drop to replace
                </p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-300">
                  Drag & drop your PDF statement here
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleParse}
              disabled={!file || parsing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {parsing ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Parsing...
                </>
              ) : (
                'Parse Statement'
              )}
            </button>

            {result && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Excel (.xlsx)
                  </>
                )}
              </button>
            )}

            {file && (
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-700">
              <div className="bg-gray-800 p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{result.transactions.length}</p>
                <p className="text-xs text-gray-400 mt-1">Transactions Found</p>
              </div>
              <div className="bg-gray-800 p-4 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(result.summary.totalPurchases)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total Purchases</p>
              </div>
              <div className="bg-gray-800 p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(result.summary.totalPayments)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total Payments</p>
              </div>
              <div className="bg-gray-800 p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{result.totalPages}</p>
                <p className="text-xs text-gray-400 mt-1">Pages Scanned</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {(['transactions', 'summary', 'categories'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900/50'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab === 'transactions' ? `Transactions (${result.transactions.length})` :
                   tab === 'summary' ? 'Statement Summary' :
                   `Categories (${categoryData.length})`}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'transactions' && (
                <div className="overflow-x-auto">
                  {result.transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <p className="text-lg">No transactions detected</p>
                      <p className="text-sm mt-2">
                        The parser could not find transaction data in this PDF. The statement format may not be supported yet.
                      </p>
                      {result.rawTextPreview && (
                        <details className="mt-4 text-left max-w-2xl mx-auto">
                          <summary className="cursor-pointer text-blue-400 text-sm">View extracted text preview</summary>
                          <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto">
                            {result.rawTextPreview}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-700">
                          <th className="pb-2 pr-4">#</th>
                          <th className="pb-2 pr-4">Date</th>
                          <th className="pb-2 pr-4">Description</th>
                          <th className="pb-2 pr-4">Category</th>
                          <th className="pb-2 pr-4">Type</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.transactions.map((tx, i) => (
                          <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                            <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">{tx.date}</td>
                            <td className="py-2 pr-4 text-gray-200 max-w-xs truncate">{tx.description}</td>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                                {tx.category}
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`text-xs font-semibold ${tx.type === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                                {tx.type === 'debit' ? 'DEBIT' : 'CREDIT'}
                              </span>
                            </td>
                            <td className={`py-2 text-right font-mono ${tx.type === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                              {tx.type === 'credit' ? '-' : ''}${tx.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="max-w-lg">
                  <div className="space-y-2">
                    {[
                      ['Card Number', result.summary.cardNumber || 'N/A'],
                      ['Statement Date', result.summary.statementDate || 'N/A'],
                      ['Payment Due Date', result.summary.dueDate || 'N/A'],
                      ['Previous Balance', typeof result.summary.previousBalance === 'number' ? formatCurrency(result.summary.previousBalance) : 'N/A'],
                      ['Total Payments/Credits', formatCurrency(result.summary.totalPayments)],
                      ['Total Purchases', formatCurrency(result.summary.totalPurchases)],
                      ['Total Fees', formatCurrency(result.summary.totalFees)],
                      ['Total Interest', formatCurrency(result.summary.totalInterest)],
                      ['New Balance', typeof result.summary.newBalance === 'number' ? formatCurrency(result.summary.newBalance) : 'N/A'],
                      ['Minimum Payment', typeof result.summary.minimumPayment === 'number' ? formatCurrency(result.summary.minimumPayment) : 'N/A'],
                      ['Credit Limit', typeof result.summary.creditLimit === 'number' ? formatCurrency(result.summary.creditLimit) : 'N/A'],
                    ].map(([label, value], i) => (
                      <div
                        key={label}
                        className={`flex justify-between py-2 px-3 rounded ${i % 2 === 0 ? 'bg-gray-700/30' : ''}`}
                      >
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-200">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="max-w-2xl">
                  {categoryData.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No category data available</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryData.map((cat, i) => {
                        const maxTotal = Math.max(...categoryData.map(c => Math.abs(c.total)));
                        const barWidth = maxTotal > 0 ? (Math.abs(cat.total) / maxTotal) * 100 : 0;
                        return (
                          <div key={cat.category} className={`p-3 rounded ${i % 2 === 0 ? 'bg-gray-700/30' : ''}`}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-3">
                                <span className="text-gray-200 font-medium">{cat.category}</span>
                                <span className="text-xs text-gray-500">{cat.count} transaction{cat.count !== 1 ? 's' : ''}</span>
                              </div>
                              <span className={`font-mono font-medium ${cat.total >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {cat.total >= 0 ? '' : '-'}${Math.abs(cat.total).toFixed(2)}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cat.total >= 0 ? 'bg-blue-500' : 'bg-green-500'}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        {!result && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="font-semibold text-gray-200 mb-3">How it works</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl mb-2 text-blue-400 font-bold">1</div>
                <h4 className="font-medium text-gray-200">Upload PDF</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Upload your credit card statement in PDF format. Most banks provide downloadable PDF statements.
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl mb-2 text-blue-400 font-bold">2</div>
                <h4 className="font-medium text-gray-200">Parse & Preview</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Click Parse to extract transactions, dates, amounts, and categories. Preview the data before downloading.
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl mb-2 text-blue-400 font-bold">3</div>
                <h4 className="font-medium text-gray-200">Download Excel</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Download a real .xlsx Excel file with formatted transactions, summary, and category breakdown sheets.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg text-sm text-blue-300">
              <strong>Supported formats:</strong> Works with most major Canadian and US bank credit card statements (Visa, Mastercard, Amex).
              The parser extracts dates, descriptions, and amounts. Category assignment is automatic.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
