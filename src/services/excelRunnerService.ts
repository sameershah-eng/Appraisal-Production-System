import { sha256 } from '../lib/crypto';
import { FormulaIntegrityReport } from '../types';

export interface ExcelStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
}

// Simulated mock formula catalog of 1,284 formula strings representing typical valuation model cells
function generateFormulaCatalog(tampered = false): string[] {
  const formulas: string[] = [];
  for (let i = 1; i <= 1284; i++) {
    if (tampered && i === 48) {
      // Cell G15 tampered
      formulas.push(`Cell_G15_Formula: =D15/F15*1.05 [UNAUTHORIZED_MODIFIER_DETECTED]`);
    } else {
      formulas.push(`Cell_Formula_${i}: =SUM(OFFSET(A${i}, 0, 1, 1, 5))*$Z$1`);
    }
  }
  return formulas;
}

export async function runExcelWorkbookWrite(
  options: {
    simulateTamper: boolean;
    onProgress?: (steps: ExcelStep[]) => void;
  }
): Promise<{ success: boolean; report: FormulaIntegrityReport }> {
  const steps: ExcelStep[] = [
    { name: '1. Open workbook in desktop Excel', status: 'in_progress', detail: 'Connecting to Windows 365 Cloud PC session (Port 5985)' },
    { name: '2. Snapshot formula hashes', status: 'pending' },
    { name: '3. Write mapped input cells only', status: 'pending' },
    { name: '4. Native Excel recalculation', status: 'pending' },
    { name: '5. Re-snapshot formula hashes', status: 'pending' },
    { name: '6. Cryptographic formula hash comparison', status: 'pending' },
    { name: '7. Save and close workbook', status: 'pending' },
  ];

  options.onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 400));

  // Step 1: Open
  steps[0].status = 'completed';
  steps[0].detail = 'Loaded Sales_Comparison_v7.xlsm in Excel 365 (Build 2608)';
  steps[1].status = 'in_progress';
  steps[1].detail = 'Scanning 1,284 formula cells across 4 valuation sheets';
  options.onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 350));

  // Step 2: Pre-hash
  const baseCatalog = generateFormulaCatalog(false);
  const beforeHash = await sha256(baseCatalog.join('\n'));
  steps[1].status = 'completed';
  steps[1].detail = `Formula SHA-256: ${beforeHash.substring(0, 16)}...`;
  steps[2].status = 'in_progress';
  steps[2].detail = "Injecting approved comp values into 'Sale Comps'!C12:F19 (mapped ranges only)";
  options.onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 450));

  // Step 3: Write input cells
  steps[2].status = 'completed';
  steps[2].detail = '32 input cells written. Adjustment columns untouched.';
  steps[3].status = 'in_progress';
  steps[3].detail = 'Executing Application.CalculateFullRebuild()';
  options.onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 350));

  // Step 4: Recalc
  steps[3].status = 'completed';
  steps[3].detail = 'Native engine calculation completed in 142ms';
  steps[4].status = 'in_progress';
  steps[4].detail = 'Re-scanning 1,284 formula tokens';
  options.onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 350));

  // Step 5: Post-hash
  const afterCatalog = generateFormulaCatalog(options.simulateTamper);
  const afterHash = await sha256(afterCatalog.join('\n'));
  steps[4].status = 'completed';
  steps[4].detail = `Formula SHA-256: ${afterHash.substring(0, 16)}...`;
  steps[5].status = 'in_progress';
  steps[5].detail = 'Verifying byte-for-byte formula identity';
  options.onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 400));

  const verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  if (options.simulateTamper) {
    steps[5].status = 'failed';
    steps[5].detail = "INTEGRITY BREACH: Formula mismatch in cell 'Sale Comps'!G15. Expected '=D15/F15', found '=D15/F15*1.05'. Transaction aborted.";
    steps[6].status = 'failed';
    steps[6].detail = 'Workbook rolled back to previous commit. No changes saved.';
    options.onProgress?.([...steps]);

    const report: FormulaIntegrityReport = {
      cellsScannedCount: 1284,
      beforeHash,
      afterHash,
      formulasChangedCount: 1,
      macrosChangedCount: 0,
      formattingPreserved: true,
      verifiedAt,
      status: 'FAILED_INTEGRITY_BREACH',
      tamperedCell: "'Sale Comps'!G15",
      tamperedDetails: "Formula in cell G15 was modified from '=D15/F15' to '=D15/F15*1.05' (+5% artificial inflation). Blocked by runner guardrail.",
    };
    return { success: false, report };
  }

  // Normal valid case
  steps[5].status = 'completed';
  steps[5].detail = 'Match confirmed: 1,284/1,284 formula cells identical. 0 formulas altered.';
  steps[6].status = 'completed';
  steps[6].detail = 'Saved and closed Sales_Comparison_v7.xlsm. Lock released.';
  options.onProgress?.([...steps]);

  const report: FormulaIntegrityReport = {
    cellsScannedCount: 1284,
    beforeHash,
    afterHash,
    formulasChangedCount: 0,
    macrosChangedCount: 0,
    formattingPreserved: true,
    verifiedAt,
    status: 'PASSED',
  };

  return { success: true, report };
}
