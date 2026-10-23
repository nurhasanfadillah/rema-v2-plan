import { formatFileDate } from './format-file-date';
import { toPdfSafeText } from './to-pdf-safe-text';

const MAX_NAME_PART_LENGTH = 40;

// Tanda diakritik gabungan (U+0300-036F) yang muncul setelah normalisasi NFD
function isCombiningMark(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint >= 0x300 && codePoint <= 0x36f;
}

// Hanya huruf/angka ASCII dan "_"; nama kosong atau tak terbaca menjadi "Tanpa_Nama"
function toFileNamePart(mitraName: string): string {
  const namePart = [...toPdfSafeText(mitraName).normalize('NFD')]
    .filter(character => !isCombiningMark(character))
    .join('')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_NAME_PART_LENGTH)
    .replace(/_+$/, '');

  return namePart === '' ? 'Tanpa_Nama' : namePart;
}

export function buildMitraDetailFileName(mitraName: string, date: Date): string {
  return `Mitra_${toFileNamePart(mitraName)}_${formatFileDate(date)}.pdf`;
}
