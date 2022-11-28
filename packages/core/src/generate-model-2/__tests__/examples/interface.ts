interface Message1 {
  s: string
  n: number
  b: boolean

  os?: string
  on?: number
  ob?: boolean

  nested: NestedMessage
  oNested?: NestedMessage
}

interface NestedMessage {
  x: string
  y: string
  z: boolean

  ox?: string
  oy?: string
  oz?: boolean
}

export function getInterface1(): Message1 {
  throw new Error()
}

export function getInterface2(): Message1[] {
  throw new Error()
}

interface Message3 {
  strArr: string[]
  msgArr: Message4[]
}

interface Message4 {
  x: boolean
}

export function getInterface3(): Message3[] {
  throw new Error()
}

interface Message5 extends Message4 {
  y: number
}

export function getInterface4(): Message5 {
  throw new Error()
}

interface Message6 {
  x: number
}
interface Message6 {
  y: number
}

export function getInterface5(): Message6 {
  throw new Error()
}
