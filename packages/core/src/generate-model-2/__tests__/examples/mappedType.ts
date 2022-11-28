interface X1 {
  a: Omit<{ a: string; b: string }, "a">
  mb: Omit<{ a: string; b: string }, "b">
  c?: X1
}

export function _getMappedType0(): Pick<X1, "a"> {
  throw new Error()
}

export function getMappedType1(): X1 {
  throw new Error()
}

interface X2 {
  a: Pick<{ a: string; b: string }, "a">
  b: Pick<{ c: string; d: string }, "c">
}

export function getMappedType2(): X2 {
  return {
    a: { a: "b" },
    b: { c: "d" },
  }
}

interface X3 {
  aa: string
  bb: number
  cc: boolean
}

type X4 = {
  [key in keyof X3]?: number
}

export function getMappedType3(): X4 {
  throw new Error()
}

enum X5 {
  Aap = "aap",
  Noot = "noot",
}

type X6 = {
  [key in X5]?: number
}

export function getMappedType4(): X6 {
  throw new Error()
}

enum X7 {
  Aap = 0,
  Noot,
}

type X8 = {
  [key in X7]?: string
}

export function getMappedType5(): X8 {
  throw new Error()
}

type MyTerms = "aap" | "noot"
type MyNames = "aad" | "jaap"

type IdTypes<MyOthers extends string> = `${MyTerms | MyNames | MyOthers}_id`

interface MyTemplateLiteralType1<T extends string> {
  myId: IdTypes<T | "kees">
}

export function getMappedType6(): MyTemplateLiteralType1<"koos"> {
  throw new Error()
}

type Nrs = 1 | 5 | 6
type X9 = {
  [nr in Nrs]: boolean
}

export function getMappedType7(): X9 {
  throw new Error()
}

type X10 = [string, boolean, number]

type X11 = {
  [key in keyof X10]: { x: string }
}

export function getMappedType8(): X11 {
  throw new Error()
}
