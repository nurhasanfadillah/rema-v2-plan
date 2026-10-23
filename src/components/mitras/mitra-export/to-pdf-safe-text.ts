// Helvetica bawaan react-pdf memakai WinAnsi (Windows-1252): karakter di luar set ini (emoji, CJK, dsb.)
// tercetak sebagai karakter acak, bukan error. Set yang dipertahankan: U+0020-007E, U+00A0-00FF, dan 27
// karakter tambahan WinAnsi di bawah (€ ‚ ƒ „ … † ‡ ˆ ‰ Š ‹ Œ Ž ‘ ’ “ ” • – — ˜ ™ š › œ ž Ÿ).
const WIN_ANSI_EXTRA_CODE_POINTS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018,
  0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

function isWinAnsiCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    (codePoint >= 0x20 && codePoint <= 0x7e) ||
    (codePoint >= 0xa0 && codePoint <= 0xff) ||
    WIN_ANSI_EXTRA_CODE_POINTS.has(codePoint)
  );
}

export function toPdfSafeText(text: string): string {
  // NFC: huruf + aksen gabungan menjadi satu karakter Latin-1; spread per code point agar emoji terbuang utuh
  const safeText = [...text.normalize('NFC').replace(/\s+/g, ' ')]
    .filter(isWinAnsiCharacter)
    .join('')
    .replace(/ {2,}/g, ' ')
    .trim();

  return safeText === '' ? '-' : safeText;
}
