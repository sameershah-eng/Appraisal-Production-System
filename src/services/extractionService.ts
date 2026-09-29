import { DocumentItem, SaleCompData } from '../types';

export interface ExtractionStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
}

export async function runDocumentExtraction(
  doc: DocumentItem,
  onProgress?: (steps: ExtractionStep[]) => void
): Promise<{ success: boolean; comp?: SaleCompData; errorMessage?: string }> {
  const steps: ExtractionStep[] = [
    { name: '1. Fetch via Graph API', status: 'in_progress', detail: `Reading byte stream (${(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB)` },
    { name: '2. Optical Character Recognition (OCR)', status: 'pending', detail: doc.ocrRequired ? 'Running high-density OCR pipeline' : 'Native digital text detected' },
    { name: '3. Document Classification', status: 'pending' },
    { name: '4. Schema Structured Extraction', status: 'pending' },
    { name: '5. Pydantic Schema Validation', status: 'pending' },
  ];

  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 300));

  // Step 1 complete
  steps[0].status = 'completed';
  steps[0].detail = 'Verified SHA-256 integrity hash';
  steps[1].status = 'in_progress';
  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 400));

  // Step 2 complete
  steps[1].status = 'completed';
  steps[1].detail = doc.ocrRequired ? 'OCR complete: 3 pages scanned (300 DPI)' : 'Native PDF text layout parsed';
  steps[2].status = 'in_progress';
  steps[2].detail = 'Classifying instrument type';
  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 350));

  // Step 3 complete
  steps[2].status = 'completed';
  steps[2].detail = `Classified as ${doc.sourceType || 'Commercial Real Estate Deed'}`;
  steps[3].status = 'in_progress';
  steps[3].detail = 'Extracting fields into RealEstateDeedSchema_v3';
  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 450));

  // Check if deliberate fail on doc-006 when not retried
  if (doc.id === 'doc-006' && doc.status === 'Failed') {
    steps[3].status = 'completed';
    steps[3].detail = 'Extracted 12 raw token groups';
    steps[4].status = 'failed';
    steps[4].detail = "ValidationError: Field 'sale_price' value '$8,75O,OOO' failed float validation. OCR character 'O' instead of numeric '0'. Durable checkpoint stored at step 4.";
    onProgress?.([...steps]);
    return {
      success: false,
      errorMessage: "Pydantic ValidationError: Field 'sale_price' value '$8,75O,OOO' failed float validation. OCR character 'O' instead of numeric '0'. Durable checkpoint stored at step 4.",
    };
  }

  // Step 4 & 5 complete
  steps[3].status = 'completed';
  steps[3].detail = 'Extraction confidence average: 94.2%';
  steps[4].status = 'completed';
  steps[4].detail = 'Passed all 14 Pydantic schema validation rules';
  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 200));

  return {
    success: true,
  };
}

export async function runDurableRetry(
  doc: DocumentItem,
  onProgress?: (steps: ExtractionStep[]) => void
): Promise<{ success: boolean; errorMessage?: string }> {
  const steps: ExtractionStep[] = [
    { name: '1. Resume from Checkpoint', status: 'in_progress', detail: 'Loading checkpoint chk_884219 at Step 4 (OCR Raw Tokens)' },
    { name: '2. Applying OCR Character Heuristic', status: 'pending' },
    { name: '3. Re-running Pydantic Schema Validation', status: 'pending' },
    { name: '4. Registering Staged Record', status: 'pending' },
  ];

  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 350));

  steps[0].status = 'completed';
  steps[0].detail = 'Checkpoint restored: state serialized';
  steps[1].status = 'in_progress';
  steps[1].detail = "Transcribed glyphs repaired: '$8,75O,OOO' -> 8750000.00";
  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 400));

  steps[1].status = 'completed';
  steps[2].status = 'in_progress';
  steps[2].detail = 'Validating typed float field against Dallas County tax bounds';
  onProgress?.([...steps]);
  await new Promise(r => setTimeout(r, 350));

  steps[2].status = 'completed';
  steps[2].detail = 'Pydantic validation passed (0 errors)';
  steps[3].status = 'completed';
  steps[3].detail = 'Record ready for appraiser staging review';
  onProgress?.([...steps]);

  return { success: true };
}
