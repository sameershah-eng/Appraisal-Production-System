import React, { useState } from 'react';
import {
  Network,
  Shield,
  Layers,
  Server,
  Cloud,
  Database,
  Lock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Cpu,
  MonitorCheck,
  FileSpreadsheet,
  GitBranch,
} from 'lucide-react';

interface ArchNode {
  id: string;
  name: string;
  category: 'Ingestion' | 'Compute' | 'Storage' | 'Execution' | 'Security';
  responsibility: string;
  securityBoundary: string;
  protocols: string;
}

export const ArchitecturePage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null);

  const nodes: ArchNode[] = [
    {
      id: 'graph',
      name: 'Microsoft Graph API',
      category: 'Ingestion',
      responsibility: 'Delta synchronization of appraisal folder trees, raw PDF deeds, scanned leases, and photo exhibits.',
      securityBoundary: 'OAuth 2.0 app-only authorization with SharePoint site-scoped RBAC.',
      protocols: 'HTTPS REST / JSON Delta Tokens',
    },
    {
      id: 'orchestrator',
      name: 'LangGraph Orchestrator',
      category: 'Compute',
      responsibility: 'State machine workflow engine with durable checkpoints for resilient extraction, OCR retries, and pipeline progression.',
      securityBoundary: 'Ephemeral state instances deployed in isolated zero-trust containers.',
      protocols: 'gRPC / JSON State Serialization',
    },
    {
      id: 'claude',
      name: 'Structured LLM Service',
      category: 'Compute',
      responsibility: 'Strict Pydantic schema extraction (RealEstateDeedSchema_v3) and coordinate grounding (page/paragraph tokens).',
      securityBoundary: 'Enterprise zero-data retention (ZDR) tier. Raw client data is not logged in prompt caches.',
      protocols: 'HTTPS API / JSON Schema',
    },
    {
      id: 'fastapi',
      name: 'FastAPI / MCP Tool Cluster',
      category: 'Compute',
      responsibility: 'Normalized APN parsing, county geocoding, parcel boundary distance calculation, and mathematical assertions.',
      securityBoundary: 'Mutual TLS (mTLS) with internal microservice mesh token auth.',
      protocols: 'Model Context Protocol (MCP) / REST',
    },
    {
      id: 'supabase',
      name: 'Supabase PostgreSQL & PostGIS',
      category: 'Storage',
      responsibility: 'Staged comp repository, spatial parcel queries, and strict Row-Level Security (RLS) enforcing certified appraiser approvals.',
      securityBoundary: 'Row-Level Security (RLS) with AES-256 transparent data encryption at rest.',
      protocols: 'PostgreSQL Wire / PostGIS Spatial',
    },
    {
      id: 'win365',
      name: 'Windows 365 Cloud PC Runner',
      category: 'Execution',
      responsibility: 'Native Excel 365 execution, formula SHA-256 pre/post snapshots, and OpenXML Word report compilation.',
      securityBoundary: 'Dedicated Azure Cloud PC VM with isolated process sandbox and signed macro certificates.',
      protocols: 'WinRM / .NET OpenXML SDK / PowerShell',
    },
    {
      id: 'appsheet',
      name: 'AppSheet QC Governance Engine',
      category: 'Security',
      responsibility: 'Deterministic rule evaluations, specialist review queues, and transmittal readiness threshold enforcement.',
      securityBoundary: 'Entra ID SSO with granular role claims (Appraiser, Reviewer, Admin).',
      protocols: 'REST / Google Workspace Connectors',
    },
    {
      id: 'entra',
      name: 'Microsoft Entra ID',
      category: 'Security',
      responsibility: 'Centralized identity provider managing appraiser licensing attributes, MAI designations, and MFA tokens.',
      securityBoundary: 'Conditional Access Policies enforcing compliant Intune devices.',
      protocols: 'SAML 2.0 / OpenID Connect',
    },
  ];

  // 16-Week Phase Timeline Data
  const timelinePhases = [
    { name: 'Phase 1: Discovery & Architecture', startWeek: 1, endWeek: 2, status: 'Completed', color: 'from-teal-600 to-teal-700' },
    { name: 'Phase 2: Milestone 1 - Deed Pipeline & Win365 Runner', startWeek: 3, endWeek: 5, status: 'Active (Current)', color: 'from-blue-600 to-teal-600' },
    { name: 'Phase 3: Milestone 2 - Rent & Expense Extraction', startWeek: 6, endWeek: 8, status: 'Scheduled', color: 'from-slate-400 to-slate-500' },
    { name: 'Phase 4: Milestone 3 - Word Report OpenXML Engine', startWeek: 9, endWeek: 11, status: 'Scheduled', color: 'from-slate-400 to-slate-500' },
    { name: 'Phase 5: Milestone 4 - AppSheet QC & Specialist Queues', startWeek: 12, endWeek: 13, status: 'Scheduled', color: 'from-slate-400 to-slate-500' },
    { name: 'Phase 6: Hardening, USPAP Audit & Acceptance', startWeek: 14, endWeek: 15, status: 'Scheduled', color: 'from-slate-400 to-slate-500' },
    { name: 'Phase 7: Production Warranty & Go-Live', startWeek: 16, endWeek: 16, status: 'Scheduled', color: 'from-slate-400 to-slate-500' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Enterprise System Architecture & Roadmap
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              SOC 2 Type II · Zero-Trust Baseline
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Component topology, security boundaries, and 16-week production delivery milestones.
          </p>
        </div>
      </div>

      {/* Interactive System Diagram */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Distributed Microservice Topology</h2>
            <p className="text-xs text-gray-500">Hover or click any node to inspect security perimeter & protocols</p>
          </div>
          <span className="text-xs font-mono text-gray-400">8 Integrated Subsystems</span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                onMouseEnter={() => setSelectedNode(node)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-50 to-blue-50 border-teal-400 ring-2 ring-teal-200 shadow-md scale-[1.02]'
                    : 'bg-[#FAF9F6] border-gray-200 hover:border-teal-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-semibold">
                    {node.category}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <h3 className="font-bold text-xs text-gray-900">{node.name}</h3>
                <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 leading-snug">
                  {node.responsibility}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Node Detail Card */}
        {selectedNode && (
          <div className="p-5 rounded-xl border border-teal-300 bg-teal-50/50 space-y-2 animate-in fade-in text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-teal-950 font-mono">
                {selectedNode.name} [{selectedNode.category}]
              </span>
              <span className="font-mono text-[10px] text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                Protocol: {selectedNode.protocols}
              </span>
            </div>
            <p className="text-gray-800 leading-relaxed font-sans">{selectedNode.responsibility}</p>
            <div className="pt-2 border-t border-teal-200 text-teal-900 font-mono text-[11px]">
              <strong>Security Boundary:</strong> {selectedNode.securityBoundary}
            </div>
          </div>
        )}
      </div>

      {/* 16-Week Phase Timeline (Gantt-Style Bar Chart) */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">16-Week Production Delivery Roadmap</h2>
            <p className="text-xs text-gray-500">Milestone cadence from inception to firm-wide transmittal sign-off</p>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-mono">
            Current Week: Week 5
          </span>
        </div>

        {/* Timeline Grid Header (Weeks 1 to 16) */}
        <div className="space-y-3">
          <div className="grid grid-cols-16 gap-1 text-[10px] font-mono text-gray-400 text-center pb-1 border-b border-gray-100">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={i === 4 ? 'font-bold text-teal-800' : ''}>
                W{i + 1}
              </span>
            ))}
          </div>

          {/* Timeline Bars */}
          <div className="space-y-3">
            {timelinePhases.map((phase, idx) => {
              const startCol = phase.startWeek;
              const span = phase.endWeek - phase.startWeek + 1;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{phase.name}</span>
                    <span className="text-[11px] font-mono text-gray-500">{phase.status}</span>
                  </div>

                  <div className="grid grid-cols-16 gap-1 h-7 bg-gray-100 rounded-lg p-1 relative">
                    <div
                      className={`h-full rounded-md bg-gradient-to-r ${phase.color} shadow-xs text-white text-[10px] font-semibold flex items-center px-2 font-mono whitespace-nowrap overflow-hidden`}
                      style={{
                        gridColumnStart: startCol,
                        gridColumnEnd: `span ${span}`,
                      }}
                    >
                      {phase.name.split(':')[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
