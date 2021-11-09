export { add } from "./calc"

export interface ExampleInterface {
  a: string
  b: string
}

export async function exampleInterface(): Promise<ExampleInterface> {
  return { a: "a", b: "b" }
}

export namespace ExampleNamespace {
  export interface ExampleNamespacedInterface {
    a: number
    b: number
  }

  export async function exampleNamespacedInterface(): Promise<ExampleNamespacedInterface> {
    return { a: 1, b: 2 }
  }
}
