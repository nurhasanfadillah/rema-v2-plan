import { buildMitraDetailFileName } from './build-mitra-detail-file-name';
import { downloadBlob } from './download-blob';
import type { MitraDetail } from './mitra-export-types';

export async function exportMitraDetailPdf(detail: MitraDetail, generatedAt: Date = new Date()): Promise<void> {
  // import() dinamis disengaja: Mitras di-import eager (App.tsx), library PDF baru dimuat saat tombol diklik
  const { createMitraDetailPdfBlob } = await import('./mitra-detail-pdf');
  const blob = await createMitraDetailPdfBlob(detail, generatedAt);

  downloadBlob(blob, buildMitraDetailFileName(detail.name, generatedAt));
}
