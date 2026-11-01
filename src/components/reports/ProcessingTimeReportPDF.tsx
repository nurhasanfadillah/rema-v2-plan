import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDate } from '../../lib/utils';

export interface ProcessingTimeReportRow {
  orderNumber: string;
  mitraName: string;
  orderedAt: number;
  packedAt: number;
  durationDays: number;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: '#64748b', marginBottom: 14 },
  summary: { padding: 10, backgroundColor: '#eff6ff', marginBottom: 14, borderRadius: 4 },
  summaryText: { fontSize: 11, fontWeight: 700, color: '#1d4ed8' },
  table: { width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 7, paddingHorizontal: 5, fontWeight: 700 },
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  order: { width: '15%' },
  mitra: { width: '20%' },
  date: { width: '25%' },
  duration: { width: '15%', textAlign: 'right' },
  note: { marginTop: 14, fontSize: 8, color: '#64748b' },
});

export function ProcessingTimeReportPDF({
  rows,
  averageDays,
  filters,
}: {
  rows: ProcessingTimeReportRow[];
  averageDays: number;
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
            Rata-rata: {averageDays.toLocaleString('id-ID', { maximumFractionDigits: 2 })} hari · Pesanan terukur: {rows.length}
          </Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.order}>No. Pesanan</Text>
            <Text style={styles.mitra}>Mitra</Text>
            <Text style={styles.date}>Tanggal Pesanan</Text>
            <Text style={styles.date}>Masuk Packing</Text>
            <Text style={styles.duration}>Durasi</Text>
          </View>
          {rows.map(row => (
            <View key={row.orderNumber} style={styles.row} wrap={false}>
              <Text style={styles.order}>{row.orderNumber}</Text>
              <Text style={styles.mitra}>{row.mitraName}</Text>
              <Text style={styles.date}>{formatDate(row.orderedAt)}</Text>
              <Text style={styles.date}>{formatDate(row.packedAt)}</Text>
              <Text style={styles.duration}>{row.durationDays.toLocaleString('id-ID', { maximumFractionDigits: 2 })} hari</Text>
            </View>
          ))}
          {rows.length === 0 && <Text style={styles.note}>Tidak ada tagihan otomatis pesanan pada filter ini.</Text>}
        </View>
        <Text style={styles.note}>Durasi dihitung dari tanggal pesanan dibuat hingga tanggal tagihan otomatis pesanan tercatat sebagai debit.</Text>
      </Page>
    </Document>
  );
}
