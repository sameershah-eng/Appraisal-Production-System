import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import {
  UserRole,
  AppraisalJob,
  DocumentItem,
  SaleCompData,
  StagedCompRecord,
  ExcelCellMapping,
  FormulaIntegrityReport,
  ReportSection,
  QCFinding,
  AuditEntry,
  ToastNotification,
  ExtractedField,
} from '../types';
import {
  INITIAL_JOBS,
  INITIAL_DOCUMENTS,
  INITIAL_SALE_COMPS,
  INITIAL_STAGED_COMPS,
  INITIAL_EXCEL_MAPPINGS,
  INITIAL_REPORT_SECTIONS,
  INITIAL_QC_FINDINGS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import { createAuditEntry } from '../services/auditService';
import { checkDuplicateComp } from '../services/stagingService';

export type ScreenType =
  | 'dashboard'
  | 'intake'
  | 'review'
  | 'staging'
  | 'excel'
  | 'report'
  | 'qc'
  | 'audit'
  | 'architecture';

export interface AppState {
  currentScreen: ScreenType;
  currentRole: UserRole;
  selectedJobId: string;
  jobs: AppraisalJob[];
  documents: DocumentItem[];
  saleComps: SaleCompData[];
  stagedComps: StagedCompRecord[];
  selectedReviewCompId: string;
  activeCitationHighlight: { page: number; paragraph: number; snippet: string } | null;
  excelMappings: ExcelCellMapping[];
  formulaReport: FormulaIntegrityReport | null;
  simulateExcelTamper: boolean;
  reportSections: ReportSection[];
  selectedReportSectionId: string;
  qcFindings: QCFinding[];
  auditLogs: AuditEntry[];
  toasts: ToastNotification[];
  milestoneActive: boolean;
  milestoneStep: number; // 1 to 6
}

type AppAction =
  | { type: 'SET_SCREEN'; payload: ScreenType }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'SET_JOB'; payload: string }
  | { type: 'SET_SELECTED_REVIEW_COMP'; payload: string }
  | { type: 'SET_ACTIVE_CITATION'; payload: { page: number; paragraph: number; snippet: string } | null }
  | { type: 'SET_DOCUMENTS'; payload: DocumentItem[] }
  | { type: 'UPDATE_DOCUMENT'; payload: Partial<DocumentItem> & { id: string } }
  | { type: 'UPDATE_EXTRACTED_FIELD'; payload: { compId: string; fieldName: keyof SaleCompData; newValue: any; reason: string; user: string } }
  | { type: 'STAGE_COMP'; payload: StagedCompRecord }
  | { type: 'APPROVE_COMP'; payload: { stageId: string; user: string } }
  | { type: 'REJECT_COMP'; payload: { stageId: string; reason: string; user: string } }
  | { type: 'ADD_COMP_COMMENT'; payload: { stageId: string; user: string; text: string } }
  | { type: 'SET_EXCEL_MAPPINGS'; payload: ExcelCellMapping[] }
  | { type: 'SET_FORMULA_REPORT'; payload: FormulaIntegrityReport | null }
  | { type: 'SET_SIMULATE_EXCEL_TAMPER'; payload: boolean }
  | { type: 'UPDATE_REPORT_SECTION'; payload: Partial<ReportSection> & { id: string } }
  | { type: 'SET_SELECTED_REPORT_SECTION'; payload: string }
  | { type: 'SET_QC_FINDINGS'; payload: QCFinding[] }
  | { type: 'RESOLVE_QC_FINDING'; payload: { id: string; note: string; user: string } }
  | { type: 'DISMISS_QC_FINDING'; payload: { id: string; reason: string } }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditEntry }
  | { type: 'SET_AUDIT_LOGS'; payload: AuditEntry[] }
  | { type: 'ADD_TOAST'; payload: Omit<ToastNotification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'START_MILESTONE' }
  | { type: 'SET_MILESTONE_STEP'; payload: number }
  | { type: 'EXIT_MILESTONE' };

