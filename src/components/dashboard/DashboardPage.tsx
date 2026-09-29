import React from 'react';
import {
  FileText,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  FolderSync,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Compass,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../state/AppContext';
import { formatHash } from '../../lib/crypto';

export const DashboardPage: React.FC = () => {
  const { state, dispatch, activeJob } = useApp();

  // Metrics calculation
  const totalDocs = state.documents.length;
  const totalStaged = state.stagedComps.length;
  const pendingApproval = state.stagedComps.filter(c => c.status === 'Pending').length;
  const approvedComps = state.stagedComps.filter(c => c.status === 'Approved').length;
  const openQc = state.qcFindings.filter(f => f.status === 'Open').length;
  const todayAuditCount = state.auditLogs.length;

  // Pipeline counts
  const pipelineStages = [
    { label: 'OneDrive Ingested', count: totalDocs, screen: 'intake' as const },
    { label: 'Extracted', count: state.documents.filter(d => d.status === 'Extracted').length, screen: 'review' as const },
    { label: 'Staged in DB', count: totalStaged, screen: 'staging' as const },
    { label: 'Human Approved', count: approvedComps, screen: 'staging' as const },
    { label: 'Excel Model', count: approvedComps > 0 ? 1 : 0, screen: 'excel' as const },
    { label: 'Word Report', count: state.reportSections.filter(s => s.status !== 'Empty').length, screen: 'report' as const },
    { label: 'QC Evaluated', count: state.qcFindings.filter(f => f.status === 'Resolved').length, screen: 'qc' as const },
    { label: 'Final Sign-off', count: 0, screen: 'report' as const },
  ];

  // Comps processed per week data for Recharts
  const chartData = [
    { week: 'W34 (Aug 18)', comps: 14, verified: 12 },
    { week: 'W35 (Aug 25)', comps: 19, verified: 18 },
    { week: 'W36 (Sep 01)', comps: 24, verified: 22 },
    { week: 'W37 (Sep 08)', comps: 31, verified: 29 },
    { week: 'W38 (Sep 15)', comps: 28, verified: 26 },
    { week: 'W39 (Sep 22)', comps: 42, verified: 39 },
    { week: 'W40 (Current)', comps: 38, verified: 36 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Strip / Active Job Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-blue-50/60 to-amber-50/50 border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                ACTIVE PRODUCTION PIPELINE
              </span>
              <span className="text-xs text-gray-500 font-mono">Job {activeJob.code}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeJob.propertyType} — {activeJob.subjectAddress}
            </h1>
            <p className="text-sm text-gray-600">
              {activeJob.cityState} · Client: <strong className="text-gray-800 font-semibold">{activeJob.client}</strong> · Effective Date: <span className="font-mono text-gray-800">{activeJob.effectiveDate}</span> · Due <span className="font-mono text-gray-800">{activeJob.dueDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'START_MILESTONE' })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0F766E] via-[#1D4ED8] to-[#0F766E] text-white text-xs font-semibold hover:shadow-md transition-all active:scale-[0.99]"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Milestone 1 Walkthrough</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Jobs', val: state.jobs.length, sub: 'All portfolios', icon: Layers, color: 'text-slate-700' },
          { label: 'Docs Ingested', val: totalDocs, sub: 'SharePoint sync', icon: FileText, color: 'text-teal-700' },
          { label: 'Comps Staged', val: totalStaged, sub: 'Postgres staging', icon: Database, color: 'text-blue-700' },
          { label: 'Awaiting Approval', val: pendingApproval, sub: 'Human sign-off', icon: Clock, color: 'text-amber-700' },
          { label: 'Open QC Items', val: openQc, sub: '2 critical rules', icon: AlertTriangle, color: 'text-rose-700' },
          { label: 'Audit Entries', val: todayAuditCount, sub: 'SHA-256 chain', icon: History, color: 'text-slate-800' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold text-gray-600">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                  {kpi.val}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controlled Horizontal Pipeline Visual */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Appraisal Production Pipeline</h2>
            <p className="text-xs text-gray-500">
              Live progression from Microsoft Graph intake to USPAP sign-off.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Live Counts</span>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-center min-w-[850px] justify-between relative">
            {/* Connecting Track Line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

            {pipelineStages.map((stage, i) => {
              const isFirst = i === 0;
              const hasItems = stage.count > 0;
              return (
                <button
                  key={i}
                  onClick={() => dispatch({ type: 'SET_SCREEN', payload: stage.screen })}
                  className="flex flex-col items-center group relative z-10 focus:outline-hidden"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all shadow-xs ${
                      hasItems
                        ? 'bg-gradient-to-br from-[#0F766E] to-[#1D4ED8] text-white ring-4 ring-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-300 ring-4 ring-white'
                    }`}
                  >
                    {stage.count}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 mt-2 text-center group-hover:text-teal-700 transition-colors">
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {hasItems ? `${stage.count} records` : 'Queued'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Comps Processed Chart & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Comparable Production Velocity</h2>
              <p className="text-xs text-gray-500">Weekly intake volume vs verified human approvals</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#0F766E]"></span>
                <span className="text-gray-600">Extracted Comps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#1D4ED8]"></span>
                <span className="text-gray-600">Verified & Approved</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEB" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #E7E5E0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="comps" stroke="#0F766E" strokeWidth={2} fillOpacity={1} fill="url(#colorComps)" name="Extracted Comps" />
                <Area type="monotone" dataKey="verified" stroke="#1D4ED8" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" name="Verified Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Activity Feed (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Cryptographic Audit Feed</h2>
                <p className="text-xs text-gray-500">Live SHA-256 chain events</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'audit' })}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 mt-3 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
              {state.auditLogs.slice(-5).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-lg border border-gray-100 hover:border-teal-200 bg-[#FAF9F6] text-xs transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 font-mono text-[11px]">{entry.action}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{entry.timestamp.split(' ')[1]}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-2 leading-relaxed text-[11px]">{entry.details}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 text-[10px] text-gray-500 font-mono">
                    <span>{entry.actor}</span>
                    <span className="text-teal-800" title={entry.hash}>
                      hash: {formatHash(entry.hash, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'qc' })}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Open QC Review Queue ({openQc} items)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
