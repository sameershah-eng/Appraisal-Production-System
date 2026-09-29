import React, { useState } from 'react';
import {
  Database,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Lock,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Building2,
  Calendar,
  DollarSign,
  Info,
  Check,
  Ban,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { StagedCompRecord } from '../../types';
import { PROPERTY_TRANSACTION_HISTORY, INITIAL_RENT_COMPS, INITIAL_EXPENSE_COMPS } from '../../data/mockData';

export const CompStagingPage: React.FC = () => {
  const { state, dispatch, addAudit, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'Sales' | 'Rent' | 'Expense'>('Sales');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected comp for details / timeline modal
  const [selectedCompForTimeline, setSelectedCompForTimeline] = useState<StagedCompRecord | null>(null);
  const [rejectingComp, setRejectingComp] = useState<StagedCompRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [commentingComp, setCommentingComp] = useState<StagedCompRecord | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [verifiedCheckboxes, setVerifiedCheckboxes] = useState<Record<string, boolean>>({});

  const isReviewerRole = state.currentRole === 'Reviewer';

  // Filtered comps
  const filteredSalesComps = state.stagedComps.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const addr = c.data.address.value.toLowerCase();
      const apn = c.data.apn.value.toLowerCase();
      const city = c.data.city.value.toLowerCase();
      return addr.includes(q) || apn.includes(q) || city.includes(q);
    }
    return true;
  });

  // Handle Approve action
  const handleApprove = async (comp: StagedCompRecord) => {
    if (isReviewerRole) {
      addToast({
        type: 'warning',
        title: 'Action Blocked by Row Level Security',
        message: 'Reviewers may only inspect and comment. Switch to Appraiser role to sign off.',
      });
      return;
    }

    if (!verifiedCheckboxes[comp.id]) {
      addToast({
        type: 'warning',
        title: 'Evidence Verification Required',
        message: 'You must check "I have verified the source evidence" before signing approval.',
      });
      return;
    }

    const userName = 'M. Alvarez, MAI';
    dispatch({
      type: 'APPROVE_COMP',
      payload: { stageId: comp.id, user: userName },
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: userName,
      actorType: 'USER',
      action: 'APPROVE',
      object: `StagedRecord:${comp.id} (${comp.data.address.value})`,
      details: `Appraiser verified 12 source citations against deed PDF. Record locked into immutable staging table.`,
    });

    addToast({
      type: 'success',
      title: 'Comp Approved & Locked',
      message: `${comp.data.address.value} is now locked and authorized for Excel model population.`,
    });
  };

  // Handle Reject action
  const handleConfirmReject = async () => {
    if (!rejectingComp || !rejectionReasonInput.trim()) return;

    const userName = state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : 'S. Patel, Reviewer';

    dispatch({
      type: 'REJECT_COMP',
      payload: {
        stageId: rejectingComp.id,
        reason: rejectionReasonInput,
        user: userName,
      },
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: userName,
      actorType: 'USER',
      action: 'REJECT',
      object: `StagedRecord:${rejectingComp.id}`,
      details: `Rejected comp '${rejectingComp.data.address.value}'. Reason: ${rejectionReasonInput}`,
    });

    addToast({
      type: 'info',
      title: 'Comp Rejected',
      message: `Record ${rejectingComp.data.address.value} marked as Rejected.`,
    });

    setRejectingComp(null);
    setRejectionReasonInput('');
  };

  // Handle Comment action
  const handleAddComment = () => {
    if (!commentingComp || !commentInput.trim()) return;

    const userName = state.currentRole === 'Appraiser' ? 'M. Alvarez, MAI' : state.currentRole === 'Reviewer' ? 'S. Patel, Reviewer' : 'E. Vance, Admin';

    dispatch({
      type: 'ADD_COMP_COMMENT',
      payload: {
        stageId: commentingComp.id,
        user: userName,
        text: commentInput,
      },
    });

    addToast({
      type: 'info',
      title: 'Comment Appended',
      message: 'Appended comment to staged record audit notes.',
    });

    setCommentingComp(null);
    setCommentInput('');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Comp Staging & Deterministic Deduplication
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              PostgreSQL Staging · RLS Enforced
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Incoming comps are checked against normalized APN, transaction date, and spatial geocodes before entering valuation models.
          </p>
        </div>

        {/* Role Enforcement Badge */}
        <div className="flex items-center gap-2">
          {isReviewerRole ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Reviewer Mode: Approvals Gated to Certified Appraiser</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Appraiser Signing Authority: Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
          {(['Sales', 'Rent', 'Expense'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab} Comps ({tab === 'Sales' ? state.stagedComps.length : tab === 'Rent' ? INITIAL_RENT_COMPS.length : INITIAL_EXPENSE_COMPS.length})
            </button>
          ))}
        </div>

        {/* Status Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search address or APN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E7E5E0] rounded-xl focus:ring-2 focus:ring-teal-500 w-48 font-mono text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* SALES COMPS TABLE VIEW */}
      {activeTab === 'Sales' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-gray-500 font-semibold border-b border-[#E7E5E0]">
                <tr>
                  <th className="py-2.5 px-4">Status & APN</th>
                  <th className="py-2.5 px-3">Property Address</th>
                  <th className="py-2.5 px-3">Sale Date</th>
                  <th className="py-2.5 px-3">Sale Price</th>
                  <th className="py-2.5 px-3">Building SF</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-4">Deduplication & Property Match</th>
                  <th className="py-2.5 px-4 text-right">Appraiser Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E0]">
                {filteredSalesComps.map(staged => {
                  const comp = staged.data;
                  const dupe = staged.duplicateCheck;
                  const isChecked = !!verifiedCheckboxes[staged.id];

                  return (
                    <tr
                      key={staged.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        staged.status === 'Approved'
                          ? 'bg-emerald-50/20'
                          : staged.status === 'Rejected'
                          ? 'bg-rose-50/30'
                          : dupe.isDuplicate
                          ? 'bg-slate-100/60'
                          : ''
                      }`}
                    >
                      {/* Status / APN */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {staged.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3 text-emerald-700" />
                              Approved (Locked)
                            </span>
                          )}
                          {staged.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-amber-700" />
                              Awaiting Approval
                            </span>
                          )}
                          {staged.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3 text-rose-700" />
                              Rejected
                            </span>
                          )}
                          <div className="font-mono text-[11px] text-gray-500">
                            {comp.apn.value}
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{comp.address.value}</div>
                        <div className="text-[11px] text-gray-500">{comp.city.value}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {comp.sourceDocName}
                        </div>
                      </td>

                      {/* Sale Date */}
                      <td className="py-3 px-3 font-mono text-gray-700">
                        {comp.saleDate.value}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        ${comp.salePrice.value.toLocaleString()}
                      </td>

                      {/* Building SF */}
                      <td className="py-3 px-3 font-mono text-gray-700">
                        {comp.buildingSf.value.toLocaleString()} SF
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 font-mono font-semibold text-teal-800">
                        ${comp.pricePerSf.value.toFixed(2)}/SF
                      </td>

                      {/* Deduplication & Property Match Results */}
                      <td className="py-3 px-4 max-w-xs">
                        {dupe.matchType === 'exact_transaction_blocked' ? (
                          <div className="p-2 rounded-lg bg-slate-100 border border-slate-300 bg-stripe-slate space-y-1">
                            <div className="flex items-center gap-1 text-slate-800 font-semibold text-[11px]">
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>DUPLICATE BLOCKED</span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-tight">
                              {dupe.ruleFired}
                            </p>
                          </div>
                        ) : dupe.matchType === 'same_property_new_tx_linked' ? (
                          <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-blue-900 flex items-center gap-1">
                                <History className="w-3.5 h-3.5 text-blue-700" />
                                SAME PROPERTY (LINKED)
                              </span>
                              <button
                                onClick={() => setSelectedCompForTimeline(staged)}
                                className="text-[10px] text-blue-700 font-semibold underline hover:text-blue-900"
                              >
                                View History
                              </button>
                            </div>
                            <p className="text-[10px] text-blue-800 leading-tight">
                              {dupe.explanation}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>Unique parcel, arms-length deed.</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {staged.status === 'Approved' ? (
                          <div className="text-[11px] text-gray-500 space-y-0.5">
                            <div className="font-semibold text-gray-800 font-mono">
                              Signed by {staged.approvedBy}
                            </div>
                            <div className="text-[10px] font-mono text-gray-400">
                              {staged.approvedAt}
                            </div>
                          </div>
                        ) : staged.status === 'Rejected' ? (
                          <div className="text-[11px] text-rose-700 space-y-0.5">
                            <div className="font-semibold">Rejected by Appraiser</div>
                            <div className="text-[10px] text-gray-500 font-mono truncate max-w-[160px]" title={staged.rejectionReason}>
                              {staged.rejectionReason}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Evidence verification checkbox */}
                            <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e =>
                                  setVerifiedCheckboxes({
                                    ...verifiedCheckboxes,
                                    [staged.id]: e.target.checked,
                                  })
                                }
                                disabled={isReviewerRole}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span>I verified source evidence</span>
                            </label>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setCommentingComp(staged)}
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                title="Add comment"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setRejectingComp(staged)}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                              >
                                Reject
                              </button>

                              <button
                                onClick={() => handleApprove(staged)}
                                disabled={!isChecked || isReviewerRole}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold text-white shadow-xs transition-all ${
                                  !isChecked || isReviewerRole
                                    ? 'bg-gray-300 cursor-not-allowed opacity-60'
                                    : 'bg-teal-700 hover:bg-teal-800'
                                }`}
                                title={
                                  isReviewerRole
                                    ? 'Reviewers cannot approve (RLS rule)'
                                    : !isChecked
                                    ? 'Must check verification checkbox'
                                    : 'Approve & lock into valuation model'
                                }
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENT COMPS TAB VIEW */}
      {activeTab === 'Rent' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-gray-500 font-semibold border-b border-[#E7E5E0]">
                <tr>
                  <th className="py-2.5 px-4">Tenant / Property</th>
                  <th className="py-2.5 px-3">APN</th>
                  <th className="py-2.5 px-3">Lease Date</th>
                  <th className="py-2.5 px-3">Leased Area (SF)</th>
                  <th className="py-2.5 px-3">Annual Rent ($/SF)</th>
                  <th className="py-2.5 px-3">Type / Term</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-4 text-right">Source Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E0]">
                {INITIAL_RENT_COMPS.map(rent => (
                  <tr key={rent.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{rent.tenant}</div>
                      <div className="text-gray-500">{rent.address}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600">{rent.apn}</td>
                    <td className="py-3 px-3 font-mono text-gray-700">{rent.leaseDate}</td>
                    <td className="py-3 px-3 font-mono">{rent.leasedSf.toLocaleString()} SF</td>
                    <td className="py-3 px-3 font-mono font-bold text-teal-800">
                      ${rent.rentPerSfAnnual.toFixed(2)}/SF/yr
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600">
                      {rent.leaseType} · {rent.termMonths} mos
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-emerald-700 font-semibold">{rent.confidence}%</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-gray-500">
                      {rent.sourceDoc} (p.{rent.page})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSE COMPS TAB VIEW */}
      {activeTab === 'Expense' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-gray-500 font-semibold border-b border-[#E7E5E0]">
                <tr>
                  <th className="py-2.5 px-4">Property Address</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Taxes ($/SF)</th>
                  <th className="py-2.5 px-3">Insurance ($/SF)</th>
                  <th className="py-2.5 px-3">CAM ($/SF)</th>
                  <th className="py-2.5 px-3">Total OPEX ($/SF)</th>
                  <th className="py-2.5 px-3">Building SF</th>
                  <th className="py-2.5 px-4 text-right">Source Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E0]">
                {INITIAL_EXPENSE_COMPS.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-bold text-gray-900">{exp.address}</td>
                    <td className="py-3 px-3 font-mono text-gray-700">{exp.expenseYear} FY</td>
                    <td className="py-3 px-3 font-mono">${exp.taxesPerSf.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono">${exp.insurancePerSf.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono">${exp.camPerSf.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-teal-800">
                      ${exp.totalOpexPerSf.toFixed(2)}/SF
                    </td>
                    <td className="py-3 px-3 font-mono">{exp.buildingSf.toLocaleString()} SF</td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-gray-500">
                      {exp.sourceDoc} (p.{exp.page})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Transaction History Timeline Modal */}
      {selectedCompForTimeline && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Property Transaction History & Appreciation
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    APN: {selectedCompForTimeline.data.apn.value} · {selectedCompForTimeline.data.address.value}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompForTimeline(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            {/* Timeline Items */}
            <div className="space-y-4 py-2">
              {(PROPERTY_TRANSACTION_HISTORY[selectedCompForTimeline.data.apn.value] || []).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs relative ${
                      item.isCurrentComp
                        ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-100'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 font-mono">
                          ${item.price.toLocaleString()}
                        </span>
                        <span className="text-teal-800 font-mono font-semibold">
                          (${item.pricePerSf.toFixed(2)}/SF)
                        </span>
                        {item.isCurrentComp && (
                          <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">
                            CURRENT COMP
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">{item.saleDate}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                      <div>
                        <strong>Grantor:</strong> {item.grantor}
                      </div>
                      <div>
                        <strong>Grantee:</strong> {item.grantee}
                      </div>
                    </div>

                    <div className="mt-1 pt-1 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Doc: {item.documentType}</span>
                      <span>Ref: {item.recordingRef}</span>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Supports market conditions adjustment modeling.</span>
              <button
                onClick={() => setSelectedCompForTimeline(null)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingComp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Reject Staged Comp: {rejectingComp.data.address.value}
            </h3>
            <p className="text-xs text-gray-500">
              Please enter the specific appraisal or compliance reason for rejecting this comparable transaction.
            </p>

            <textarea
              value={rejectionReasonInput}
              onChange={e => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Non-arms-length transaction between related parties; parcel zoning does not permit industrial storage."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 text-xs text-gray-900"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setRejectingComp(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReasonInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentingComp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Add Reviewer Note: {commentingComp.data.address.value}
            </h3>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar text-xs">
              {commentingComp.comments.map((c, i) => (
                <div key={i} className="p-2 rounded bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="font-semibold text-gray-700">{c.user}</span>
                    <span>{c.timestamp}</span>
                  </div>
                  <div className="text-gray-800 mt-1">{c.text}</div>
                </div>
              ))}
            </div>

            <textarea
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Enter appraisal comment or market note..."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 text-xs text-gray-900"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setCommentingComp(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700"
              >
                Close
              </button>
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Append Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
