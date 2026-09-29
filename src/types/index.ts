export type UserRole = 'Appraiser' | 'Reviewer' | 'Admin';

export interface AppraisalJob {
  id: string;
  code: string;
  propertyType: 'Industrial Warehouse' | 'Class A Office Park' | 'Last-Mile Distribution Hub' | 'Retail Center';
  subjectAddress: string;
  cityState: string;
  client: string;
  dueDate: string;
  effectiveDate: string;
  status: 'In Progress' | 'Under Review' | 'Completed';
  gla: number; // Gross Leasable Area in SF
  landAcres: number;
  yearBuilt: number;
}

export type FileType = 'PDF' | 'Scanned PDF' | 'DOCX' | 'XLSX' | 'JPG';
export type DocumentExtractionStatus = 'Not read' | 'Queued' | 'Extracted' | 'Failed';

export interface DocumentItem {
  id: string;
  jobId: string;
  folder: string; // e.g. "/Comps/Sales", "/Engagement"
  name: string;
  fileType: FileType;
  sizeBytes: number;
  modifiedDate: string;
  authorized: boolean;
  ocrRequired: boolean;
  status: DocumentExtractionStatus;
  sha256: string;
  sourceType?: 'Warranty Deed' | 'Closing Statement' | 'Broker Flyer' | 'Engagement Letter' | 'Lease Agreement' | 'Operating Statement';
  associatedCompId?: string;
  errorMessage?: string;
}

export interface CitationReference {
  page: number;
  paragraph: number;
  snippet: string;
  confidence: number;
}

export interface ExtractedField<T> {
  value: T;
  confidence: number; // 0 to 100
  citation: CitationReference;
  isEdited?: boolean;
  editHistory?: {
    oldValue: T;
    newValue: T;
    editedBy: string;
    reason: string;
    timestamp: string;
  }[];
}

export interface SaleCompData {
  id: string;
  jobId: string;
  address: ExtractedField<string>;
  apn: ExtractedField<string>;
  city: ExtractedField<string>;
  saleDate: ExtractedField<string>;
  salePrice: ExtractedField<number>;
  buildingSf: ExtractedField<number>;
  landAcres: ExtractedField<number>;
  pricePerSf: ExtractedField<number>;
  grantor: ExtractedField<string>;
  grantee: ExtractedField<string>;
  propertyType: ExtractedField<string>;
  yearBuilt: ExtractedField<number>;
  sourceDocName: string;
  sourceDocPage: number;
  sourceDocId: string;
}

export interface RentCompData {
  id: string;
  jobId: string;
  address: string;
  apn: string;
  tenant: string;
  leaseDate: string;
  leasedSf: number;
  rentPerSfAnnual: number;
  leaseType: 'NNN' | 'Gross' | 'Modified Gross';
  termMonths: number;
  confidence: number;
  sourceDoc: string;
  page: number;
}

export interface ExpenseCompData {
  id: string;
  jobId: string;
  address: string;
  expenseYear: number;
  taxesPerSf: number;
  insurancePerSf: number;
  camPerSf: number;
  totalOpexPerSf: number;
  buildingSf: number;
  confidence: number;
  sourceDoc: string;
  page: number;
}

export type MatchRuleType = 'exact_transaction_blocked' | 'same_property_new_tx_linked' | 'none';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchType: MatchRuleType;
  score: number;
  ruleFired: string;
  matchedCompId?: string;
  matchedCompSummary?: string;
  explanation: string;
}

export interface StagedCompRecord {
  id: string;
  jobId: string;
  compType: 'Sales' | 'Rent' | 'Expense';
  data: SaleCompData;
  duplicateCheck: DuplicateDetectionResult;
  status: 'Pending' | 'Approved' | 'Rejected';
  verifiedEvidence: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  comments: { user: string; text: string; timestamp: string }[];
  isLocked: boolean;
}

export interface PropertyTransactionHistoryItem {
  transactionId: string;
  saleDate: string;
  price: number;
  pricePerSf: number;
  grantor: string;
  grantee: string;
  recordingRef: string;
  documentType: string;
  isCurrentComp: boolean;
}

export interface ExcelCellMapping {
  id: string;
  sourceField: string;
  targetSheet: string;
  cellReference: string;
  namedRange: string;
  dataType: 'currency' | 'number' | 'text' | 'date';
  validationRule: string;
  isLocked: boolean;
  isAdjustmentColumn: boolean;
  currentValue: string | number;
  formulaPreview?: string;
}

export interface FormulaIntegrityReport {
  cellsScannedCount: number;
  beforeHash: string;
  afterHash: string;
  formulasChangedCount: number;
  macrosChangedCount: number;
  formattingPreserved: boolean;
  verifiedAt: string;
  status: 'PASSED' | 'FAILED_INTEGRITY_BREACH';
  tamperedCell?: string;
  tamperedDetails?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  category: 'Factual' | 'Judgment';
  status: 'Empty' | 'Drafted' | 'Accepted';
  description: string;
  content: string;
  citations: {
    marker: string;
    field: string;
    source: string;
    page: string;
    value: string;
  }[];
  diff?: {
    type: 'keep' | 'add' | 'remove';
    text: string;
  }[];
}

export interface QCFinding {
  id: string;
  category: 'Deterministic' | 'Specialist';
  ruleName: string;
  severity: 'Critical' | 'Major' | 'Minor';
  location: string;
  evidenceLink: string;
  suggestedFix: string;
  assignee: string;
  specialistName?: string;
  status: 'Open' | 'Resolved' | 'Dismissed';
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModelMetadata {
  modelName: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  schemaName: string;
  validationStatus: 'VALID' | 'FAILED';
}

export interface AuditEntry {
  id: string;
  index: number;
  timestamp: string;
  actor: string;
  actorType: 'USER' | 'SERVICE';
  action: 'READ' | 'WRITE' | 'MODEL_CALL' | 'APPROVE' | 'REJECT' | 'EDIT' | 'SYNC' | 'QC_RUN' | 'EXCEL_SYNC';
  object: string;
  details: string;
  prevHash: string;
  hash: string;
  modelMetadata?: ModelMetadata;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
}
