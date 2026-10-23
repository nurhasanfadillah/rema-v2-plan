// yyyy-MM-dd menurut tanggal lokal (bukan UTC) untuk nama berkas. Tanpa date-fns: format() menarik ±21 kB ke bundle awal.
export function formatFileDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
