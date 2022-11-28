export function getUnion1(): string | number | boolean {
  throw new Error()
}

export function getUnion2(): string | number | boolean | undefined | null {
  throw new Error()
}

export function getUnion3(): "string" | 123 | false {
  throw new Error()
}

export function getUnion4(): string[] | number[] | boolean[] {
  throw new Error()
}

interface X1 {
  a: string
  b: number
  c: boolean
}

export function getUnion5(): X1[] | X1 {
  throw new Error()
}

type X2 = "str" | 123 | false

export function getUnion6(): X2 {
  throw new Error()
}

type X3 =
  | { a: string }
  | { b: number }
  | {
      c: boolean
    }

export function getUnion7(): X3 {
  throw new Error()
}

export function getUnion8(): X3 | X3[] {
  throw new Error()
}
