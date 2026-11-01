import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface ProcessingTimeReportRow {
  orderNumber: string;
  mitraName: string;
  orderedAt: number;
  packedAt: number;
  totalQty: number;
  durationDays: number;
  kpiCategory: string;
  targetDays: number;
  toleranceDays: number;
  kpiStatus: 'excellent' | 'evaluation' | 'failed';
}

export type ProcessingKpiSummary = { excellent: number; evaluation: number; failed: number };

const KPI_STANDARDS = [
  { category: 'Mikro', quantity: '1 pcs', target: 1, tolerance: 2 },
  { category: 'Sangat kecil', quantity: '2–10 pcs', target: 2, tolerance: 3 },
  { category: 'Kecil', quantity: '11–50 pcs', target: 3, tolerance: 4 },
  { category: 'Menengah', quantity: '51–100 pcs', target: 4, tolerance: 5 },
  { category: 'Besar', quantity: '101–250 pcs', target: 5, tolerance: 7 },
  { category: 'Partai besar', quantity: '251–500 pcs', target: 7, tolerance: 9 },
  { category: 'Partai sangat besar', quantity: '501–1.000 pcs', target: 10, tolerance: 12 },
  { category: 'Mass production', quantity: '> 1.000 pcs', target: 14, tolerance: 17 },
] as const;

const formatCalendarDate = (timestamp: number) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Jakarta',
}).format(new Date(timestamp));

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: '#64748b', marginBottom: 14 },
  summary: { padding: 10, backgroundColor: '#eff6ff', marginBottom: 14, borderRadius: 4 },
  summaryText: { fontSize: 11, fontWeight: 700, color: '#1d4ed8' },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  table: { width: '100%' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', fontWeight: 700, color: '#fff' },
  headerExcellent: { backgroundColor: '#15803d' },
  headerEvaluation: { backgroundColor: '#ca8a04' },
  headerFailed: { backgroundColor: '#dc2626' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  date: { width: '18%', paddingHorizontal: 6, paddingVertical: 6 },
  order: { width: '20%', paddingHorizontal: 6, paddingVertical: 6 },
  mitra: { width: '32%', paddingHorizontal: 6, paddingVertical: 6 },
  quantity: { width: '12%', paddingHorizontal: 6, paddingVertical: 6, textAlign: 'right' },
  duration: { width: '18%', paddingHorizontal: 6, paddingVertical: 6, textAlign: 'right' },
  standardsTitle: { fontSize: 12, fontWeight: 700, marginTop: 18, marginBottom: 6 },
  standardCategory: { width: '30%', paddingHorizontal: 5, paddingVertical: 5 },
  standardQty: { width: '25%', paddingHorizontal: 5, paddingVertical: 5 },
  standardTarget: { width: '22.5%', paddingHorizontal: 5, paddingVertical: 5, textAlign: 'right' },
  standardTolerance: { width: '22.5%', paddingHorizontal: 5, paddingVertical: 5, textAlign: 'right' },
  note: { marginTop: 14, fontSize: 8, color: '#64748b' },
});

export function ProcessingTimeReportPDF({
  rows,
  averageDays,
  kpiSummary,
  filters,
}: {
  rows: ProcessingTimeReportRow[];
  averageDays: number;
  kpiSummary: ProcessingKpiSummary;
  filters: { start: string; end: string; mitraName: string };
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>Laporan Waktu Proses Pesanan</Text>
        <Text style={styles.subtitle}>
          Periode pesanan: {filters.start || 'Semua'} s.d. {filters.end || 'Semua'} · {filters.mitraName}
        </Text>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Rata-rata: {averageDays.toLocaleString('id-ID', { maximumFractionDigits: 0 })} hari · Pesanan terukur: {kpiSummary.excellent + kpiSummary.evaluation + kpiSummary.failed}
          </Text>
          <Text style={styles.note}>
            Excellent: {kpiSummary.excellent} · Perlu Evaluasi: {kpiSummary.evaluation} · Tidak memenuhi KPI: {kpiSummary.failed}
          </Text>
        </View>
        {([
          { key: 'excellent', title: 'Excellent', header: styles.headerExcellent },
          { key: 'evaluation', title: 'Perlu Evaluasi', header: styles.headerEvaluation },
          { key: 'failed', title: 'Tidak memenuhi KPI', header: styles.headerFailed },
        ] as const).map(section => {
          const sectionRows = rows.filter(row => row.kpiStatus === section.key);
          return (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title} ({sectionRows.length})</Text>
              <View style={styles.table}>
                <View style={[styles.tableHeader, section.header]}>
                  <Text style={styles.date}>Tanggal</Text>
                  <Text style={styles.order}>No. Pesanan</Text>
                  <Text style={styles.mitra}>Mitra</Text>
                  <Text style={styles.quantity}>Total Qty</Text>
                  <Text style={styles.duration}>Durasi</Text>
                </View>
                {sectionRows.map(row => (
                  <View key={row.orderNumber} style={styles.row} wrap={false}>
                    <Text style={styles.date}>{formatCalendarDate(row.orderedAt)}</Text>
                    <Text style={styles.order}>{row.orderNumber}</Text>
                    <Text style={styles.mitra}>{row.mitraName}</Text>
                    <Text style={styles.quantity}>{row.totalQty.toLocaleString('id-ID')}</Text>
                    <Text style={styles.duration}>{row.durationDays.toLocaleString('id-ID', { maximumFractionDigits: 0 })} hari</Text>
                  </View>
                ))}
                {sectionRows.length === 0 && <Text style={styles.note}>Tidak ada pesanan pada status ini.</Text>}
              </View>
            </View>
          );
        })}
        <Text style={styles.standardsTitle}>Informasi Standar SLA</Text>
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: '#334155' }]}>
            <Text style={styles.standardCategory}>Kategori</Text>
            <Text style={styles.standardQty}>Qty</Text>
            <Text style={styles.standardTarget}>Target</Text>
            <Text style={styles.standardTolerance}>Batas toleransi</Text>
          </View>
          {KPI_STANDARDS.map(standard => (
            <View key={standard.category} style={styles.row} wrap={false}>
              <Text style={styles.standardCategory}>{standard.category}</Text>
              <Text style={styles.standardQty}>{standard.quantity}</Text>
              <Text style={styles.standardTarget}>{standard.target} hari</Text>
              <Text style={styles.standardTolerance}>{standard.tolerance} hari</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>SLA ini merupakan usulan awal berdasarkan pola laporan Oktober 2026; hari dihitung sebagai hari kalender. Pesanan custom kompleks, pengadaan material, atau proses khusus perlu SLA tersendiri.</Text>
      </Page>
    </Document>
  );
}
