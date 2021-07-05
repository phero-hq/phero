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

export namespace A {
  export async function b(): Promise<boolean> {
    return true
  }
  export async function c(): Promise<boolean> {
    return true
  }
}

export namespace A.Nested {
  export async function nested(): Promise<boolean> {
    return true
  }
}

export namespace X.Y {
  export async function z(): Promise<boolean> {
    return true
  }
}
