export function getObjectLiteral1(): { a: string; b: boolean; c: number } {
  throw new Error()
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type X1 = {
  a: string
  b: boolean
  c: number

  d: {
    a: string
    b: boolean
    c: number
  }
}

export function getObjectLiteral2(): X1 {
  throw new Error()
}

export function getObjectLiteral3(): X1[] {
  throw new Error()
}

export function getObjectLiteral4(): {
  a: string
  b: boolean
  c: number

  d: {
    a: string
    b: boolean
    c: number
  }
} {
  throw new Error()
}

export function getObjectLiteral5(): {
  a: string
  b: boolean
  c: number

  d: {
    a: string
    b: boolean
    c: number
  }[]
}[] {
  throw new Error()
}
