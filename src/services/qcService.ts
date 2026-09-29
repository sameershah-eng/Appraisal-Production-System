import { QCFinding, StagedCompRecord, AppraisalJob, DocumentItem } from '../types';

export function calculateReadinessScore(findings: QCFinding[]): {
  score: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  resolvedCount: number;
  totalCount: number;
} {
  const openFindings = findings.filter(f => f.status === 'Open');
  const resolvedCount = findings.filter(f => f.status === 'Resolved').length;
  const criticalCount = openFindings.filter(f => f.severity === 'Critical').length;
  const majorCount = openFindings.filter(f => f.severity === 'Major').length;
  const minorCount = openFindings.filter(f => f.severity === 'Minor').length;

  // Deduction formula
  const deductions = (criticalCount * 25) + (majorCount * 12) + (minorCount * 4);
  const score = Math.max(0, Math.min(100, 100 - deductions));

  return {
    score,
    criticalCount,
    majorCount,
    minorCount,
    resolvedCount,
    totalCount: findings.length,
  };
}

export async function runComprehensiveQC(
  job: AppraisalJob,
  stagedComps: StagedCompRecord[],
  docs: DocumentItem[],
  currentFindings: QCFinding[]
): Promise<QCFinding[]> {
  await new Promise(r => setTimeout(r, 600));

  const updated: QCFinding[] = [...currentFindings];

  // 1. Deterministic: Approved Comps Count
  const approvedComps = stagedComps.filter(c => c.status === 'Approved');
  const existingGridCheck = updated.find(f => f.ruleName === 'Comp count on grid matches approved comps');
  
  if (approvedComps.length >= 3) {
    if (existingGridCheck) {
      existingGridCheck.status = 'Resolved';
      existingGridCheck.resolutionNote = `Verified: ${approvedComps.length} approved sales comps populated into valuation model.`;
    }
  } else {
    if (!existingGridCheck) {
      updated.push({
        id: `qc-${String(updated.length + 1).padStart(3, '0')}`,
        category: 'Deterministic',
        ruleName: 'Comp count on grid matches approved comps',
        severity: 'Critical',
        location: "Workbook 'Sale Comps'!C12:K15",
        evidenceLink: 'USPAP Standard 1-4 minimum comp threshold',
        suggestedFix: `At least 3 approved comparable sales required for credible valuation. Currently ${approvedComps.length} approved.`,
        assignee: 'M. Alvarez, MAI',
        status: 'Open',
      });
    }
  }

  // 2. Specialist: Consistency Reviewer Check
  const existingConsistencyCheck = updated.find(f => f.ruleName === 'Subject GLA Consistency across Records');
  if (!existingConsistencyCheck) {
    updated.push({
      id: `qc-${String(updated.length + 1).padStart(3, '0')}`,
      category: 'Specialist',
      ruleName: 'Subject GLA Consistency across Records',
      severity: 'Minor',
      location: 'Site Plan vs County Tax Records',
      evidenceLink: 'doc-011 Site_Plan_1450_Commerce.pdf',
      suggestedFix: `Subject GLA stated as 84,250 SF. DCAD public card lists 84,100 SF (+150 SF difference). Document exterior wall thickness variance in workfile comments.`,
      assignee: 'Consistency Reviewer',
      specialistName: 'Consistency Specialist',
      status: 'Open',
    });
  }

  return updated;
}
