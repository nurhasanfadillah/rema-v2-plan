import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { formatCurrency } from '../../../lib/utils';
import type { BillingRecap, BillingRecapFilters } from './billing-recap-types';

const cellBase = {
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#e2e8f0',
  borderLeftWidth: 0,
  borderTopWidth: 0,
  padding: 5,
} as const;

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
  row: { flexDirection: 'row' },
  cell: { ...cellBase },
  cellHeader: { backgroundColor: '#f1f5f9' },
  cellFooter: { backgroundColor: '#f8fafc' },
  colNo: { width: '8%' },
  colName: { width: '42%' },
  colQty: { width: '12%' },
  colPrice: { width: '19%' },
  colTotal: { width: '19%' },
  textHeader: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
  text: { fontSize: 8, color: '#475569' },
  textBold: { fontWeight: 'bold', color: '#0f172a' },
  textRight: { textAlign: 'right' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  recapSpacing: { marginBottom: 16 },
  recapColNo: { width: '10%' },
  recapColName: { width: '70%' },
  recapColQty: { width: '20%' },
  footnote: { marginTop: 12, fontSize: 8, color: '#94a3b8' },
});

export interface BillingRecapPDFProps {
  recap: BillingRecap;
  filters: BillingRecapFilters;
  mitraName: string;
}

export function BillingRecapPDF({ recap, filters, mitraName }: BillingRecapPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Rekap Tagihan per Produk</Text>
          <Text style={styles.subtitle}>
            Periode: {filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : 'Awal'} - {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : 'Akhir'}
          </Text>
          <Text style={styles.subtitle}>Mitra: {mitraName}</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Jumlah Pesanan</Text>
            <Text style={styles.summaryValue}>{recap.orderCount} Pesanan</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Qty (Pcs)</Text>
            <Text style={styles.summaryValue}>{recap.totalQty} Pcs</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Tagihan</Text>
            <Text style={styles.summaryValue}>{formatCurrency(recap.totalAmount)}</Text>
          </View>
        </View>

        {recap.productQty.length > 0 && (
          <View style={styles.recapSpacing}>
            <Text style={styles.sectionTitle} minPresenceAhead={40}>Rekap Produk (harga digabung)</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <View style={[styles.cell, styles.cellHeader, styles.recapColNo]}><Text style={styles.textHeader}>No</Text></View>
                <View style={[styles.cell, styles.cellHeader, styles.recapColName]}><Text style={styles.textHeader}>Produk</Text></View>
                <View style={[styles.cell, styles.cellHeader, styles.recapColQty]}><Text style={[styles.textHeader, styles.textRight]}>Qty</Text></View>
              </View>
              {recap.productQty.map((product, index) => (
                <View style={styles.row} key={product.productId} wrap={false}>
                  <View style={[styles.cell, styles.recapColNo]}><Text style={styles.text}>{index + 1}</Text></View>
                  <View style={[styles.cell, styles.recapColName]}><Text style={styles.text}>{product.productName}</Text></View>
                  <View style={[styles.cell, styles.recapColQty]}><Text style={[styles.text, styles.textRight]}>{product.qty}</Text></View>
                </View>
              ))}
              <View style={styles.row} wrap={false}>
                <View style={[styles.cell, styles.cellFooter, styles.recapColNo]} />
                <View style={[styles.cell, styles.cellFooter, styles.recapColName]}><Text style={[styles.text, styles.textBold]}>TOTAL</Text></View>
                <View style={[styles.cell, styles.cellFooter, styles.recapColQty]}><Text style={[styles.text, styles.textBold, styles.textRight]}>{recap.totalQty}</Text></View>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle} minPresenceAhead={40}>Rincian per Harga Satuan</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.cellHeader, styles.colNo]}><Text style={styles.textHeader}>No</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colName]}><Text style={styles.textHeader}>Produk</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colQty]}><Text style={[styles.textHeader, styles.textRight]}>Qty</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colPrice]}><Text style={[styles.textHeader, styles.textRight]}>Harga Satuan</Text></View>
            <View style={[styles.cell, styles.cellHeader, styles.colTotal]}><Text style={[styles.textHeader, styles.textRight]}>Total</Text></View>
          </View>
          {recap.rows.map((row, index) => (
            <View style={styles.row} key={row.key} wrap={false}>
              <View style={[styles.cell, styles.colNo]}><Text style={styles.text}>{index + 1}</Text></View>
              <View style={[styles.cell, styles.colName]}><Text style={styles.text}>{row.productName}</Text></View>
              <View style={[styles.cell, styles.colQty]}><Text style={[styles.text, styles.textRight]}>{row.qty}</Text></View>
              <View style={[styles.cell, styles.colPrice]}><Text style={[styles.text, styles.textRight]}>{formatCurrency(row.unitPrice)}</Text></View>
              <View style={[styles.cell, styles.colTotal]}><Text style={[styles.text, styles.textRight]}>{formatCurrency(row.total)}</Text></View>
            </View>
          ))}
          <View style={styles.row} wrap={false}>
            <View style={[styles.cell, styles.cellFooter, styles.colNo]} />
            <View style={[styles.cell, styles.cellFooter, styles.colName]}><Text style={[styles.text, styles.textBold]}>TOTAL</Text></View>
            <View style={[styles.cell, styles.cellFooter, styles.colQty]}><Text style={[styles.text, styles.textBold, styles.textRight]}>{recap.totalQty}</Text></View>
            <View style={[styles.cell, styles.cellFooter, styles.colPrice]} />
            <View style={[styles.cell, styles.cellFooter, styles.colTotal]}><Text style={[styles.text, styles.textBold, styles.textRight]}>{formatCurrency(recap.totalAmount)}</Text></View>
          </View>
        </View>

        <Text style={styles.footnote}>
          Hanya pesanan yang sudah tercatat tagihan (Packing atau lebih; batal/retur tidak termasuk). Periode mengacu tanggal tagihan tercatat. Debit manual tidak termasuk dalam rekap. Rekap Produk menggabungkan harga satuan yang berbeda.
        </Text>
      </Page>
    </Document>
  );
}
