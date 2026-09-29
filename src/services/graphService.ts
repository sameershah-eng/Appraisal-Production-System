import { DocumentItem } from '../types';

export async function simulateGraphDeltaSync(existingDocs: DocumentItem[], jobId: string): Promise<DocumentItem[]> {
  // Simulate network delay to Microsoft Graph API
  await new Promise(resolve => setTimeout(resolve, 800));

  const newDocId = `doc-${String(existingDocs.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const syncedDoc: DocumentItem = {
    id: newDocId,
    jobId,
    folder: '/Comps/Sales',
    name: 'Special_Warranty_Deed_4500_Airport_Fwy.pdf',
    fileType: 'PDF',
    sizeBytes: 2450000,
    modifiedDate: now,
    authorized: true,
    ocrRequired: false,
    status: 'Not read',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sourceType: 'Warranty Deed',
  };

  return [syncedDoc, ...existingDocs];
}
