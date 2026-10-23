import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { toPdfSafeText } from './to-pdf-safe-text';
import type { MitraDetail } from './mitra-export-types';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  identity: { marginBottom: 16 },
  mitraName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginBottom: 4 },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 4 },
  summaryBox: { flex: 1 },
  summaryLabel: { fontSize: 8, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' },
  summaryValue: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  infoCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12 },
  infoRowDivider: { borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  infoLabel: { width: '38%', fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  infoValue: { width: '62%', fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  textUppercase: { textTransform: 'uppercase' },
  textRed: { color: '#dc2626' },
  textGreen: { color: '#059669' },
  textMuted: { color: '#64748b' },
  footnote: { marginTop: 14, fontSize: 8, color: '#94a3b8' },
});

interface InfoRowProps {
  label: string;
  value: string;
  hasDivider?: boolean;
  isUppercase?: boolean;
}

function InfoRow({ label, value, hasDivider = false, isUppercase = false }: InfoRowProps) {
  return (
    <View style={hasDivider ? [styles.infoRow, styles.infoRowDivider] : styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={isUppercase ? [styles.infoValue, styles.textUppercase] : styles.infoValue}>{value}</Text>
    </View>
  );
}

export interface MitraDetailPDFProps {
  detail: MitraDetail;
  generatedAt: Date;
}

export function MitraDetailPDF({ detail, generatedAt }: MitraDetailPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Detail Info Mitra</Text>
          <Text style={styles.subtitle}>Dicetak: {toPdfSafeText(formatDate(generatedAt.getTime()))}</Text>
        </View>

        <View style={styles.identity}>
          <Text style={styles.mitraName}>{toPdfSafeText(detail.name)}</Text>
          <Text style={[styles.statusText, detail.isArchived ? styles.textMuted : styles.textGreen]}>
            {detail.isArchived ? 'Terarsip' : 'Partner Aktif'}
          </Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Penjualan</Text>
            <Text style={styles.summaryValue}>{formatCurrency(detail.totalSales)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Jumlah Pesanan</Text>
            <Text style={styles.summaryValue}>{`${detail.totalOrders} pesanan`}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Saldo Piutang</Text>
            <Text style={[styles.summaryValue, detail.saldoPiutang > 0 ? styles.textRed : styles.textGreen]}>
              {formatCurrency(detail.saldoPiutang)}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            label="Akun Penanggung Jawab"
            value={detail.responsibleName ? toPdfSafeText(detail.responsibleName) : '-'}
            isUppercase
          />
          <InfoRow label="Kontak WhatsApp" value={detail.phone || '-'} hasDivider />
          <InfoRow
            label="Limit Kredit"
            value={detail.creditLimit ? formatCurrency(detail.creditLimit) : 'Unlimited'}
            hasDivider
          />
        </View>

        <Text style={styles.footnote}>
          Total Penjualan = seluruh pesanan selain batal (draft dan retur ikut terhitung). Saldo Piutang = total debit - total kredit buku besar mitra; negatif = kelebihan bayar. Angka sama dengan panel Detail Info Mitra.
        </Text>
      </Page>
    </Document>
  );
}

export async function createMitraDetailPdfBlob(detail: MitraDetail, generatedAt: Date): Promise<Blob> {
  // Pola Reports.tsx (pdf() + updateContainer()). Ada di berkas ini agar hanya chunk PDF yang lazy yang menyentuh library
  const instance = pdf();
  instance.updateContainer(<MitraDetailPDF detail={detail} generatedAt={generatedAt} />);
  return instance.toBlob();
}
