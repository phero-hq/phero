import ts from "typescript"
import { TSElements } from "."

export function generateModifiers(
  arr: (ts.ModifierSyntaxKind | undefined | boolean)[],
): ts.Modifier[] {
  return arr
    .filter((x): x is ts.ModifierSyntaxKind => typeof x == "number")
    .map((flag) => ts.factory.createModifier(flag))
}

export class UnsupportedElementSupportedError extends Error {
  constructor(element: TSElements) {
    super(`Doesn't support ${element.type} yet.`)
  }
}

export function mapChildren<T, X>(
  children: undefined | T | T[],
  mapper: (T: T) => X,
): X[] {
  if (!children) {
    return []
  }
  if (Array.isArray(children)) {
    return children.map(mapper)
  }
  return [mapper(children)]
}
