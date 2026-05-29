import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Order, Mitra } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';

// Registration of standard-looking fonts is usually safer than external URLs if not handled correctly,
// but @react-pdf/renderer has good defaults.

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b', // slate-800
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  gridCol: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: '#f8fafc',
    padding: '4px 8px',
    borderRadius: 4,
    marginBottom: 6,
    color: '#475569',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '6px 8px',
    borderRadius: '4px 4px 0 0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    padding: '6px 8px',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  
  badge: {
    padding: '3px 8px',
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#475569',
  },
});

interface OrderSPKPDFProps {
  order: Order;
  mitra?: Mitra;
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  waiting_confirmation: 'Antrian Konfirmasi',
  confirmed: 'Dikonfirmasi',
  processing: 'Produksi',
  pressing: 'Press Sablon',
  packing: 'Packing',
  shipped: 'Selesai',
  returned: 'Retur',
  cancelled: 'Batal',
};

export const OrderSPKPDF: React.FC<OrderSPKPDFProps> = ({ order, mitra }) => (
  <Document title={`SPK-${order.orderNumber}`}>
    <Page size="A6" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>SPK PESANAN</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>{order.orderNumber}</Text>
          <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>{formatDate(order.createdAt)}</Text>
        </View>
      </View>

      {/* Info Sections */}
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <Text style={styles.label}>Mitra / Pemesan</Text>
          <Text style={styles.value}>{mitra?.name || 'Umum'}</Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.label}>Jenis Pesanan</Text>
          <Text style={[styles.value, { color: order.type === 'online' ? '#3b82f6' : '#8b5cf6' }]}>
            {order.type === 'online' ? 'LABEL ONLINE' : 'OFFLINE / AMBIL'}
          </Text>
        </View>
      </View>

      {/* Table Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manifest Produksi</Text>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, { fontSize: 7 }]}>DESKRIPSI ITEM</Text>
          <Text style={[styles.colQty, { fontSize: 7 }]}>QTY</Text>
          <Text style={[styles.colTotal, { fontSize: 7 }]}>CETAK</Text>
        </View>

        {order.items.map((item, idx) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{item.productName}</Text>
              {item.isCustomLogo ? (
                <Text style={{ fontSize: 6, color: '#475569', marginTop: 2 }}>{item.designNotes || 'Custom Logo'}</Text>
              ) : (
                <Text style={{ fontSize: 6, color: '#94a3b8', marginTop: 2 }}>Polos</Text>
              )}
            </View>
            <Text style={[styles.colQty, { fontSize: 9, fontWeight: 'bold' }]}>{item.qty}</Text>
            <View style={styles.colTotal}>
              {item.isCustomLogo ? (
                <View style={[styles.badge, { backgroundColor: item.dtfStatus === 'sudah_cetak' ? '#10b98120' : '#f59e0b20', color: item.dtfStatus === 'sudah_cetak' ? '#059669' : '#d97706' }]}>
                  <Text>{item.dtfStatus === 'sudah_cetak' ? 'OK' : 'PENDING'}</Text>
                </View>
              ) : (
                <Text style={{ color: '#cbd5e1', fontSize: 6 }}>-</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Summary Area */}
      <View style={{ marginTop: 10, borderTop: '2px solid #0f172a', paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
        <View style={{ textAlign: 'right' }}>
           <Text style={styles.label}>Final Quantity</Text>
           <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{order.totalQty} <Text style={{ fontSize: 8, color: '#64748b' }}>PCS</Text></Text>
        </View>
      </View>
    </Page>
  </Document>
);
