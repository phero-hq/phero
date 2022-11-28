// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Person = { age: number; name: string; alive: boolean }
type Age = Person["age"]

export function getIndexedAccess1(): Age {
  throw new Error()
}

type X1 = Person["age" | "name"]

export function getIndexedAccess2(): X1 {
  throw new Error()
}

type X2 = Person[keyof Person]

export function getIndexedAccess3(): X2 {
  throw new Error()
}

type AliveOrName = "alive" | "name"
type X3 = Person[AliveOrName]

export function getIndexedAccess4(): X3 {
  throw new Error()
}
