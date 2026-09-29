import React, { useState } from 'react';
import {
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  Edit3,
  Check,
  Eye,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { ReportSection } from '../../types';

export const WordReportPage: React.FC = () => {
  const { state, dispatch, activeJob, addAudit, addToast } = useApp();

  const selectedSection =
    state.reportSections.find(s => s.id === state.selectedReportSectionId) ||
    state.reportSections[0];

  const [activePopoverCitation, setActivePopoverCitation] = useState<{
    marker: string;
    field: string;
    source: string;
    page: string;
    value: string;
  } | null>(null);

  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);

  const isJudgmentLocked = (selectedSection.category as string).includes('locked');

  // Handle drafting a factual section
  const handleDraftFactualSection = async () => {
    if (isJudgmentLocked) return;
    setIsDrafting(true);

    await new Promise(r => setTimeout(r, 600));

    let draftContent = '';
    let citations: ReportSection['citations'] = [];

    if (selectedSection.id === 'sec-1') {
      // Letter of Transmittal
      draftContent = `In accordance with your formal authorization, we have prepared a comprehensive real estate appraisal of the fee simple interest in the single-tenant industrial distribution facility located at ${activeJob.subjectAddress}, ${activeJob.cityState} [1]. The stated purpose of this assignment is to estimate the As-Is Market Value of the subject property as of the effective date of ${activeJob.effectiveDate} [2]. This report has been prepared specifically for the internal credit evaluation purposes of ${activeJob.client} [3]. Based on our physical inspection, thorough examination of public land instruments, and analysis of 4 verified market sales comps [4], the concluded market value is set forth in the attached reconciliation.`;
      citations = [
        { marker: '[1]', field: 'Subject Location', source: 'Signed_Engagement_Letter_FirstMeridian.pdf', page: 'p.1 ¶2', value: `${activeJob.subjectAddress}, ${activeJob.cityState}` },
        { marker: '[2]', field: 'Effective Date', source: 'Engagement Agreement Terms', page: 'p.2 ¶1', value: activeJob.effectiveDate },
        { marker: '[3]', field: 'Intended User', source: 'Engagement Letter First Meridian Bank', page: 'p.1 ¶1', value: activeJob.client },
        { marker: '[4]', field: 'Comparable Sales Set', source: 'Staged PostgreSQL Database', page: 'Comps 1-4', value: '4 Approved Transactions' },
      ];
    } else if (selectedSection.id === 'sec-3') {
      // Property Description
      draftContent = `The subject site comprises approximately ${activeJob.landAcres} gross acres of industrial-zoned land situated within the Dallas County commercial corridor [1]. Primary improvements consist of an enclosed tilt-wall concrete distribution warehouse constructed in ${activeJob.yearBuilt} [2], measuring approximately ${activeJob.gla.toLocaleString()} gross leasable square feet [3]. The improvements feature 30-foot interior clear ceiling heights, reinforced heavy-load concrete slabs, and 18 dock-high overhead loading doors with hydraulic levelers [4]. Public water, sanitary sewer, and electricity services are fully connected and adequate to support continued industrial warehouse operations.`;
      citations = [
        { marker: '[1]', field: 'Site Area', source: 'Dallas CAD Land Roll / Site Plan', page: 'doc-011, p.1', value: `${activeJob.landAcres} Acres` },
        { marker: '[2]', field: 'Year Built', source: 'Building Permit Records / Deed Exhibit', page: 'p.3 ¶4', value: `${activeJob.yearBuilt}` },
        { marker: '[3]', field: 'Gross Leasable Area (GLA)', source: 'Architectural As-Built Plans', page: 'p.2 ¶3', value: `${activeJob.gla.toLocaleString()} SF` },
        { marker: '[4]', field: 'Loading Improvements', source: 'Physical Inspection Notes & Deed Specs', page: 'doc-001, p.3 ¶4', value: '30ft clear height, 18 dock doors' },
      ];
    } else if (selectedSection.id === 'sec-4') {
      // Market Area Analysis
      draftContent = `The subject property is located in the Carrollton / Farmers Branch industrial submarket of the greater Dallas-Fort Worth metroplex. Submarket vacancy for Class B/A industrial warehouse space stood at 4.8% as of Q3 2026, demonstrating strong structural absorption driven by logistics and aerospace supply chains. Average annual warehouse rental rates in the immediate competitive cluster range between $9.25 and $10.20 per square foot on a triple-net (NNN) basis [1], supported by 5 recently executed lease transactions verified in our workfile [2].`;
      citations = [
        { marker: '[1]', field: 'Submarket NNN Rent', source: 'Executed Lease Comp 1 & 4', page: 'doc-007, p.2', value: '$9.25 - $10.20/SF NNN' },
        { marker: '[2]', field: 'Rent Comps Ingested', source: 'Lease Comp Summary Database', page: 'doc-008, p.1', value: '5 Verified Lease Comps' },
      ];
    } else {
      // Sales Comparison Approach
      draftContent = `In applying the Sales Comparison Approach, we performed an exhaustive search for comparable single-tenant industrial transactions closed within the past 12 months. Four primary transactions were approved and verified against recorded county deeds and closing statements [1]. Unadjusted sale prices for these comparables range from $128.68/SF to $135.64/SF, with an unadjusted arithmetic mean of $132.85/SF [2]. Each comparable was evaluated for property rights conveyed, financing terms, conditions of sale, market appreciation over time, and physical characteristics including clear ceiling height [3]. The adjusted range of indicators strongly brackets the subject property improvements.`;
      citations = [
        { marker: '[1]', field: 'Verified Sales Comps', source: 'Dallas County Warranty Deeds', page: 'docs 001-003', value: '4 Approved Deed Instruments' },
        { marker: '[2]', field: 'Price Range', source: 'Sales Comparison Model Grid', page: "Workbook 'Sale Comps'!G12:G15", value: '$128.68 - $135.64/SF' },
        { marker: '[3]', field: 'Quantitative Adjustments', source: 'Appraiser Valuation Model', page: "Workbook 'Sale Comps'!H12:M15", value: 'Appraiser Quantitative Adjustments' },
      ];
    }

    dispatch({
      type: 'UPDATE_REPORT_SECTION',
      payload: {
        id: selectedSection.id,
        content: draftContent,
        citations,
        status: 'Drafted',
      },
    });

    setEditedText(draftContent);

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'Report_Drafting_Worker',
      actorType: 'SERVICE',
      action: 'WRITE',
      object: `WordReport:${selectedSection.title}`,
      details: `Generated factual narrative grounded strictly in ${citations.length} verified evidence citations. Appraiser judgment sections preserved untouched.`,
    });

    addToast({
      type: 'success',
      title: 'Factual Section Drafted',
      message: `${selectedSection.title} compiled with ${citations.length} verified evidence citations.`,
    });

    setIsDrafting(false);
  };

  // Accept section with tracked changes
  const handleAcceptSection = async () => {
    // Generate diff if edited
    const original = selectedSection.content;
    const diffs: ReportSection['diff'] = [];

    if (editedText !== original) {
      diffs.push({ type: 'keep', text: 'Appraiser reviewed & adjusted text: ' });
      diffs.push({ type: 'add', text: editedText });
    }

    dispatch({
      type: 'UPDATE_REPORT_SECTION',
      payload: {
        id: selectedSection.id,
        content: editedText,
        status: 'Accepted',
        diff: diffs.length > 0 ? diffs : undefined,
      },
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : 'S. Patel, Reviewer',
      actorType: 'USER',
      action: 'APPROVE',
      object: `WordReport:${selectedSection.title}`,
      details: `Section accepted into formal appraisal report package. Evidence citations locked.`,
    });

    addToast({
      type: 'success',
      title: 'Report Section Accepted',
      message: `${selectedSection.title} accepted into formal appraisal workfile.`,
    });

    setIsEditing(false);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Word Report Drafting & Evidence Citation
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              OpenXML Report Generation
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Factual sections are synthesized strictly from approved evidence citations. Judgment and reconciliation sections are reserved exclusively for the appraiser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Progress:{' '}
            <strong className="text-gray-900 font-mono">
              {state.reportSections.filter(s => s.status === 'Accepted').length} / {state.reportSections.length} accepted
            </strong>
          </span>
        </div>
      </div>

      {/* Main Split View: Left Outline, Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Report Outline (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E7E5E0] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-2">
          <div className="px-2 py-1 text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
            <span>Report Sections</span>
            <span className="text-[10px] text-gray-400 font-mono">USPAP Standard 2</span>
          </div>

          <div className="space-y-1">
            {state.reportSections.map(sec => {
              const isSelected = sec.id === selectedSection.id;
              const isLocked = (sec.category as string).includes('locked');

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    dispatch({ type: 'SET_SELECTED_REPORT_SECTION', payload: sec.id });
                    setEditedText(sec.content);
                    setIsEditing(false);
                    setShowDiff(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-100 shadow-xs'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{sec.title}</span>
                    {sec.status === 'Accepted' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        Appraiser Judgment
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        Factual Evidence
                      </span>
                    )}

                    <span className="font-mono text-gray-400">
                      {sec.status === 'Empty' ? 'Not Drafted' : sec.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 p-2 text-[11px] text-gray-500 leading-snug">
            <span className="font-semibold text-gray-700">Governance Rule:</span> AI is mathematically blocked from drafting Reconciliation, Scope of Work, and Certification sections.
          </div>
        </div>

        {/* Right: Section Editor & Narrative View (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E5E0] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-5">
          {/* Header of Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{selectedSection.title}</h2>
                {isJudgmentLocked ? (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono">
                    APPRAISER JUDGMENT: LOCKED
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-mono">
                    FACTUAL: COMPILED FROM APPROVED EVIDENCE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{selectedSection.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {!isJudgmentLocked && selectedSection.status === 'Empty' && (
                <button
                  onClick={handleDraftFactualSection}
                  disabled={isDrafting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isDrafting ? 'Drafting...' : 'Draft Factual Section'}</span>
                </button>
              )}

              {selectedSection.content && !isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditedText(selectedSection.content);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Narrative</span>
                </button>
              )}

              {isEditing && (
                <button
                  onClick={handleAcceptSection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Section</span>
                </button>
              )}
            </div>
          </div>

          {/* Section Body */}
          {selectedSection.content ? (
            <div className="space-y-4">
              {isEditing ? (
                <div>
                  <textarea
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    rows={8}
                    className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 text-xs text-gray-900 leading-relaxed font-serif"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                    <span>Edits are highlighted in tracked changes style upon acceptance.</span>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 hover:text-gray-700 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#FAF9F6] border border-gray-200 text-gray-800 text-xs font-serif leading-relaxed space-y-3">
                  <p>{selectedSection.content}</p>
                </div>
              )}

              {/* Citations Box */}
              {selectedSection.citations && selectedSection.citations.length > 0 && (
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                      Evidence Citations Catalog ({selectedSection.citations.length})
                    </span>
                    <span className="text-[10px] font-mono text-teal-700">Click to inspect</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedSection.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePopoverCitation(c)}
                        className="p-2 rounded-lg bg-white border border-teal-200 hover:border-teal-400 text-left transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <span className="font-mono font-bold text-teal-800 mr-1.5">
                            {c.marker}
                          </span>
                          <span className="font-semibold text-gray-800">{c.field}</span>
                          <div className="text-[10px] text-gray-500 truncate max-w-xs font-mono">
                            {c.source} ({c.page})
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-teal-600 opacity-60 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracked changes diff if accepted */}
              {selectedSection.diff && (
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 text-xs">
                  <div className="font-bold text-blue-900 mb-1">Tracked Revisions Diff</div>
                  <div className="space-y-1">
                    {selectedSection.diff.map((d, i) => (
                      <span
                        key={i}
                        className={
                          d.type === 'add'
                            ? 'text-emerald-800 underline font-medium'
                            : d.type === 'remove'
                            ? 'text-rose-700 line-through'
                            : 'text-gray-700'
                        }
                      >
                        {d.text}{' '}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 space-y-3">
              <FileText className="w-8 h-8 text-gray-300 mx-auto" />
              <div className="text-xs font-semibold text-gray-600">
                {isJudgmentLocked
                  ? 'This section requires certified appraiser qualitative judgment and cannot be automated.'
                  : 'Factual section has not been compiled yet.'}
              </div>
              {!isJudgmentLocked && (
                <button
                  onClick={handleDraftFactualSection}
                  disabled={isDrafting}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
                >
                  {isDrafting ? 'Drafting Narrative...' : 'Draft Factual Section with Citations'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Citation Popover Modal */}
      {activePopoverCitation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-md w-full p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Citation {activePopoverCitation.marker}
                </span>
                <span className="font-bold text-gray-900">{activePopoverCitation.field}</span>
              </div>
              <button
                onClick={() => setActivePopoverCitation(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-gray-400 font-semibold block text-[10px] uppercase">
                  Verified Value
                </label>
                <div className="font-bold text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded-lg border border-gray-200">
                  {activePopoverCitation.value}
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block text-[10px] uppercase">
                  Source Document & Page
                </label>
                <div className="text-gray-700 font-mono text-[11px]">
                  {activePopoverCitation.source} · {activePopoverCitation.page}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setActivePopoverCitation(null)}
                className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