const initialState: AppState = {
  currentScreen: 'dashboard',
  currentRole: 'Appraiser',
  selectedJobId: 'job-1',
  jobs: INITIAL_JOBS,
  documents: INITIAL_DOCUMENTS,
  saleComps: INITIAL_SALE_COMPS,
  stagedComps: INITIAL_STAGED_COMPS,
  selectedReviewCompId: 'comp-sale-1',
  activeCitationHighlight: null,
  excelMappings: INITIAL_EXCEL_MAPPINGS,
  formulaReport: null,
  simulateExcelTamper: false,
  reportSections: INITIAL_REPORT_SECTIONS,
  selectedReportSectionId: 'sec-1',
  qcFindings: INITIAL_QC_FINDINGS,
  auditLogs: INITIAL_AUDIT_LOGS,
  toasts: [],
  milestoneActive: false,
  milestoneStep: 1,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'SET_ROLE':
      return { ...state, currentRole: action.payload };

    case 'SET_JOB':
      return { ...state, selectedJobId: action.payload };

    case 'SET_SELECTED_REVIEW_COMP':
      return { ...state, selectedReviewCompId: action.payload };

    case 'SET_ACTIVE_CITATION':
      return { ...state, activeCitationHighlight: action.payload };

    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };

    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(d => (d.id === action.payload.id ? { ...d, ...action.payload } : d)),
      };

    case 'UPDATE_EXTRACTED_FIELD': {
      const { compId, fieldName, newValue, reason, user } = action.payload;
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatedSaleComps = state.saleComps.map(c => {
        if (c.id !== compId) return c;
        const currentField = c[fieldName] as ExtractedField<any>;
        if (!currentField || typeof currentField !== 'object' || !('value' in currentField)) return c;

        const history = currentField.editHistory || [];
        return {
          ...c,
          [fieldName]: {
            ...currentField,
            value: newValue,
            confidence: 100, // human verified
            isEdited: true,
            editHistory: [
              ...history,
              {
                oldValue: currentField.value,
                newValue,
                editedBy: user,
                reason,
                timestamp,
              },
            ],
          },
        };
      });

      // Also update in staged comps if present
      const updatedStaged = state.stagedComps.map(sc => {
        if (sc.data.id !== compId) return sc;
        const comp = updatedSaleComps.find(x => x.id === compId);
        return comp ? { ...sc, data: comp } : sc;
      });

      return {
        ...state,
        saleComps: updatedSaleComps,
        stagedComps: updatedStaged,
      };
    }

    case 'STAGE_COMP':
      return {
        ...state,
        stagedComps: [action.payload, ...state.stagedComps.filter(s => s.id !== action.payload.id)],
      };

    case 'APPROVE_COMP': {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      return {
        ...state,
        stagedComps: state.stagedComps.map(c =>
          c.id === action.payload.stageId
            ? {
                ...c,
                status: 'Approved',
                verifiedEvidence: true,
                approvedBy: action.payload.user,
                approvedAt: now,
                isLocked: true,
              }
            : c
        ),
      };
    }

    case 'REJECT_COMP':
      return {
        ...state,
        stagedComps: state.stagedComps.map(c =>
          c.id === action.payload.stageId
            ? {
                ...c,
                status: 'Rejected',
                rejectionReason: action.payload.reason,
                isLocked: false,
              }
            : c
        ),
      };

    case 'ADD_COMP_COMMENT': {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      return {
        ...state,
        stagedComps: state.stagedComps.map(c =>
          c.id === action.payload.stageId
            ? {
                ...c,
                comments: [
                  ...c.comments,
                  {
                    user: action.payload.user,
                    text: action.payload.text,
                    timestamp: now,
                  },
                ],
              }
            : c
        ),
      };
    }

    case 'SET_EXCEL_MAPPINGS':
      return { ...state, excelMappings: action.payload };

    case 'SET_FORMULA_REPORT':
      return { ...state, formulaReport: action.payload };

    case 'SET_SIMULATE_EXCEL_TAMPER':
      return { ...state, simulateExcelTamper: action.payload };

    case 'UPDATE_REPORT_SECTION':
      return {
        ...state,
        reportSections: state.reportSections.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    case 'SET_SELECTED_REPORT_SECTION':
      return { ...state, selectedReportSectionId: action.payload };

    case 'SET_QC_FINDINGS':
      return { ...state, qcFindings: action.payload };

    case 'RESOLVE_QC_FINDING': {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      return {
        ...state,
        qcFindings: state.qcFindings.map(f =>
          f.id === action.payload.id
            ? {
                ...f,
                status: 'Resolved',
                resolutionNote: action.payload.note,
                resolvedAt: now,
                resolvedBy: action.payload.user,
              }
            : f
        ),
      };
    }

    case 'DISMISS_QC_FINDING':
      return {
        ...state,
        qcFindings: state.qcFindings.map(f =>
          f.id === action.payload.id
            ? {
                ...f,
                status: 'Dismissed',
                resolutionNote: `Dismissed: ${action.payload.reason}`,
              }
            : f
        ),
      };

    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        auditLogs: [...state.auditLogs, action.payload],
      };

    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.payload };

    case 'ADD_TOAST': {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toLocaleTimeString();
      const newToast: ToastNotification = { ...action.payload, id, timestamp };
      return { ...state, toasts: [...state.toasts, newToast] };
    }

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };

    case 'START_MILESTONE':
      return {
        ...state,
        milestoneActive: true,
        milestoneStep: 1,
        currentScreen: 'intake',
      };

    case 'SET_MILESTONE_STEP':
      return { ...state, milestoneStep: action.payload };

    case 'EXIT_MILESTONE':
      return { ...state, milestoneActive: false, milestoneStep: 1 };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addAudit: (entryData: Omit<AuditEntry, 'id' | 'index' | 'prevHash' | 'hash'>) => Promise<void>;
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  activeJob: AppraisalJob;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const activeJob =
    state.jobs.find(j => j.id === state.selectedJobId) || state.jobs[0];

  // Helper to add audit log with automatic cryptographic hash computation
  const addAudit = async (entryData: Omit<AuditEntry, 'id' | 'index' | 'prevHash' | 'hash'>) => {
    try {
      const fullEntry = await createAuditEntry(state.auditLogs, entryData);
      dispatch({ type: 'ADD_AUDIT_LOG', payload: fullEntry });
    } catch (e) {
      console.error('Failed to create audit entry:', e);
    }
  };

  const addToast = (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_TOAST', payload: toast });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addAudit, addToast, activeJob }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
