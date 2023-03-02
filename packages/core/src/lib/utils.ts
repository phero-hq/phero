export function capitalize(s: string): string {
  return s.replace(/^[a-z]{1}/, (a) => a.toUpperCase())
}
