import React from 'react';
import { Compass, ArrowRight, Check, X, ShieldAlert, Sparkles, Database, FileSpreadsheet, History, FileSearch, FolderInput } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const MilestoneBanner: React.FC = () => {
  const { state, dispatch } = useApp();

  if (!state.milestoneActive) return null;

  const steps = [
    {
      step: 1,
      targetScreen: 'intake' as const,
      title: 'Step 1: OneDrive Ingestion',
      desc: 'Verify the source Special Warranty Deed (1420 Valwood) ingested via Microsoft Graph API with immutable SHA-256 hash.',
      actionLabel: 'Go to Document Intake',
    },
    {
      step: 2,
      targetScreen: 'review' as const,
      title: 'Step 2: Citation Grounded Extraction',
      desc: 'Inspect extracted deed fields. Notice confidence scores (<85% flagged) and click citation chips to view source text highlights.',
      actionLabel: 'Review Extraction Evidence',
    },
    {
      step: 3,
      targetScreen: 'staging' as const,
      title: 'Step 3: Staging & Duplicate Detection',
      desc: 'Evaluate deterministic matching: APN + date + price = duplicate blocked; same APN + new date = historical property linked.',
      actionLabel: 'Inspect Dedupe Staging',
    },
    {
      step: 4,
      targetScreen: 'staging' as const,
      title: 'Step 4: Human Evidence Sign-Off',
      desc: 'Appraiser signs certification: "I have verified the source evidence." Record becomes locked and immutable.',
      actionLabel: 'Approve Comparable',
    },
    {
      step: 5,
      targetScreen: 'excel' as const,
      title: 'Step 5: Excel Write with Hash Integrity Proof',
      desc: 'Execute Windows 365 Runner to inject approved facts into Excel. Scans 1,284 formulas and verifies SHA-256 integrity.',
      actionLabel: 'Run Excel Runner',
    },
    {
      step: 6,
      targetScreen: 'audit' as const,
      title: 'Step 6: Cryptographic Hash Chain Audit',
      desc: 'Inspect the append-only ledger where every read, edit, model call, and Excel write is linked in a SHA-256 blockchain-style log.',
      actionLabel: 'Verify Audit Ledger',
    },
  ];

  const current = steps[state.milestoneStep - 1] || steps[0];

  const handleNext = () => {
    if (state.milestoneStep < steps.length) {
      const nextStep = state.milestoneStep + 1;
      dispatch({ type: 'SET_MILESTONE_STEP', payload: nextStep });
      dispatch({ type: 'SET_SCREEN', payload: steps[nextStep - 1].targetScreen });
    } else {
      dispatch({ type: 'EXIT_MILESTONE' });
    }
  };

  const handleStepClick = (stepNum: number) => {
    dispatch({ type: 'SET_MILESTONE_STEP', payload: stepNum });
    dispatch({ type: 'SET_SCREEN', payload: steps[stepNum - 1].targetScreen });
  };

  return (
    <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-blue-950 text-white px-6 py-3 border-b border-teal-800/80 shadow-md sticky top-16 z-30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Step Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-300 font-semibold">
                Milestone 1 Guided Walkthrough
              </span>
              <span className="text-[11px] text-teal-200/80 font-mono">
                [Step {state.milestoneStep} of {steps.length}]
              </span>
            </div>
            <div className="text-sm font-semibold text-white tracking-tight">
              {current.title}
            </div>
            <div className="text-xs text-slate-300 max-w-3xl leading-snug mt-0.5">
              {current.desc}
            </div>
          </div>
        </div>

        {/* Right: Step Indicator & Actions */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="hidden xl:flex items-center gap-1.5">
            {steps.map(s => {
              const isDone = s.step < state.milestoneStep;
              const isCurrent = s.step === state.milestoneStep;
              return (
                <button
                  key={s.step}
                  onClick={() => handleStepClick(s.step)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono transition-all ${
                    isCurrent
                      ? 'bg-teal-500 text-white font-bold ring-2 ring-teal-300 ring-offset-1 ring-offset-slate-900'
                      : isDone
                      ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title={s.title}
                >
                  {isDone ? <Check className="w-3 h-3" /> : s.step}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <span>{state.milestoneStep === steps.length ? 'Complete Tour' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => dispatch({ type: 'EXIT_MILESTONE' })}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Exit Walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
