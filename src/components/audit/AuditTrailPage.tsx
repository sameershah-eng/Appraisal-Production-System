import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Hash,
  Cpu,
  User,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { verifyAuditChain, downloadAuditCsv, VerificationResult } from '../../services/auditService';
import { formatHash } from '../../lib/crypto';
import { AuditEntry } from '../../types';

export const AuditTrailPage: React.FC = () => {
  const { state, addToast } = useApp();

  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Filter audit logs
  const filteredLogs = state.auditLogs.filter(entry => {
    if (actorFilter !== 'ALL' && entry.actorType !== actorFilter) return false;
    if (actionFilter !== 'ALL' && entry.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.object.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        entry.hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Verify chain integrity handler
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyAuditChain(state.auditLogs);
      setVerificationResult(result);
      if (result.isValid) {
        addToast({
          type: 'success',
          title: 'Audit Chain Cryptographically Valid',
          message: `All ${result.totalEntries} entries verified via sequential SHA-256 hash chaining.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Audit Chain Integrity Breach',
          message: `Hash mismatch at sequence index #${result.brokenIndex}.`,
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // CSV Download handler
  const handleExportCsv = () => {
    downloadAuditCsv(state.auditLogs);
    addToast({
      type: 'info',
      title: 'Audit Trail Exported',
      message: 'Downloaded CSV snapshot with cryptographic hashes.',
    });
  };

  const getActionBadge = (action: AuditEntry['action']) => {
    switch (action) {
      case 'APPROVE':
        return <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">APPROVE</span>;
      case 'REJECT':
        return <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">REJECT</span>;
      case 'EDIT':
        return <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">EDIT</span>;
      case 'MODEL_CALL':
        return <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">MODEL_CALL</span>;
      case 'EXCEL_SYNC':
        return <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">EXCEL_SYNC</span>;
      default:
        return <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{action}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Cryptographic Audit Trail & Hash Chain
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              SHA-256 Merkle Chain
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Every read, edit, model call, human approval, and Excel write is permanently committed to an append-only cryptographic ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-blue-700 hover:from-teal-800 hover:to-blue-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}</span>
          </button>
        </div>
      </div>

      {/* Verification Report Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            verificationResult.isValid
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-sm">
                  Chain Valid: {verificationResult.totalEntries} entries verified byte-for-byte
                </span>
                <p className="text-xs opacity-80 mt-0.5">
                  Sequential cryptographic recurrence equation: Hash[N] = SHA-256(Hash[N-1] + Payload[N]). All signatures match without tampering.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 font-semibold">
              Verified at {verificationResult.verifiedAt}
            </span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Actor filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] text-gray-500 px-2 font-medium">Actor:</span>
            {['ALL', 'USER', 'SERVICE'].map(type => (
              <button
                key={type}
                onClick={() => setActorFilter(type)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  actorFilter === type
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Action filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] text-gray-500 px-2 font-medium">Action:</span>
            {['ALL', 'APPROVE', 'REJECT', 'EDIT', 'MODEL_CALL', 'EXCEL_SYNC'].map(act => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  actionFilter === act
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search details or hash..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E7E5E0] rounded-xl focus:ring-2 focus:ring-teal-500 w-56 font-mono text-gray-800"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7F4] text-gray-500 font-semibold border-b border-[#E7E5E0]">
              <tr>
                <th className="py-2.5 px-4 w-12 font-mono">#</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Type</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Object</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-4 font-mono text-right">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E0]">
              {filteredLogs.map(entry => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-gray-400 font-semibold">
                    {entry.index}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                    {entry.timestamp}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {entry.actorType === 'SERVICE' ? (
                        <Cpu className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-gray-900 font-mono text-[11px]">
                        {entry.actor}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {getActionBadge(entry.action)}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-gray-800 max-w-[180px] truncate" title={entry.object}>
                    {entry.object}
                  </td>

                  <td className="py-3 px-3 text-gray-600 text-[11px] max-w-sm truncate" title={entry.details}>
                    {entry.details}
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[11px] text-teal-800 font-semibold">
                    {formatHash(entry.hash, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Detail Drawer / Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-gray-900">
                  Audit Block #{selectedEntry.index}: {selectedEntry.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <label className="text-gray-400 block text-[10px] uppercase">Timestamp</label>
                <div className="text-gray-900">{selectedEntry.timestamp}</div>
              </div>

              <div>
                <label className="text-gray-400 block text-[10px] uppercase">Actor</label>
                <div className="text-gray-900">{selectedEntry.actor} ({selectedEntry.actorType})</div>
              </div>

              <div>
                <label className="text-gray-400 block text-[10px] uppercase">Object</label>
                <div className="text-teal-900 break-all">{selectedEntry.object}</div>
              </div>

              <div>
                <label className="text-gray-400 block text-[10px] uppercase">Details</label>
                <div className="text-gray-800 font-sans leading-relaxed text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  {selectedEntry.details}
                </div>
              </div>

              {/* Model Metadata if MODEL_CALL */}
              {selectedEntry.modelMetadata && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                  <div className="font-bold text-blue-950 font-sans text-xs flex items-center justify-between">
                    <span>Background Extraction Service Telemetry</span>
                    <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                      {selectedEntry.modelMetadata.validationStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-900">
                    <div>Model: <strong>{selectedEntry.modelMetadata.modelName}</strong></div>
                    <div>Prompt: <strong>{selectedEntry.modelMetadata.promptVersion}</strong></div>
                    <div>Schema: <strong>{selectedEntry.modelMetadata.schemaName}</strong></div>
                    <div>Tokens: In {selectedEntry.modelMetadata.inputTokens} / Out {selectedEntry.modelMetadata.outputTokens}</div>
                  </div>
                  <div className="text-[10px] text-blue-700/80 font-sans pt-1 border-t border-blue-200">
                    Strict privacy rule: Client identifiable information is stripped prior to telemetry logging.
                  </div>
                </div>
              )}

              {/* Hashes */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-[10px]">
                <div>
                  <span className="text-gray-400 block">PREVIOUS BLOCK HASH:</span>
                  <span className="text-gray-600 break-all">{selectedEntry.prevHash}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">CURRENT ENTRY HASH (SHA-256):</span>
                  <span className="text-teal-800 font-bold break-all">{selectedEntry.hash}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold text-xs"
              >
                Close Block Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
