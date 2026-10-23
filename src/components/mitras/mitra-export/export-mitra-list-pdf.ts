import { downloadBlob } from './download-blob';
import { formatFileDate } from './format-file-date';
import type { MitraSummary } from './mitra-export-types';

export async function exportMitraListPdf(summary: MitraSummary, generatedAt: Date = new Date()): Promise<void> {
  // import() dinamis disengaja: Mitras di-import eager (App.tsx), library PDF baru dimuat saat tombol diklik
  const { createMitraListPdfBlob } = await import('./mitra-list-pdf');
  const blob = await createMitraListPdfBlob(summary, generatedAt);

  downloadBlob(blob, `Daftar_Mitra_${formatFileDate(generatedAt)}.pdf`);
}
