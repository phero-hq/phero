enum X1 {
  Aap = "aap",
  Noot = "noot",
  Mies = "mies",
}

export function getEnum1(): X1 {
  throw new Error()
}

enum X2 {
  Aap = 0,
  Noot,
  Mies,
}

export function getEnum2(): X2 {
  throw new Error()
}

enum X3 {
  Aap = "x",
  Noot = 0,
  Mies,
}

export function getEnum3(): X3 {
  throw new Error()
}

export function getEnum32(): X3[] {
  throw new Error()
}

export function getEnum4(): X3.Aap {
  throw new Error()
}

export function getEnum5(): X3.Noot {
  throw new Error()
}

export function getEnum6(): X3.Noot[] {
  throw new Error()
}
