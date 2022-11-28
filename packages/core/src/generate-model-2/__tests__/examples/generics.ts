interface X<T> {
  t: T
}

export function getGenericType1(): X<number> {
  throw new Error()
}

interface X2<T extends string | number> {
  t: T
}

export function getGenericType2(): X2<string> {
  throw new Error()
}

interface X3<T extends string | boolean> {
  t: T extends string ? number : never
}

export function getGenericType3(): X3<string> {
  throw new Error()
}

export function getGenericType4(): X3<boolean> {
  throw new Error()
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type X4<T extends string | boolean, T2 = T extends string ? string : number> = {
  t: T extends string ? number : never
  t2: T2
}

export function getGenericType5(): X4<string> {
  throw new Error()
}

export function getGenericType6(): X4<boolean> {
  throw new Error()
}
