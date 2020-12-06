export { add } from "./calc"

export interface Sjaak {
  x: boolean
  y: number
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

export async function x(): Promise<void> {}

export interface Y {
  answer: [number, number]
}

export async function answer(y: Y): Promise<void> {}

export type Z = [Aad, Y]

export async function test(z: Z): Promise<void> {}
