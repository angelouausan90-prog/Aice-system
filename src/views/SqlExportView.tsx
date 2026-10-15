/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Download, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

export const SqlExportView: React.FC = () => {
  const [schemaText, setSchemaText] = useState<string>('Loading schema...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/database/schema-text')
      .then(res => res.text())
      .then(text => setSchemaText(text))
      .catch(() => setSchemaText('Failed to load SQL schema text.'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(schemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            MySQL Database Schema & XAMPP Deployment Kit
          </h2>
          <p className="text-xs text-slate-500">
            Export relational MySQL/MariaDB schema, seed dataset, and view local Apache/MySQL instructions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied SQL!' : 'Copy SQL Script'}
          </button>
          <button
            onClick={() => handleDownloadFile('aice_franchise_schema.sql', schemaText)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download .SQL File
          </button>
        </div>
      </div>

      {/* Deployment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase mb-1">
            <Database className="w-4 h-4 text-[#E52320]" />
            Relational DB Engine
          </div>
          <div className="text-base font-black text-slate-900">InnoDB (MySQL 8 / MariaDB)</div>
          <p className="text-xs text-slate-500 mt-1">
            Foreign keys, transaction isolation, and utf8mb4_unicode_ci character set.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase mb-1">
            <Terminal className="w-4 h-4 text-blue-600" />
            Local XAMPP Ready
          </div>
          <div className="text-base font-black text-slate-900">phpMyAdmin One-Click Import</div>
          <p className="text-xs text-slate-500 mt-1">
            Create database <code>aice_franchise_system</code> and import schema script.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase mb-1">
            <ExternalLink className="w-4 h-4 text-emerald-600" />
            Security & Authentication
          </div>
          <div className="text-base font-black text-slate-900">Bcrypt password_hash()</div>
          <p className="text-xs text-slate-500 mt-1">
            Strict role access control (Admin, Franchisee, Agent). Zero plaintext credentials.
          </p>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">database/schema.sql</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">12 Production Tables</span>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
          {schemaText}
        </pre>
      </div>
    </div>
  );
};
