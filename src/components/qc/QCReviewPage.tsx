import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Check,
  User,
  ExternalLink,
  MessageSquare,
  Shield,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../../state/AppContext';
import { QCFinding } from '../../types';
import { runComprehensiveQC, calculateReadinessScore } from '../../services/qcService';

export const QCReviewPage: React.FC = () => {
  const { state, dispatch, activeJob, addAudit, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'Deterministic' | 'Specialist'>('Deterministic');
  const [isRunningQC, setIsRunningQC] = useState<boolean>(false);
  const [resolvingFinding, setResolvingFinding] = useState<QCFinding | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState<string>('');
  const [dismissingFinding, setDismissingFinding] = useState<QCFinding | null>(null);
  const [dismissReasonInput, setDismissReasonInput] = useState<string>('');

  const readiness = calculateReadinessScore(state.qcFindings);

  const filteredFindings = state.qcFindings.filter(f => f.category === activeTab);

  // Donut chart data
  const donutData = [
    { name: 'Ready / Passed', value: readiness.score, color: '#0F766E' },
    { name: 'Deductions (Open Findings)', value: 100 - readiness.score, color: '#E5E7EB' },
  ];

  // Run QC Button handler
  const handleRunQC = async () => {
    setIsRunningQC(true);
    try {
      const updatedFindings = await runComprehensiveQC(
        activeJob,
        state.stagedComps,
        state.documents,
        state.qcFindings
      );

      dispatch({ type: 'SET_QC_FINDINGS', payload: updatedFindings });

      await addAudit({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'QC_Policy_Engine',
        actorType: 'SERVICE',
        action: 'QC_RUN',
        object: `Job:${activeJob.code}:QualityAudit`,
        details: `Evaluated 4 deterministic identity rules and 3 specialist queues. Readiness score: ${calculateReadinessScore(updatedFindings).score}%.`,
      });

      addToast({
        type: 'success',
        title: 'QC Engine Evaluation Complete',
        message: `Audited rules. Readiness score is ${calculateReadinessScore(updatedFindings).score}%.`,
      });
    } finally {
      setIsRunningQC(false);
    }
  };

  // Confirm resolution
  const handleConfirmResolve = async () => {
    if (!resolvingFinding || !resolutionNoteInput.trim()) return;

    const userName = state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : 'S. Patel, Specialist';

    dispatch({
      type: 'RESOLVE_QC_FINDING',
      payload: {
        id: resolvingFinding.id,
        note: resolutionNoteInput,
        user: userName,
      },
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: userName,
      actorType: 'USER',
      action: 'APPROVE',
      object: `QCFinding:${resolvingFinding.id} (${resolvingFinding.ruleName})`,
      details: `Resolved QC finding. Appraiser note: "${resolutionNoteInput}".`,
    });

    addToast({
      type: 'success',
      title: 'QC Finding Resolved',
      message: `Rule '${resolvingFinding.ruleName}' marked resolved.`,
    });

    setResolvingFinding(null);
    setResolutionNoteInput('');
  };

  // Confirm dismiss
  const handleConfirmDismiss = async () => {
    if (!dismissingFinding || !dismissReasonInput.trim()) return;

    dispatch({
      type: 'DISMISS_QC_FINDING',
      payload: {
        id: dismissingFinding.id,
        reason: dismissReasonInput,
      },
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : 'E. Vance, Admin',
      actorType: 'USER',
      action: 'REJECT',
      object: `QCFinding:${dismissingFinding.id}`,
      details: `Dismissed QC finding with justification: "${dismissReasonInput}".`,
    });

    addToast({
      type: 'info',
      title: 'QC Finding Dismissed',
      message: `Finding marked dismissed.`,
    });

    setDismissingFinding(null);
    setDismissReasonInput('');
  };

  const getSeverityBadge = (severity: 'Critical' | 'Major' | 'Minor') => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="text-[10px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded uppercase">
            Critical
          </span>
        );
      case 'Major':
        return (
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase">
            Major
          </span>
        );
      case 'Minor':
        return (
          <span className="text-[10px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded uppercase">
            Minor
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Quality Control Review Queue
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              AppSheet Compliance Engine
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Deterministic rule assertions and independent specialist reviewer queues for USPAP & client compliance.
          </p>
        </div>

        <button
          onClick={handleRunQC}
          disabled={isRunningQC}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 via-blue-700 to-teal-800 hover:from-teal-800 hover:to-blue-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isRunningQC ? 'animate-spin' : ''}`} />
          <span>{isRunningQC ? 'Evaluating Rules...' : 'Run QC Analysis'}</span>
        </button>
      </div>

      {/* Top Strip: Readiness Donut Score & Severity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Readiness Donut Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Readiness Score
            </span>
            <div className="text-3xl font-bold font-mono text-gray-900 mt-1">
              {readiness.score}%
            </div>
            <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
              {readiness.score >= 85 ? 'Audit Grade: Credible' : 'Action Required'}
            </span>
          </div>

          <div className="w-20 h-20 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-teal-900">
              {readiness.score}
            </div>
          </div>
        </div>

        {/* Critical Card */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Critical Severity</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">
            {readiness.criticalCount}
          </div>
          <span className="text-[10px] text-gray-400">Blocks report transmittal</span>
        </div>

        {/* Major Card */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Major Severity</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {readiness.majorCount}
          </div>
          <span className="text-[10px] text-gray-400">Requires workfile comment</span>
        </div>

        {/* Resolved Card */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Passed / Resolved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {readiness.resolvedCount}
          </div>
          <span className="text-[10px] text-gray-400">Out of {readiness.totalCount} rules scanned</span>
        </div>
      </div>

      {/* Tabs: Deterministic vs Specialist Reviewers */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('Deterministic')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'Deterministic'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Deterministic Checks ({state.qcFindings.filter(f => f.category === 'Deterministic').length})
        </button>
        <button
          onClick={() => setActiveTab('Specialist')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'Specialist'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Specialist Reviewers ({state.qcFindings.filter(f => f.category === 'Specialist').length})
        </button>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.map(finding => {
          const isResolved = finding.status === 'Resolved';
          const isDismissed = finding.status === 'Dismissed';

          return (
            <div
              key={finding.id}
              className={`p-5 rounded-2xl border transition-all ${
                isResolved
                  ? 'bg-emerald-50/20 border-emerald-200 opacity-90'
                  : isDismissed
                  ? 'bg-gray-50 border-gray-200 opacity-70'
                  : finding.severity === 'Critical'
                  ? 'bg-white border-rose-200 shadow-xs'
                  : 'bg-white border-gray-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(finding.severity)}
                    <h3 className="text-sm font-bold text-gray-900">{finding.ruleName}</h3>
                    {isResolved && (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Resolved
                      </span>
                    )}
                    {isDismissed && (
                      <span className="text-[10px] font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                        Dismissed
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Location: <strong className="font-mono text-gray-800">{finding.location}</strong></span>
                    <span>·</span>
                    <span>Evidence: <strong className="font-mono text-teal-800">{finding.evidenceLink}</strong></span>
                    <span>·</span>
                    <span>Assignee: <strong className="text-gray-800">{finding.specialistName || finding.assignee}</strong></span>
                  </div>

                  <p className="text-xs text-gray-700 pt-1 leading-relaxed">
                    <strong className="text-gray-900">Suggested Action:</strong> {finding.suggestedFix}
                  </p>

                  {/* Resolution note if already addressed */}
                  {finding.resolutionNote && (
                    <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                      <strong>Note:</strong> {finding.resolutionNote}
                      {finding.resolvedBy && (
                        <span className="text-gray-400 font-mono ml-2">
                          (by {finding.resolvedBy} at {finding.resolvedAt})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isResolved && !isDismissed && (
                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-start">
                    <button
                      onClick={() => setDismissingFinding(finding)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-semibold"
                    >
                      Dismiss
                    </button>

                    <button
                      onClick={() => setResolvingFinding(finding)}
                      className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
                    >
                      Resolve Finding
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolve Modal */}
      {resolvingFinding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Resolve QC Finding: {resolvingFinding.ruleName}
            </h3>

            <p className="text-xs text-gray-600">
              Enter the verification note or corrective action performed:
            </p>

            <textarea
              value={resolutionNoteInput}
              onChange={e => setResolutionNoteInput(e.target.value)}
              placeholder="e.g. Cross-referenced subject address with First Meridian Bank engagement letter page 1; title block updated."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 text-xs text-gray-900"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setResolvingFinding(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={!resolutionNoteInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {dismissingFinding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Dismiss QC Finding: {dismissingFinding.ruleName}
            </h3>

            <textarea
              value={dismissReasonInput}
              onChange={e => setDismissReasonInput(e.target.value)}
              placeholder="Reason for dismissal (e.g. Immaterial variance under 0.2% accepted per appraiser judgment)."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 text-xs text-gray-900"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setDismissingFinding(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDismiss}
                disabled={!dismissReasonInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Dismiss Finding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
