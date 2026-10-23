import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { exportMitraDetailPdf } from './export-mitra-detail-pdf';
import { exportMitraListPdf } from './export-mitra-list-pdf';
import type { MitraDetail, MitraSummary } from './mitra-export-types';

export interface UseMitraPdfExportResult {
  isExporting: boolean;
  exportMitraList: (summary: MitraSummary) => Promise<void>;
  exportMitraDetail: (detail: MitraDetail) => Promise<void>;
}

export function useMitraPdfExport(): UseMitraPdfExportResult {
  const [isExporting, setIsExporting] = useState(false);
  // Penjaga klik ganda: state belum sempat ter-render saat klik kedua masuk; dipakai bersama kedua ekspor
  const isExportingRef = useRef(false);

  const runExport = useCallback(async (label: string, exportPdf: () => Promise<void>) => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    setIsExporting(true);
    try {
      await exportPdf();
    } catch (error) {
      console.error(`Ekspor PDF ${label} gagal:`, error);
      toast.error('Gagal membuat PDF');
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, []);

  const exportMitraList = useCallback(
    (summary: MitraSummary) => runExport('Daftar Mitra', () => exportMitraListPdf(summary)),
    [runExport],
  );

  const exportMitraDetail = useCallback(
    (detail: MitraDetail) => runExport('Detail Mitra', () => exportMitraDetailPdf(detail)),
    [runExport],
  );

  return { isExporting, exportMitraList, exportMitraDetail };
}
