interface X1 {
  a: string
  b: number
  c: boolean
}

interface X2 {
  oa?: string
  ob?: number
  oc?: boolean
}
export function getIntersection1(): X1 & X2 {
  throw new Error()
}

type X3 = X1 & X2

export function getIntersection2(): X3 {
  throw new Error()
}

interface X4 {
  oa: "str"
  ob: 123
  oc: true
}

export function getIntersection3(): X3 & X4 {
  throw new Error()
}

export function getIntersection4(): (X3 & X4)[] {
  throw new Error()
}
