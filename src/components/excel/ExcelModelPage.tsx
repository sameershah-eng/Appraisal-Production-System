import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Lock,
  Play,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  Table,
  Check,
  Hash,
  MonitorCheck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { runExcelWorkbookWrite, ExcelStep } from '../../services/excelRunnerService';
import { formatHash } from '../../lib/crypto';
import { FormulaIntegrityReport } from '../../types';

export const ExcelModelPage: React.FC = () => {
  const { state, dispatch, activeJob, addAudit, addToast } = useApp();

  const [isRunningWrite, setIsRunningWrite] = useState<boolean>(false);
  const [writeSteps, setWriteSteps] = useState<ExcelStep[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'mappings'>('preview');

  const approvedComps = state.stagedComps.filter(c => c.status === 'Approved');

  // Trigger Excel runner execution
  const handleExecuteWrite = async () => {
    setIsRunningWrite(true);
    setWriteSteps([]);

    try {
      const result = await runExcelWorkbookWrite({
        simulateTamper: state.simulateExcelTamper,
        onProgress: steps => setWriteSteps([...steps]),
      });

      dispatch({ type: 'SET_FORMULA_REPORT', payload: result.report });

      if (result.success) {
        await addAudit({
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Win365_OpenXML_Runner',
          actorType: 'SERVICE',
          action: 'EXCEL_SYNC',
          object: 'Sales_Comparison_v7.xlsm',
          details: `Written ${approvedComps.length} approved comps to sheet 'Sale Comps'. Formula integrity verified: 1,284 formulas scanned, SHA-256 match confirmed. 0 formulas altered.`,
        });

        addToast({
          type: 'success',
          title: 'Excel Population Verified',
          message: 'Windows 365 Runner completed write. 1,284 formulas intact.',
        });
      } else {
        await addAudit({
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Win365_OpenXML_Runner',
          actorType: 'SERVICE',
          action: 'EXCEL_SYNC',
          object: 'Sales_Comparison_v7.xlsm',
          details: `INTEGRITY BREACH DETECTED: Tampered formula in cell ${result.report.tamperedCell}. Write transaction blocked and rolled back.`,
        });

        addToast({
          type: 'error',
          title: 'Integrity Breach: Write Blocked',
          message: `Formula in ${result.report.tamperedCell} was altered. Rollback executed.`,
        });
      }
    } finally {
      setIsRunningWrite(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Excel Valuation Model Population
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              Windows 365 Cloud Runner · OpenXML Protocol
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Workbook: <span className="font-mono text-gray-700">Sales_Comparison_v7.xlsm</span> · Injects approved comps into designated input ranges without touching formulas or adjustment columns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Tamper Simulation Toggle */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs cursor-pointer hover:bg-gray-50 transition-colors shadow-xs">
            <input
              type="checkbox"
              checked={state.simulateExcelTamper}
              onChange={e =>
                dispatch({
                  type: 'SET_SIMULATE_EXCEL_TAMPER',
                  payload: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <span className={`font-semibold ${state.simulateExcelTamper ? 'text-rose-700' : 'text-gray-600'}`}>
              Simulate Tampered Formula
            </span>
          </label>

          <button
            onClick={handleExecuteWrite}
            disabled={isRunningWrite || approvedComps.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 via-blue-700 to-teal-800 hover:from-teal-800 hover:to-blue-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningWrite ? 'animate-spin' : ''}`} />
            <span>{isRunningWrite ? 'Running Win365 Runner...' : 'Write to Workbook via Win365'}</span>
          </button>
        </div>
      </div>

      {/* Formula Integrity Banner if report exists */}
      {state.formulaReport && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            state.formulaReport.status === 'PASSED'
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {state.formulaReport.status === 'PASSED' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {state.formulaReport.status === 'PASSED'
                      ? 'Formula Hash Integrity Proof: VERIFIED'
                      : 'INTEGRITY BREACH DETECTED — WRITE BLOCKED'}
                  </span>
                  <span className="text-[11px] font-mono opacity-80">
                    {state.formulaReport.verifiedAt}
                  </span>
                </div>
                <p className="text-xs leading-relaxed max-w-3xl">
                  {state.formulaReport.status === 'PASSED'
                    ? `Scanned all ${state.formulaReport.cellsScannedCount} formula cells before and after input injection. SHA-256 before (${formatHash(
                        state.formulaReport.beforeHash,
                        10
                      )}) equals SHA-256 after (${formatHash(
                        state.formulaReport.afterHash,
                        10
                      )}). Exactly 0 formulas modified. 0 VBA macros altered.`
                    : state.formulaReport.tamperedDetails}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono flex-shrink-0 self-end md:self-center">
              <div>
                <span className="text-gray-500 block text-[10px]">FORMULAS SCANNED</span>
                <span className="font-bold">{state.formulaReport.cellsScannedCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">FORMULAS ALTERED</span>
                <span className={`font-bold ${state.formulaReport.formulasChangedCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {state.formulaReport.formulasChangedCount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">VBA MACROS</span>
                <span className="font-bold text-emerald-700">0 Modified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Modal during Runner Execution */}
      {isRunningWrite && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-lg space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MonitorCheck className="w-4 h-4 text-teal-700 animate-pulse" />
              <span className="text-xs font-bold text-gray-900">
                Windows 365 Cloud Runner Active Pipeline
              </span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">Session ID: w365-session-9842</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {writeSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs ${
                  step.status === 'completed'
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : step.status === 'in_progress'
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900 ring-2 ring-blue-100'
                    : step.status === 'failed'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-gray-50/50 border-gray-200 text-gray-400'
                }`}
              >
                <div className="font-semibold">{step.name}</div>
                {step.detail && <div className="text-[10px] font-mono text-gray-600 mt-1">{step.detail}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Grid Preview vs Cell Mappings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Worksheet Preview ('Sale Comps'!C10:N18)
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'mappings'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cell Mapping Catalog & Named Ranges ({state.excelMappings.length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span>
            <span>Automated Input</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span className="font-semibold text-gray-700">Appraiser Input Only (Locked)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span>
            <span>Excel Formula (Protected)</span>
          </span>
        </div>
      </div>

      {/* 1. WORKSHEET STYLED GRID PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          {/* Excel Tab Bar */}
          <div className="bg-[#FAF9F6] px-4 py-2 border-b border-[#E7E5E0] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="bg-white px-3 py-1 rounded-t-md border-t border-x border-[#E7E5E0] font-bold text-gray-900 text-[11px] shadow-xs">
                Sale Comps
              </span>
              <span className="text-gray-400 px-2 py-1">Rent Comps</span>
              <span className="text-gray-400 px-2 py-1">Expense Comps</span>
              <span className="text-gray-400 px-2 py-1">Valuation Summary</span>
            </div>

            <div className="text-[11px] text-gray-500">
              Sheet Protection: <strong className="text-gray-800">Password Enforced</strong>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono border-collapse">
              {/* Excel Column Letters */}
              <thead className="bg-[#F3F2EE] text-gray-500 border-b border-gray-300 text-[11px]">
                <tr>
                  <th className="py-2 px-3 text-center border-r border-gray-300 w-12 bg-gray-200/60 font-semibold">Row</th>
                  <th className="py-2 px-3 border-r border-gray-300">C (Address)</th>
                  <th className="py-2 px-3 border-r border-gray-300">D (Sale Price)</th>
                  <th className="py-2 px-3 border-r border-gray-300">E (Date)</th>
                  <th className="py-2 px-3 border-r border-gray-300">F (GLA SF)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-slate-100 font-bold">G (Price/SF Formula)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-amber-50 text-amber-900 font-bold">H (Rights Adj)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-amber-50 text-amber-900 font-bold">I (Financing)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-amber-50 text-amber-900 font-bold">J (Conditions)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-amber-50 text-amber-900 font-bold">K (Market/Time)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-amber-50 text-amber-900 font-bold">L (Location)</th>
                  <th className="py-2 px-3 border-r border-gray-300 bg-amber-50 text-amber-900 font-bold">M (Physical)</th>
                  <th className="py-2 px-3 bg-slate-100 font-bold">N (Adjusted $/SF)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* Subject Property Row 11 */}
                <tr className="bg-teal-50/40 font-semibold">
                  <td className="py-2 px-3 text-center border-r border-gray-300 bg-gray-100 text-gray-500">11</td>
                  <td className="py-2 px-3 border-r border-gray-200 text-teal-950">{activeJob.subjectAddress} (SUBJECT)</td>
                  <td className="py-2 px-3 border-r border-gray-200 text-gray-400">N/A (Subject)</td>
                  <td className="py-2 px-3 border-r border-gray-200">{activeJob.effectiveDate}</td>
                  <td className="py-2 px-3 border-r border-gray-200">{activeJob.gla.toLocaleString()} SF</td>
                  <td className="py-2 px-3 border-r border-gray-200 bg-slate-50 text-gray-400">—</td>
                  <td colSpan={6} className="py-2 px-3 border-r border-gray-200 bg-amber-50/40 text-center text-amber-800 text-[10px]">
                    SUBJECT PROPERTY BASELINE
                  </td>
                  <td className="py-2 px-3 bg-slate-50 font-bold text-gray-900">—</td>
                </tr>

                {/* Approved Comps Rows 12 to 15 */}
                {approvedComps.map((comp, idx) => {
                  const rowNum = 12 + idx;
                  const d = comp.data;
                  const unadjPrice = (d.salePrice.value / d.buildingSf.value);
                  const timeAdj = idx === 0 ? 0.03 : idx === 1 ? 0.05 : 0.02;
                  const locAdj = idx === 0 ? -0.05 : 0.00;
                  const totalAdj = timeAdj + locAdj;
                  const adjustedPrice = unadjPrice * (1 + totalAdj);

                  return (
                    <tr key={comp.id} className="hover:bg-blue-50/20">
                      <td className="py-2 px-3 text-center border-r border-gray-300 bg-gray-100 text-gray-500">{rowNum}</td>
                      <td className="py-2 px-3 border-r border-gray-200 font-bold text-gray-900">{d.address.value}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-gray-800">${d.salePrice.value.toLocaleString()}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-gray-700">{d.saleDate.value}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-gray-700">{d.buildingSf.value.toLocaleString()}</td>
                      <td className="py-2 px-3 border-r border-gray-200 bg-slate-50 font-bold text-gray-900">
                        ${unadjPrice.toFixed(2)}
                      </td>

                      {/* Locked Appraiser Adjustment Columns H to M */}
                      <td className="py-2 px-3 border-r border-gray-200 bg-amber-50/60 text-amber-950 font-mono text-center">
                        0.0%
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 bg-amber-50/60 text-amber-950 font-mono text-center">
                        0.0%
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 bg-amber-50/60 text-amber-950 font-mono text-center">
                        0.0%
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 bg-amber-50/60 text-amber-950 font-mono text-center">
                        +{(timeAdj * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 bg-amber-50/60 text-amber-950 font-mono text-center">
                        {locAdj === 0 ? '0.0%' : `${(locAdj * 100).toFixed(1)}%`}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 bg-amber-50/60 text-amber-950 font-mono text-center">
                        0.0%
                      </td>

                      {/* Formula Calculated Adjusted $/SF */}
                      <td className="py-2 px-3 bg-slate-50 font-bold text-teal-800">
                        ${adjustedPrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#FAF9F6] border-t border-[#E7E5E0] text-[11px] text-gray-500 flex items-center justify-between">
            <span>
              Columns H through M are locked by worksheet protection. Only Certified Appraisers may input adjustment values.
            </span>
            <span className="font-mono text-gray-600">Active range: 'Sale Comps'!C12:N15</span>
          </div>
        </div>
      )}

      {/* 2. CELL MAPPINGS TABLE */}
      {activeTab === 'mappings' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-gray-500 font-semibold border-b border-[#E7E5E0]">
                <tr>
                  <th className="py-2.5 px-4">Source Field</th>
                  <th className="py-2.5 px-3">Cell Reference</th>
                  <th className="py-2.5 px-3">Named Range</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Pydantic Validation Rule</th>
                  <th className="py-2.5 px-3">Formula / Lock State</th>
                  <th className="py-2.5 px-4 text-right">Current Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E0]">
                {state.excelMappings.map(map => (
                  <tr key={map.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                      {map.sourceField}
                    </td>
                    <td className="py-3 px-3 font-mono text-teal-800 font-semibold">
                      {map.cellReference}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600">
                      {map.namedRange}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500 uppercase text-[10px]">
                      {map.dataType}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                      {map.validationRule}
                    </td>
                    <td className="py-3 px-3">
                      {map.isAdjustmentColumn ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" />
                          Appraiser input only
                        </span>
                      ) : map.formulaPreview ? (
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {map.formulaPreview}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">Mapped Input</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {typeof map.currentValue === 'number'
                        ? map.currentValue.toLocaleString()
                        : map.currentValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
