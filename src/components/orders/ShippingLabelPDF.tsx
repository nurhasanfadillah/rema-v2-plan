import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, Mitra } from '../../types';

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  labelHeader: {
    borderBottom: '2px solid #0f172a',
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  orderNumber: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  contentBox: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  phone: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
    marginTop: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 1,
  },
  divider: {
    borderBottom: '1px dashed #cbd5e1',
    marginVertical: 12,
  },
  footerDecoration: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    borderTop: '1px solid #f1f5f9',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});

interface ShippingLabelPDFProps {
  order: Order;
  mitra?: Mitra;
  mitraPhone?: string;
}

export const ShippingLabelPDF: React.FC<ShippingLabelPDFProps> = ({ order, mitra, mitraPhone }) => (
  <Document title={`RESI-${order.orderNumber}`}>
    <Page size="A6" style={styles.page}>
      <View style={styles.labelHeader}>
        <Text style={styles.headerTitle}>LABEL PENGIRIMAN</Text>
        <Text style={styles.orderNumber}>REF: {order.orderNumber}</Text>
      </View>

      {/* Recipient Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Penerima / To:</Text>
        </View>
        <View style={styles.contentBox}>
          <Text style={styles.recipientName}>{order.recipientName || '-'}</Text>
          <Text style={styles.phone}>{order.recipientPhone || '-'}</Text>
          <Text style={styles.address}>{order.recipientAddress || '-'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Sender Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Pengirim / From:</Text>
        </View>
        <View style={styles.contentBox}>
          <Text style={styles.senderName}>{mitra?.name || 'UMUM'}</Text>
          <Text style={styles.phone}>{mitraPhone || '-'}</Text>
        </View>
      </View>
      
      {/* Subtle frame */}
      <View style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, border: '1px solid #f1f5f9', borderRadius: 4, pointerEvents: 'none' }} />
    </Page>
  </Document>
);
