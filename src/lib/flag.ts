// Convert ISO 3166-1 alpha-2 country code (e.g. "GB") to flag emoji 🇬🇧.
// Empty / invalid codes return "".
export function flagFor(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  const A = 0x1f1e6;
  return (
    String.fromCodePoint(A + upper.charCodeAt(0) - 65) +
    String.fromCodePoint(A + upper.charCodeAt(1) - 65)
  );
}
