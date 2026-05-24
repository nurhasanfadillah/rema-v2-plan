import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { LedgerEntry, Mitra } from '../../types';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, padding: 15, backgroundColor: '#f8fafc', borderRadius: 4 },
  summaryBox: { flex: 1 },
  summaryLabel: { fontSize: 9, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '15%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableCol: { width: '15%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColHeaderDesc: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableColDesc: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
  tableCell: { fontSize: 8, color: '#475569' },
  textRight: { textAlign: 'right' },
  textRed: { color: '#dc2626' },
  textGreen: { color: '#059669' }
});

interface Props {
  ledgers: LedgerEntry[];
  mitras: Mitra[];
  filters: { start: string, end: string, mitraId: string };
  totalDebit: number;
  totalCredit: number;
}

export const FinanceReportPDF = ({ ledgers, mitras, filters, totalDebit, totalCredit }: Props) => {
  const getMitraName = (id: string) => mitras.find(m => m.id === id)?.name || 'Semua Mitra';
  const formatCur = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Keuangan</Text>
          <Text style={styles.subtitle}>
            Periode: {filters.start ? format(new Date(filters.start), 'dd/MM/yyyy') : 'Awal'} - {filters.end ? format(new Date(filters.end), 'dd/MM/yyyy') : 'Akhir'}
          </Text>
          <Text style={styles.subtitle}>Mitra: {filters.mitraId === 'all' ? 'Semua Mitra' : getMitraName(filters.mitraId)}</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Debit (Tagihan)</Text>
            <Text style={[styles.summaryValue, styles.textRed]}>{formatCur(totalDebit)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Kredit (Pembayaran)</Text>
            <Text style={[styles.summaryValue, styles.textGreen]}>{formatCur(totalCredit)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Saldo Akhir Piutang</Text>
            <Text style={styles.summaryValue}>{formatCur(totalDebit - totalCredit)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Tanggal</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Mitra</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Sumber</Text></View>
            <View style={styles.tableColHeaderDesc}><Text style={styles.tableCellHeader}>Deskripsi</Text></View>
            <View style={styles.tableColHeader}><Text style={[styles.tableCellHeader, styles.textRight]}>Debit</Text></View>
            <View style={styles.tableColHeader}><Text style={[styles.tableCellHeader, styles.textRight]}>Kredit</Text></View>
          </View>
          {ledgers.map(l => (
            <View style={styles.tableRow} key={l.id}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{format(new Date(l.createdAt), 'dd/MM/yyyy')}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{getMitraName(l.mitraId)}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{l.source.toUpperCase()}</Text></View>
              <View style={styles.tableColDesc}><Text style={styles.tableCell}>{l.description}</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, styles.textRight, l.direction === 'debit' && styles.textRed]}>
                {l.direction === 'debit' ? formatCur(l.nominal) : 'Rp 0'}
              </Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, styles.textRight, l.direction === 'credit' && styles.textGreen]}>
                {l.direction === 'credit' ? formatCur(l.nominal) : 'Rp 0'}
              </Text></View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
