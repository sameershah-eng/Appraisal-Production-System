import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Shield,
  Layers,
  Search,
  Check,
  ArrowRight,
  Database,
  History,
  CornerDownRight,
  Lock,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { ExtractedField, SaleCompData, StagedCompRecord } from '../../types';
import { checkDuplicateComp } from '../../services/stagingService';

export const ExtractionReviewPage: React.FC = () => {
  const { state, dispatch, addAudit, addToast } = useApp();

  const currentComp =
    state.saleComps.find(c => c.id === state.selectedReviewCompId) || state.saleComps[0];

  const sourceDoc =
    state.documents.find(d => d.id === currentComp.sourceDocId) || state.documents[0];

  const [activeCitation, setActiveCitation] = useState<{
    page: number;
    paragraph: number;
    snippet: string;
  } | null>({ page: 1, paragraph: 2, snippet: currentComp.address.citation.snippet });

  const [editingField, setEditingField] = useState<{
    key: keyof SaleCompData;
    label: string;
    currentValue: any;
  } | null>(null);

  const [editValue, setEditValue] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  // Refs for PDF page cards to scroll to page
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  const handleCitationClick = (citation: { page: number; paragraph: number; snippet: string }) => {
    setActiveCitation(citation);
    const targetRef = citation.page === 1 ? page1Ref : citation.page === 2 ? page2Ref : page3Ref;
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Open edit modal for a field
  const handleOpenEdit = (key: keyof SaleCompData, label: string, currentVal: any) => {
    setEditingField({ key, label, currentValue: currentVal });
    setEditValue(String(currentVal));
    setEditReason('');
  };

  // Save human edit
  const handleSaveEdit = async () => {
    if (!editingField || !editReason.trim()) return;

    let parsedVal: any = editValue;
    if (typeof editingField.currentValue === 'number') {
      parsedVal = parseFloat(editValue) || editingField.currentValue;
    }

    const userName = state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : state.currentRole === 'Reviewer' ? 'S. Patel, Reviewer' : 'E. Vance, Admin';

    dispatch({
      type: 'UPDATE_EXTRACTED_FIELD',
      payload: {
        compId: currentComp.id,
        fieldName: editingField.key,
        newValue: parsedVal,
        reason: editReason,
        user: userName,
      },
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: userName,
      actorType: 'USER',
      action: 'EDIT',
      object: `${currentComp.id}:${String(editingField.key)}`,
      details: `Field '${editingField.label}' adjusted from '${editingField.currentValue}' to '${parsedVal}'. Reason: ${editReason}`,
    });

    addToast({
      type: 'info',
      title: `Field '${editingField.label}' Updated`,
      message: `Correction audited with reason: "${editReason}"`,
    });

    setEditingField(null);
  };

  // Send to Staging
  const handleSendToStaging = async () => {
    const dupeCheck = checkDuplicateComp(currentComp, state.stagedComps);

    const existingStaged = state.stagedComps.find(s => s.data.id === currentComp.id);
    const stageId = existingStaged ? existingStaged.id : `stage-${Date.now()}`;

    const newStagedRecord: StagedCompRecord = {
      id: stageId,
      jobId: currentComp.jobId,
      compType: 'Sales',
      data: currentComp,
      duplicateCheck: dupeCheck,
      status: 'Pending',
      verifiedEvidence: false,
      comments: [
        {
          user: state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : 'S. Patel, Reviewer',
          text: 'Ingested from Extraction Review. Ready for appraisal verification.',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
      isLocked: false,
    };

    dispatch({ type: 'STAGE_COMP', payload: newStagedRecord });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : 'S. Patel, Reviewer',
      actorType: 'USER',
      action: 'WRITE',
      object: `StagedRecord:${stageId}`,
      details: `Staged comp '${currentComp.address.value}' into PostgreSQL staging table. Duplicate score: ${dupeCheck.score}.`,
    });

    addToast({
      type: 'success',
      title: 'Comp Staged Successfully',
      message: `${currentComp.address.value} forwarded to Staging & Duplicate Check table.`,
    });

    dispatch({ type: 'SET_SCREEN', payload: 'staging' });
  };

  // Render individual field row
  const renderFieldRow = (
    label: string,
    key: keyof SaleCompData,
    field: ExtractedField<any>,
    formatFn?: (val: any) => string
  ) => {
    const isLowConfidence = field.confidence < 85;
    const isSelectedCitation =
      activeCitation?.page === field.citation.page &&
      activeCitation?.paragraph === field.citation.paragraph;

    return (
      <div
        className={`p-3 rounded-xl border transition-all ${
          isSelectedCitation
            ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100'
            : isLowConfidence
            ? 'bg-rose-50/30 border-rose-200'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            {isLowConfidence && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded" title="Extraction confidence < 85%">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Review Required
              </span>
            )}
            {field.isEdited && (
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded font-mono">
                Human Edited
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Citation Chip */}
            <button
              onClick={() => handleCitationClick(field.citation)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                isSelectedCitation
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Click to view & highlight source paragraph in PDF"
            >
              <span>p.{field.citation.page}, ¶{field.citation.paragraph}</span>
            </button>

            {/* Edit button */}
            <button
              onClick={() => handleOpenEdit(key, label, field.value)}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Edit value (records audit trail)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Value & Confidence bar */}
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-sm font-bold text-gray-900 font-mono tracking-tight">
            {formatFn ? formatFn(field.value) : field.value}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0" title={`Extraction Confidence: ${field.confidence}%`}>
            <div className="w-14 bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isLowConfidence
                    ? 'bg-rose-500'
                    : field.confidence >= 95
                    ? 'bg-emerald-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${field.confidence}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-gray-500">
              {field.confidence}%
            </span>
          </div>
        </div>

        {/* Audit history indicator if edited */}
        {field.editHistory && field.editHistory.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[10px] text-gray-500 space-y-0.5">
            {field.editHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-1 text-gray-600">
                <CornerDownRight className="w-3 h-3 text-teal-600 flex-shrink-0" />
                <span>
                  Modified by <strong>{h.editedBy}</strong>: "{h.reason}" ({h.timestamp})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Comp Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Evidence-First Extraction Review
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              Zero Hallucination Protocol
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Every extracted cell is bound to verifiable page and paragraph coordinates. Clicking a citation jumps to the source document.
          </p>
        </div>

        {/* Comp Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E7E5E0] shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Record:</span>
            <select
              value={state.selectedReviewCompId}
              onChange={e => dispatch({ type: 'SET_SELECTED_REVIEW_COMP', payload: e.target.value })}
              className="text-xs font-bold text-gray-900 bg-transparent border-0 cursor-pointer focus:ring-0 p-0 font-mono"
            >
              {state.saleComps.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.address.value} (${(comp.salePrice.value / 1000000).toFixed(2)}M)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSendToStaging}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-blue-700 hover:from-teal-800 hover:to-blue-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Forward to Staging & Dedupe</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Split Screen View: Left Document Preview, Right Extracted Schema Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simulated PDF Pages (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E7E5E0] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-6 max-h-[820px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky -top-6 bg-white z-10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <div>
                <span className="text-xs font-bold text-gray-900 font-mono">
                  {currentComp.sourceDocName}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  3 Pages · Scanned Instrument · Official Dallas County Recording
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                Active Citation: p.{activeCitation?.page || 1}, ¶{activeCitation?.paragraph || 1}
              </span>
            </div>
          </div>

          {/* PAGE 1 */}
          <div
            ref={page1Ref}
            className="bg-[#FCFCFA] p-6 rounded-xl border border-gray-300 shadow-sm space-y-4 font-serif text-gray-800 leading-relaxed text-xs relative"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 border-b border-gray-200 pb-2">
              <span>SPECIAL WARRANTY DEED WITH VENDOR LIEN</span>
              <span>PAGE 1 OF 3</span>
            </div>

            {/* Paragraph 1: Execution Date */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 1 && activeCitation?.paragraph === 1
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶1.</strong> THIS SPECIAL WARRANTY DEED (this "Deed") is executed on this <strong>18th day of April, 2026</strong>, by and between the Grantor and Grantee herein named, upon valuable consideration in hand paid.
            </p>

            {/* Paragraph 2: Address & Location */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 1 && activeCitation?.paragraph === 2
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶2.</strong> WITNESSETH: For and in consideration of the premises and covenants herein, Grantor grants, sells, and conveys unto Grantee all that certain lot, tract, or parcel of real property situated at <strong>1420 Valwood Parkway, Carrollton, Dallas County, Texas 75006</strong>, more particularly described in Exhibit "A" attached hereto.
            </p>

            {/* Paragraph 3: Grantor */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 1 && activeCitation?.paragraph === 3
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶3.</strong> GRANTOR: <strong>Valwood Logistics Partners LP</strong>, a Texas limited partnership duly organized and existing under the Texas Business Organizations Code. [Official Notary Seal partially blurred on recording receipt].
            </p>

            {/* Paragraph 4: APN / Parcel ID */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 1 && activeCitation?.paragraph === 4
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶4.</strong> TAX PARCEL IDENTIFIER: Dallas Central Appraisal District Tax Assessor Parcel Identification Number: <strong>00-3321-001-0000</strong>.
            </p>
          </div>

          {/* PAGE 2 */}
          <div
            ref={page2Ref}
            className="bg-[#FCFCFA] p-6 rounded-xl border border-gray-300 shadow-sm space-y-4 font-serif text-gray-800 leading-relaxed text-xs relative"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 border-b border-gray-200 pb-2">
              <span>CONSIDERATION AND COVENANTS</span>
              <span>PAGE 2 OF 3</span>
            </div>

            {/* Paragraph 1: Sale Price */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 2 && activeCitation?.paragraph === 1
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶1.</strong> CONSIDERATION: Cash consideration in the amount of <strong>$11,450,000.00 (Eleven Million Four Hundred Fifty Thousand and No/100 Dollars)</strong> lawful currency of the United States of America paid to Grantor at closing by Grantee.
            </p>

            {/* Paragraph 3: Grantor Signature & Seal */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 2 && activeCitation?.paragraph === 3
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶3.</strong> IN WITNESS WHEREOF, Grantor has caused this instrument to be executed by its general partner, Valwood Logistics Partners LP, on date first above written. Notarial seal attested by Dallas County Deputy Clerk.
            </p>

            {/* Paragraph 4: Grantee */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 2 && activeCitation?.paragraph === 4
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶4.</strong> GRANTEE: <strong>Merit Industrial Trust REIT</strong>, a Maryland real estate investment trust having its principal office at 500 Crescent Court, Suite 300, Dallas, Texas 75201.
            </p>
          </div>

          {/* PAGE 3 */}
          <div
            ref={page3Ref}
            className="bg-[#FCFCFA] p-6 rounded-xl border border-gray-300 shadow-sm space-y-4 font-serif text-gray-800 leading-relaxed text-xs relative"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 border-b border-gray-200 pb-2">
              <span>EXHIBIT "A" - IMPROVEMENT SPECIFICATIONS</span>
              <span>PAGE 3 OF 3</span>
            </div>

            {/* Paragraph 1: Property Type */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 3 && activeCitation?.paragraph === 1
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶1.</strong> Single-tenant cross-dock distribution warehouse facility constructed of tilt-wall reinforced concrete panels with concrete paved truck apron and security perimeter.
            </p>

            {/* Paragraph 2: Building SF */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 3 && activeCitation?.paragraph === 2
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶2.</strong> Gross enclosed warehouse improvements measuring approximately <strong>86,400 square feet</strong> as determined by architectural as-built plans on file.
            </p>

            {/* Paragraph 3: Land Acres */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 3 && activeCitation?.paragraph === 3
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶3.</strong> Containing 253,519 square feet or <strong>5.820 acres of land</strong>, more or less, according to recorded plat in Volume 2016-18, Page 402, Dallas County Map Records.
            </p>

            {/* Paragraph 4: Year Built & Clear Height */}
            <p
              className={`p-2 rounded transition-all ${
                activeCitation?.page === 3 && activeCitation?.paragraph === 4
                  ? 'bg-amber-200/80 ring-2 ring-amber-400 text-gray-950 font-medium'
                  : ''
              }`}
            >
              <strong>¶4.</strong> Constructed in <strong>2017</strong> with 30-foot clear ceiling height, ESFR fire suppression sprinklers, and 18 dock-high loading doors.
            </p>
          </div>
        </div>

        {/* Right Column: Extracted Schema Fields Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E7E5E0] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Extracted Real Estate Record</h2>
              <p className="text-[11px] text-gray-500">Schema: RealEstateDeedSchema_v3</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono font-medium">
              <Check className="w-3 h-3 text-teal-600" />
              <span>12 Fields Grounded</span>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1 custom-scrollbar">
            {renderFieldRow('Street Address', 'address', currentComp.address)}
            {renderFieldRow('Tax Parcel (APN)', 'apn', currentComp.apn)}
            {renderFieldRow('City & State', 'city', currentComp.city)}
            {renderFieldRow('Sale Date', 'saleDate', currentComp.saleDate)}
            {renderFieldRow('Sale Price', 'salePrice', currentComp.salePrice, v => `$${Number(v).toLocaleString()}`)}
            {renderFieldRow('Gross Building Area (SF)', 'buildingSf', currentComp.buildingSf, v => `${Number(v).toLocaleString()} SF`)}
            {renderFieldRow('Land Acres', 'landAcres', currentComp.landAcres, v => `${v} acres`)}
            {renderFieldRow('Unit Price ($/SF)', 'pricePerSf', currentComp.pricePerSf, v => `$${Number(v).toFixed(2)}/SF`)}
            {renderFieldRow('Grantor (Seller)', 'grantor', currentComp.grantor)}
            {renderFieldRow('Grantee (Buyer)', 'grantee', currentComp.grantee)}
            {renderFieldRow('Property Type', 'propertyType', currentComp.propertyType)}
            {renderFieldRow('Year Built', 'yearBuilt', currentComp.yearBuilt, v => `${v}`)}
          </div>
        </div>
      </div>

      {/* Human Edit Modal with Required Audit Reason */}
      {editingField && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-gray-900">
                  Override Extracted Field: {editingField.label}
                </h3>
              </div>
              <button
                onClick={() => setEditingField(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-semibold block mb-1">
                  Extracted Value (Old)
                </label>
                <div className="p-2.5 rounded-lg bg-gray-100 text-gray-700 font-mono">
                  {String(editingField.currentValue)}
                </div>
              </div>

              <div>
                <label className="text-gray-800 font-semibold block mb-1">
                  Corrected Value (New)
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="text-gray-800 font-semibold block mb-1">
                  Appraiser Reason for Modification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  placeholder="e.g. Corrected corporate suffix based on notarial seal verification on Page 2, Paragraph 3."
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 text-gray-900"
                />
                <span className="text-[10px] text-gray-400">
                  Reason is recorded permanently in the append-only cryptographic audit chain.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editReason.trim()}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Save & Append Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
