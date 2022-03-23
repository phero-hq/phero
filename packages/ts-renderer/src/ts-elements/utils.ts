import ts from "typescript"
import { TSElements } from "."

export function generateModifiers(
  arr: (ts.ModifierSyntaxKind | undefined | boolean)[],
): ts.Modifier[] {
  return arr
    .filter((x): x is ts.ModifierSyntaxKind => x === true)
    .map((flag) => ts.factory.createModifier(flag))
}

export class UnsupportedElementSupportedError extends Error {
  constructor(element: TSElements) {
    super(`Doesn't support ${element.type} yet.`)
  }
}
