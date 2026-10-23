export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Dilepas dengan jeda: pencabutan seketika dapat membatalkan unduhan di sebagian browser (mis. Safari)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
