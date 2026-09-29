import React from 'react';
import {
  LayoutDashboard,
  FolderInput,
  FileSearch,
  Database,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  History,
  Network,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { useApp, ScreenType } from '../../state/AppContext';

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();

  const navGroups: {
    title: string;
    items: { id: ScreenType; label: string; icon: React.FC<{ className?: string }> }[];
  }[] = [
    {
      title: 'Production Workflow',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'intake', label: 'Document Intake', icon: FolderInput },
        { id: 'review', label: 'Extraction Review', icon: FileSearch },
        { id: 'staging', label: 'Comp Staging & Dedupe', icon: Database },
      ],
    },
    {
      title: 'Valuation & Reporting',
      items: [
        { id: 'excel', label: 'Excel Valuation Model', icon: FileSpreadsheet },
        { id: 'report', label: 'Word Report Drafting', icon: FileText },
      ],
    },
    {
      title: 'Quality & Governance',
      items: [
        { id: 'qc', label: 'QC Review Queue', icon: ShieldCheck },
        { id: 'audit', label: 'Cryptographic Audit Trail', icon: History },
      ],
    },
    {
      title: 'System Specifications',
      items: [
        { id: 'architecture', label: 'Architecture & Roadmap', icon: Network },
      ],
    },
  ];

  return (
    <aside className="w-68 flex-shrink-0 bg-white border-r border-[#E7E5E0] h-screen sticky top-0 flex flex-col justify-between z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E7E5E0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F766E] via-[#1D4ED8] to-[#F59E0B] flex items-center justify-center text-white shadow-sm font-semibold text-lg tracking-wider">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-gray-900 tracking-tight">Provenance</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Controlled Appraisal OS</p>
            </div>
          </div>
        </div>

        {/* Milestone Walkthrough CTA */}
        <div className="px-3 pt-3">
          <button
            onClick={() => dispatch({ type: 'START_MILESTONE' })}
            className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-teal-50 via-blue-50 to-amber-50 hover:from-teal-100 hover:to-amber-100 border border-teal-200/80 rounded-xl text-xs font-semibold text-teal-950 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-700 group-hover:rotate-45 transition-transform" />
              <span>Milestone 1 Walkthrough</span>
            </div>
            <span className="text-[10px] bg-teal-700 text-white px-1.5 py-0.5 rounded font-mono">
              Live
            </span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-270px)]">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = state.currentScreen === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => dispatch({ type: 'SET_SCREEN', payload: item.id })}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left relative ${
                        isActive
                          ? 'bg-gray-100 text-gray-900 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-gradient-to-b from-[#0F766E] to-[#1D4ED8]" />
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-700' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Human In The Loop Constitutional Guardrail Box */}
      <div className="p-3 border-t border-[#E7E5E0] bg-[#FAF9F6]">
        <div className="p-2.5 rounded-xl border border-[#E7E5E0] bg-white space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
              Governance Policy
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-snug">
            AI is restricted to extraction & formatting.{' '}
            <strong className="text-gray-900 font-semibold">
              AI never selects comps, sets adjustments, or reconciles value.
            </strong>
          </p>
        </div>
      </div>
    </aside>
  );
};
