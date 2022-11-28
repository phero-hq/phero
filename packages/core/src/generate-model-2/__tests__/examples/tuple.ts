type X0 = [number]

export function getTuple0(): X0 {
  throw new Error()
}

type X1 = [string, boolean, number]

export function getTuple1(): X1 {
  throw new Error()
}

type X2 = [x: number, y: number, z: number]

export function getTuple2(): X2 {
  throw new Error()
}

type X3 = [string, [number, [boolean, boolean]]]

export function getTuple3(): X3 {
  throw new Error()
}

type X4 = ["aap", string]

export function getTuple4(): X4 {
  throw new Error()
}

type X5 = ["aap", string][]

export function getTuple5(): X5 {
  throw new Error()
}
type X6 = [number, ...string[]]

export function getTuple6(): X6 {
  throw new Error()
}

type X7 = [number, ...{ a: string }[]]

export function getTuple7(): X7 {
  throw new Error()
}
