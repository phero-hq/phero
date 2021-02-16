export interface Sjaak {
  z: Date
  kees: Kees[]
  kaas: Kaas[]
}
export interface Kees {
  z: Date
}
export interface Kaas {
  koos: {
    z: Date
  }
  uhh: Aad | Banaan
}

interface Aad {
  d: Date
}
interface Banaan {
  b: boolean
}

export async function isSjaak(): Promise<Sjaak> {
  throw new Error()
}
