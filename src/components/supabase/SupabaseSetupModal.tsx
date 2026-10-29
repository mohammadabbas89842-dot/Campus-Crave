import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  Key,
  Globe,
  FileCode,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { getSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();

  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; needsSchema?: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setKey(config.key);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url.trim(), key.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      localStorage.setItem('cb_sb_url', url.trim());
      localStorage.setItem('cb_sb_key', key.trim());
      showToast('Supabase credentials saved! Reloading live connection...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCopySql = () => {
    // Quick copy notification
    fetch('/supabase/schema.sql')
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((sql) => {
        navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        showToast('SQL schema copied to clipboard! Paste it into your Supabase SQL Editor.', 'success');
        setTimeout(() => setCopiedSql(false), 3000);
      })
      .catch(() => {
        // Fallback schema snippet
        const fallback = `-- Run in Supabase SQL editor:
CREATE TABLE IF NOT EXISTS public.food_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  prep_time_minutes INTEGER DEFAULT 8
);`;
        navigator.clipboard.writeText(fallback);
        setCopiedSql(true);
        showToast('SQL schema copied!', 'success');
        setTimeout(() => setCopiedSql(false), 3000);
      });
  };

  const handleClear = () => {
    localStorage.removeItem('cb_sb_url');
    localStorage.removeItem('cb_sb_key');
    setUrl('');
    setKey('');
    setTestResult(null);
    showToast('Supabase credentials cleared. Using local database.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const config = getSupabaseConfig();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Connect Supabase Database</span>
                {config.isConfigured ? (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-semibold px-2 py-0.5 rounded-full">
                    Configured
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-700/60 font-semibold px-2 py-0.5 rounded-full">
                    Setup Required
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400">
                PostgreSQL persistence, Auth, and live WebSocket subscriptions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Quick Setup Checklist */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
            <div className="font-bold text-stone-900 flex items-center justify-between">
              <span>Quick 3-Minute Supabase Setup Guide</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 hover:text-amber-800 flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Open Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-600 leading-relaxed">
              <li>
                Create a free project at <strong>supabase.com</strong>.
              </li>
              <li>
                Open the <strong>SQL Editor</strong> in Supabase and run the provided schema to create the tables.
              </li>
              <li>
                Go to <strong>Project Settings &gt; API</strong> and copy your <strong>Project URL</strong> and <strong>anon / public API Key</strong>.
              </li>
              <li>
                Paste them below and click <strong>"Test &amp; Connect"</strong>.
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg font-bold text-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Schema Copied!' : 'Copy Full SQL Schema Script'}</span>
              </button>
            </div>
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                testResult.success
                  ? testResult.needsSchema
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold">{testResult.success ? 'Connection Valid!' : 'Connection Failed'}</div>
                <div>{testResult.message}</div>
                {testResult.needsSchema && (
                  <div className="text-[11px] font-semibold text-amber-800 pt-1">
                    Tip: Click "Copy Full SQL Schema Script" above and paste it into the Supabase SQL editor to create the tables.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzabcdefghijkl.supabase.co"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400">
                Found in Supabase Dashboard &gt; Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Supabase Anon Public API Key</span>
              </label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400">
                Use the safe public `anon` key (never expose your service_role key to clients).
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              {config.isConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                >
                  Disconnect &amp; Use Local
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing Connection...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Test &amp; Connect Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
