import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { OrderItem, Mitra, Order } from '../../types';
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
  tableColHeader: { width: '12.5%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableColHeaderDesc: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableColHeaderSubtotal: { width: '12.5%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableColHeaderQty: { width: '8.33%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableColHeaderType: { width: '8.33%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f1f5f9', padding: 5 },
  tableCol: { width: '12.5%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColDesc: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColSubtotal: { width: '12.5%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColQty: { width: '8.33%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColType: { width: '8.33%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
  tableCell: { fontSize: 8, color: '#475569' },
  textRight: { textAlign: 'right' }
});

interface FlattenedOrderItem extends OrderItem {
  orderDate: number;
  orderNumber: string;
  mitraId: string;
  orderType: string;
  superOrder: Order;
}

interface Props {
  items: FlattenedOrderItem[];
  mitras: Mitra[];
  filters: { start: string, end: string, mitraId: string, type: string, status: string, productId: string };
  totalQty: number;
  totalSubtotal: number;
  showSubtotal: boolean;
  recap: { [key: string]: number };
}

export const OrderReportPDF = ({ items, mitras, filters, totalQty, totalSubtotal, showSubtotal, recap }: Props) => {
  const getMitraName = (id: string) => mitras.find(m => m.id === id)?.name || 'Semua Mitra';
  const formatCur = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Pesanan</Text>
          <Text style={styles.subtitle}>
            Periode: {filters.start ? format(new Date(filters.start), 'dd/MM/yyyy') : 'Awal'} - {filters.end ? format(new Date(filters.end), 'dd/MM/yyyy') : 'Akhir'}
          </Text>
          <Text style={styles.subtitle}>Mitra: {filters.mitraId === 'all' ? 'Semua Mitra' : getMitraName(filters.mitraId)}</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Item Pesanan</Text>
            <Text style={styles.summaryValue}>{items.length} Item</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Qty (Pcs)</Text>
            <Text style={styles.summaryValue}>{totalQty} Pcs</Text>
          </View>
          {showSubtotal && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCur(totalSubtotal)}</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Tanggal</Text></View>
            <View style={styles.tableColHeaderType}><Text style={styles.tableCellHeader}>No. Pesanan</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Mitra</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Produk</Text></View>
            <View style={styles.tableColHeaderQty}><Text style={[styles.tableCellHeader, styles.textRight]}>Qty</Text></View>
            <View style={styles.tableColHeaderDesc}><Text style={styles.tableCellHeader}>Deskripsi Desain</Text></View>
            <View style={styles.tableColHeaderType}><Text style={styles.tableCellHeader}>Tipe</Text></View>
            {showSubtotal && <View style={styles.tableColHeaderSubtotal}><Text style={[styles.tableCellHeader, styles.textRight]}>Subtotal</Text></View>}
          </View>
          {items.map(item => (
            <View style={styles.tableRow} key={item.id}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{format(new Date(item.orderDate), 'dd/MM/yyyy HH:mm')}</Text></View>
              <View style={styles.tableColType}><Text style={styles.tableCell}>{item.orderNumber}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{getMitraName(item.mitraId)}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{item.productName}</Text></View>
              <View style={styles.tableColQty}><Text style={[styles.tableCell, styles.textRight]}>{item.qty}</Text></View>
              <View style={styles.tableColDesc}><Text style={styles.tableCell}>{item.designNotes || '-'}</Text></View>
              <View style={styles.tableColType}><Text style={styles.tableCell}>{item.orderType.toUpperCase()}</Text></View>
              {showSubtotal && (
                <View style={styles.tableColSubtotal}><Text style={[styles.tableCell, styles.textRight]}>
                  {formatCur(item.priceSnapshot * item.qty)}
                </Text></View>
              )}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>Rekap Per Produk</Text>
          {Object.entries(recap).map(([name, qty]) => (
            <Text key={name} style={{ fontSize: 9, marginBottom: 4, color: '#475569' }}>- {name}: {qty} Pcs</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
};
