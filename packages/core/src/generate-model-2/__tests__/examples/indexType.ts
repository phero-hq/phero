interface X1 {
  [a: string]: boolean
}

export function getIndexType1(): X1 {
  throw new Error()
}

interface X2 {
  [a: number]: boolean
}

export function getIndexType2(): X2 {
  throw new Error()
}

interface X3 {
  [a: number | string]: boolean
}

export function getIndexType3(): X3 {
  throw new Error()
}

interface X4 {
  [a: number | string]: boolean | undefined
}

export function getIndexType4(): X4 {
  throw new Error()
}
