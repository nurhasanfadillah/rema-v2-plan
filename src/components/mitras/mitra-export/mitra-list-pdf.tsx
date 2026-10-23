import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { toPdfSafeText } from './to-pdf-safe-text';
import type { MitraSummary } from './mitra-export-types';

const cellBase = {
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#e2e8f0',
  borderLeftWidth: 0,
  borderTopWidth: 0,
  padding: 5,
} as const;

const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingHorizontal: 30, paddingBottom: 50, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 4 },
  summaryBox: { flex: 1 },
  summaryLabel: { fontSize: 8, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' },
  summaryValue: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRightWidth: 0, borderBottomWidth: 0 },
  row: { flexDirection: 'row' },
  cell: { ...cellBase },
  cellHeader: { backgroundColor: '#f1f5f9' },
  cellFooter: { backgroundColor: '#f8fafc' },
  colNo: { width: '5%' },
  colName: { width: '27%' },
  colSales: { width: '17%' },
  colOrders: { width: '10%' },
  colBalance: { width: '17%' },
  colLimit: { width: '16%' },
  colStatus: { width: '8%' },
  textHeader: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
  text: { fontSize: 8, color: '#475569' },
  textName: { fontSize: 8, fontWeight: 'bold', color: '#0f172a' },
  textPhone: { fontSize: 7, color: '#94a3b8', marginTop: 1 },
  textBold: { fontWeight: 'bold', color: '#0f172a' },
  textRight: { textAlign: 'right' },
  textRed: { color: '#dc2626' },
  textGreen: { color: '#059669' },
  footnote: { marginTop: 12, fontSize: 8, color: '#94a3b8' },
  pageNumber: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#94a3b8' },
});

export interface MitraListPDFProps {
  summary: MitraSummary;
  generatedAt: Date;
}

export function MitraListPDF({ summary, generatedAt }: MitraListPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Daftar Mitra</Text>
          <Text style={styles.subtitle}>Dicetak: {toPdfSafeText(formatDate(generatedAt.getTime()))}</Text>
          <Text style={styles.subtitle}>
            {summary.totalMitra} mitra ({summary.activeCount} aktif, {summary.archivedCount} arsip)
          </Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Mitra</Text>
            <Text style={styles.summaryValue}>{summary.totalMitra}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Penjualan</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalSales)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Pesanan</Text>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Saldo Piutang</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalSaldoPiutang)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.row} fixed>
            <View style={[styles.cell, styles.cellHeader, styles.colNo]}><Text style={styles.textHeader}>No</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colName]}><Text style={styles.textHeader}>Mitra</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colSales]}><Text style={[styles.textHeader, styles.textRight]}>Total Penjualan</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colOrders]}><Text style={[styles.textHeader, styles.textRight]}>Jumlah Pesanan</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colBalance]}><Text style={[styles.textHeader, styles.textRight]}>Saldo Piutang</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colLimit]}><Text style={[styles.textHeader, styles.textRight]}>Limit Kredit</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colStatus]}><Text style={styles.textHeader}>Status</Text></View>
          </View>

          {summary.rows.map((row, index) => (
            <View style={styles.row} key={row.mitraId} wrap={false}>
              <View style={[styles.cell, styles.colNo]}><Text style={styles.text}>{index + 1}</Text></View>
              <View style={[styles.cell, styles.colName]}>
                <Text style={styles.textName}>{toPdfSafeText(row.name)}</Text>
                <Text style={styles.textPhone}>{`HP: ${row.phone || '-'}`}</Text>
              </View>
              <View style={[styles.cell, styles.colSales]}><Text style={[styles.text, styles.textRight]}>{formatCurrency(row.totalSales)}</Text></View>
              <View style={[styles.cell, styles.colOrders]}><Text style={[styles.text, styles.textRight]}>{row.totalOrders}</Text></View>
              <View style={[styles.cell, styles.colBalance]}>
                <Text style={[styles.text, styles.textRight, row.saldoPiutang > 0 ? styles.textRed : styles.textGreen]}>
                  {formatCurrency(row.saldoPiutang)}
                </Text>
              </View>
              <View style={[styles.cell, styles.colLimit]}>
                <Text style={[styles.text, styles.textRight]}>{row.creditLimit ? formatCurrency(row.creditLimit) : 'Unlimited'}</Text>
              </View>
              <View style={[styles.cell, styles.colStatus]}><Text style={styles.text}>{row.isArchived ? 'Arsip' : 'Aktif'}</Text></View>
            </View>
          ))}

          <View style={styles.row} wrap={false}>
            <View style={[styles.cell, styles.cellFooter, styles.colNo]} />
            <View style={[styles.cell, styles.cellFooter, styles.colName]}><Text style={[styles.text, styles.textBold]}>TOTAL</Text></View>
            <View style={[styles.cell, styles.cellFooter, styles.colSales]}><Text style={[styles.text, styles.textBold, styles.textRight]}>{formatCurrency(summary.totalSales)}</Text></View>
            <View style={[styles.cell, styles.cellFooter, styles.colOrders]}><Text style={[styles.text, styles.textBold, styles.textRight]}>{summary.totalOrders}</Text></View>
            <View style={[styles.cell, styles.cellFooter, styles.colBalance]}><Text style={[styles.text, styles.textBold, styles.textRight]}>{formatCurrency(summary.totalSaldoPiutang)}</Text></View>
            <View style={[styles.cell, styles.cellFooter, styles.colLimit]} />
            <View style={[styles.cell, styles.cellFooter, styles.colStatus]} />
          </View>
        </View>

        <Text style={styles.footnote}>
          Total Penjualan = seluruh pesanan selain batal (draft dan retur ikut terhitung). Saldo Piutang = total debit - total kredit buku besar mitra; negatif = kelebihan bayar. Angka sama dengan halaman Manajemen Mitra.
        </Text>

        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export async function createMitraListPdfBlob(summary: MitraSummary, generatedAt: Date): Promise<Blob> {
  // Pola Reports.tsx (pdf() + updateContainer()). Ada di berkas ini agar hanya chunk PDF yang lazy yang menyentuh library
  const instance = pdf();
  instance.updateContainer(<MitraListPDF summary={summary} generatedAt={generatedAt} />);
  return instance.toBlob();
}
