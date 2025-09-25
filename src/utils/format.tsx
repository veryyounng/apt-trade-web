export const fmtAmt = (v?: number) => (v ?? 0).toLocaleString();
export const fmtDate = (s?: string) => s ?? '-';
export const fmtArea = (v?: number) => (v ? `${v.toFixed(2)}` : '-');
