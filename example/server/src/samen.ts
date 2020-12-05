export { add } from "./calc"

export interface Sjaak {
  x: boolean
}

export async function isSjaak(sjaak: Sjaak): Promise<boolean> {
  return sjaak.x === true
}

export interface Aad {
  x: boolean
}

export async function isAad(aad: Aad): Promise<boolean> {
  return aad.x === true
}
