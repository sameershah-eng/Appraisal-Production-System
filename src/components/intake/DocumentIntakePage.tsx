import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileSpreadsheet,
  Image,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Scan,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { DocumentItem, FileType } from '../../types';
import { simulateGraphDeltaSync } from '../../services/graphService';
import { runDocumentExtraction, runDurableRetry, ExtractionStep } from '../../services/extractionService';

export const DocumentIntakePage: React.FC = () => {
  const { state, dispatch, activeJob, addAudit, addToast } = useApp();

  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [extractingModalDoc, setExtractingModalDoc] = useState<DocumentItem | null>(null);
  const [extractionSteps, setExtractionSteps] = useState<ExtractionStep[]>([]);
  const [isExecutingExtraction, setIsExecutingExtraction] = useState<boolean>(false);

  const folders = [
    { path: 'ALL', name: 'All Job Files', count: state.documents.length },
    { path: '/Comps/Sales', name: 'Sales Comps', count: state.documents.filter(d => d.folder === '/Comps/Sales').length },
    { path: '/Comps/Rent', name: 'Rent Comps', count: state.documents.filter(d => d.folder === '/Comps/Rent').length },
    { path: '/Comps/Expense', name: 'Expense Comps', count: state.documents.filter(d => d.folder === '/Comps/Expense').length },
    { path: '/Engagement', name: 'Engagement & Letters', count: state.documents.filter(d => d.folder === '/Engagement').length },
    { path: '/Subject', name: 'Subject Property Data', count: state.documents.filter(d => d.folder === '/Subject').length },
    { path: '/Report', name: 'Appraisal Report Drafts', count: state.documents.filter(d => d.folder === '/Report').length },
  ];

  const filteredDocs =
    selectedFolder === 'ALL'
      ? state.documents
      : state.documents.filter(d => d.folder === selectedFolder);

  // Sync from OneDrive button handler
  const handleSyncOneDrive = async () => {
    setIsSyncing(true);
    try {
      const updatedDocs = await simulateGraphDeltaSync(state.documents, state.selectedJobId);
      dispatch({ type: 'SET_DOCUMENTS', payload: updatedDocs });
      
      const newDoc = updatedDocs[0];
      await addAudit({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'MS_Graph_Sync_Daemon',
        actorType: 'SERVICE',
        action: 'SYNC',
        object: `SharePoint:${newDoc.name}`,
        details: `Graph API delta sync detected 1 new file (${(newDoc.sizeBytes / 1024 / 1024).toFixed(2)} MB). Ingested to ${newDoc.folder}.`,
      });

      addToast({
        type: 'success',
        title: 'OneDrive Delta Sync Completed',
        message: `Ingested ${newDoc.name} from Microsoft Graph.`,
      });
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'Unable to communicate with Microsoft Graph API endpoint.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Run extraction on selected or single doc
  const handleStartExtraction = async (doc: DocumentItem) => {
    setExtractingModalDoc(doc);
    setIsExecutingExtraction(true);
    setExtractionSteps([]);

    try {
      const result = await runDocumentExtraction(doc, steps => {
        setExtractionSteps([...steps]);
      });

      if (result.success) {
        dispatch({
          type: 'UPDATE_DOCUMENT',
          payload: { id: doc.id, status: 'Extracted' },
        });

        await addAudit({
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Extraction_Worker_Node_02',
          actorType: 'SERVICE',
          action: 'MODEL_CALL',
          object: doc.name,
          details: `Extraction to Pydantic schema RealEstateDeedSchema_v3 completed successfully. 12 fields parsed.`,
          modelMetadata: {
            modelName: 'claude-3-5-sonnet-20241022',
            promptVersion: 'pr-deed-v4.1.2',
            inputTokens: 3840,
            outputTokens: 612,
            schemaName: 'RealEstateDeedSchema_v3',
            validationStatus: 'VALID',
          },
        });

        addToast({
          type: 'success',
          title: 'Extraction Completed',
          message: `${doc.name} extracted to structured schema with evidence citations.`,
        });
      } else {
        dispatch({
          type: 'UPDATE_DOCUMENT',
          payload: { id: doc.id, status: 'Failed', errorMessage: result.errorMessage },
        });

        await addAudit({
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Extraction_Worker_Node_02',
          actorType: 'SERVICE',
          action: 'MODEL_CALL',
          object: doc.name,
          details: `Pydantic schema validation error: field 'sale_price' OCR alpha glyphs. Checkpoint chk_884219 saved.`,
          modelMetadata: {
            modelName: 'claude-3-5-sonnet-20241022',
            promptVersion: 'pr-deed-v4.1.2',
            inputTokens: 3840,
            outputTokens: 612,
            schemaName: 'RealEstateDeedSchema_v3',
            validationStatus: 'FAILED',
          },
        });

        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Pydantic schema rejected invalid token format. Checkpoint saved for durable retry.',
        });
      }
    } finally {
      setIsExecutingExtraction(false);
    }
  };

  // Durable retry handler for failed doc
  const handleRetryExtraction = async (doc: DocumentItem) => {
    setExtractingModalDoc(doc);
    setIsExecutingExtraction(true);
    setExtractionSteps([]);

    try {
      const result = await runDurableRetry(doc, steps => {
        setExtractionSteps([...steps]);
      });

      if (result.success) {
        dispatch({
          type: 'UPDATE_DOCUMENT',
          payload: { id: doc.id, status: 'Extracted', errorMessage: undefined },
        });

        await addAudit({
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Extraction_Worker_Node_02',
          actorType: 'SERVICE',
          action: 'MODEL_CALL',
          object: doc.name,
          details: `Durable retry from checkpoint chk_884219 succeeded. Repaired OCR alpha glyphs to $8,750,000. Pydantic validation passed.`,
          modelMetadata: {
            modelName: 'claude-3-5-sonnet-20241022',
            promptVersion: 'pr-deed-v4.1.2',
            inputTokens: 1200,
            outputTokens: 410,
            schemaName: 'RealEstateDeedSchema_v3',
            validationStatus: 'VALID',
          },
        });

        addToast({
          type: 'success',
          title: 'Durable Checkpoint Restored & Validated',
          message: 'OCR character ambiguity resolved. Record staged for review.',
        });
      }
    } finally {
      setIsExecutingExtraction(false);
    }
  };

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case 'PDF':
      case 'Scanned PDF':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'XLSX':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'DOCX':
        return <FileCode className="w-4 h-4 text-blue-600" />;
      case 'JPG':
        return <Image className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Document Intake & Microsoft Graph Sync
            </h1>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              Graph API Delta Token: Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            SharePoint library: <span className="font-mono text-gray-700">/Sites/Appraisals/{activeJob.code}</span> · Ingests Deeds, Leases, Statements, and Exhibits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncOneDrive}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E0] hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Graph...' : 'Sync from OneDrive'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Folders, Right File Browser */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left: Folder Tree */}
        <div className="bg-white rounded-2xl border border-[#E7E5E0] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-2">
          <div className="px-2 py-1 text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
            <span>Folder Tree</span>
            <span className="text-[10px] text-gray-400 font-mono">Job {activeJob.code}</span>
          </div>

          <div className="space-y-1">
            {folders.map(f => {
              const isActive = selectedFolder === f.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedFolder(f.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold border border-teal-200/60'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isActive ? (
                      <FolderOpen className="w-4 h-4 text-teal-700 flex-shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 ml-2">{f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 leading-snug p-2">
            <span className="font-semibold text-gray-700">Durable Ingestion:</span> Files are hashed with SHA-256 upon reception and immutable storage tokens are generated.
          </div>
        </div>

        {/* Right: File List Table */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-[#E7E5E0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#E7E5E0] flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {selectedFolder === 'ALL' ? 'All Files' : selectedFolder}
              </span>
              <span className="text-xs text-gray-500">({filteredDocs.length} items)</span>
            </div>

            {selectedDocIds.length > 0 && (
              <button
                onClick={() => {
                  const target = state.documents.find(d => d.id === selectedDocIds[0]);
                  if (target) handleStartExtraction(target);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Extraction ({selectedDocIds.length})</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-gray-500 font-semibold border-b border-[#E7E5E0]">
                <tr>
                  <th className="py-2.5 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedDocIds(filteredDocs.map(d => d.id));
                        } else {
                          setSelectedDocIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Folder</th>
                  <th className="py-2.5 px-3">Size / Modified</th>
                  <th className="py-2.5 px-3">OCR Status</th>
                  <th className="py-2.5 px-3">Extraction Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E0]">
                {filteredDocs.map(doc => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        doc.status === 'Failed' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedDocIds([...selectedDocIds, doc.id]);
                            } else {
                              setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(doc.fileType)}
                          <div>
                            <span className="font-semibold text-gray-900 block truncate max-w-xs" title={doc.name}>
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              sha256: {doc.sha256.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                        {doc.folder}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-gray-600">
                        <div>{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                        <div className="text-[10px] text-gray-400">{doc.modifiedDate}</div>
                      </td>

                      <td className="py-3 px-3">
                        {doc.ocrRequired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Scan className="w-3 h-3 text-amber-600" />
                            OCR Required
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Native PDF</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {doc.status === 'Extracted' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Extracted
                          </span>
                        )}
                        {doc.status === 'Failed' && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Schema Error
                            </span>
                            <div className="text-[10px] text-rose-600 font-mono line-clamp-1 max-w-[180px]" title={doc.errorMessage}>
                              {doc.errorMessage}
                            </div>
                          </div>
                        )}
                        {doc.status === 'Not read' && (
                          <span className="text-[11px] text-gray-400">Not read</span>
                        )}
                        {doc.status === 'Queued' && (
                          <span className="text-[11px] text-amber-600 font-medium">Queued</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.status === 'Failed' ? (
                            <button
                              onClick={() => handleRetryExtraction(doc)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold shadow-xs transition-all"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry Checkpoint</span>
                            </button>
                          ) : doc.status === 'Extracted' ? (
                            <button
                              onClick={() => {
                                if (doc.associatedCompId) {
                                  dispatch({ type: 'SET_SELECTED_REVIEW_COMP', payload: doc.associatedCompId });
                                }
                                dispatch({ type: 'SET_SCREEN', payload: 'review' });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-800 text-[11px] font-semibold transition-all"
                            >
                              <Eye className="w-3 h-3 text-gray-500" />
                              <span>View Evidence</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartExtraction(doc)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold transition-all"
                            >
                              <Play className="w-3 h-3" />
                              <span>Extract</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Extraction Step Progress Modal */}
      {extractingModalDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Structured Schema Extraction
                  </h3>
                  <p className="text-xs text-gray-500 font-mono truncate max-w-xs">
                    {extractingModalDoc.name}
                  </p>
                </div>
              </div>

              {!isExecutingExtraction && (
                <button
                  onClick={() => setExtractingModalDoc(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded"
                >
                  Close
                </button>
              )}
            </div>

            {/* Steps Container */}
            <div className="space-y-3">
              {extractionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    step.status === 'completed'
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : step.status === 'in_progress'
                      ? 'bg-blue-50/60 border-blue-200 text-blue-950 ring-2 ring-blue-100'
                      : step.status === 'failed'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-gray-50/50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{step.name}</span>
                    <span className="font-mono text-[10px] uppercase">
                      {step.status === 'completed' && 'PASSED'}
                      {step.status === 'in_progress' && 'PROCESSING...'}
                      {step.status === 'failed' && 'VALIDATION ERROR'}
                      {step.status === 'pending' && 'WAITING'}
                    </span>
                  </div>
                  {step.detail && (
                    <div className="mt-1 text-[11px] font-mono text-gray-600 leading-snug">
                      {step.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                Pydantic validation enforces strict data integrity rules.
              </span>

              {!isExecutingExtraction && (
                <div className="flex items-center gap-2">
                  {extractingModalDoc.status === 'Extracted' && (
                    <button
                      onClick={() => {
                        setExtractingModalDoc(null);
                        dispatch({ type: 'SET_SCREEN', payload: 'review' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                    >
                      <span>Review Extracted Evidence</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {extractingModalDoc.status === 'Failed' && (
                    <button
                      onClick={() => handleRetryExtraction(extractingModalDoc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry from Checkpoint</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
