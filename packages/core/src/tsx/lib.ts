import ts from "typescript"

export function generateModifiers(
  arr: (ts.ModifierSyntaxKind | undefined | boolean)[],
): ts.Modifier[] {
  return arr
    .filter((x): x is ts.ModifierSyntaxKind => typeof x === "number")
    .map((flag) => ts.factory.createModifier(flag))
}

export function generateBlock(
  input?: ts.Block | ts.Statement[],
): ts.Block | undefined {
  return Array.isArray(input) ? ts.factory.createBlock(input) : input
}
