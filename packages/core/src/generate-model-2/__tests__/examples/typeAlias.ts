// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Message1 = {
  s: string
  n: number
  b: boolean

  os?: string
  on?: number
  ob?: boolean

  nested: NestedMessage1
  oNested?: NestedMessage1
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type NestedMessage1 = {
  s: string
  n: number
  b: boolean

  os?: string
  on?: number
  ob?: boolean
}

export function getTypeAlias1(): Message1 {
  throw new Error()
}

type Message2 = string

export function getTypeAlias2(): Message2 {
  throw new Error()
}

type Message3 = number[]

export function getTypeAlias3(): Message3 {
  throw new Error()
}

type Message4 = Message3

export function getTypeAlias4(): Message4 {
  throw new Error()
}

export function getTypeAlias5(): Message4[] {
  throw new Error()
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Message5 = {
  x: Message4[]
  y: Message2[]
}

export function getTypeAlias6(): Message5[] {
  throw new Error()
}
