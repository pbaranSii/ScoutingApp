/** Current season year for age category (e.g. 2025 for 2024/25). */
const SEASON_YEAR = new Date().getFullYear();

/** Map birth year to age category label (e.g. 2009 -> "U16"). */
export function birthYearToCategory(birthYear: number): string {
  const age = SEASON_YEAR - birthYear;
  return `U${Math.min(23, Math.max(8, age))}`;
}

/** Options for pipeline age filter: birth years 2002–2012 with U-label. */
export const AGE_CATEGORY_FILTER_OPTIONS: { value: string; label: string; birthYear: number }[] = (() => {
  const options: { value: string; label: string; birthYear: number }[] = [];
  for (let year = 2002; year <= 2012; year++) {
    const u = birthYearToCategory(year);
    options.push({ value: String(year), label: `${u} (${year})`, birthYear: year });
  }
  return options;
})();
