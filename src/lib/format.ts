// Format number with Arabic locale and 2 decimal places (no rounding issues)
export function fmt(n: number): string {
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format number without decimals (for counts/integers)
export function fmtInt(n: number): string {
  return n.toLocaleString('ar-SA');
}
