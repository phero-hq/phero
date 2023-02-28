import ts from "typescript"

export default function getClassDeclaration(
  node: ts.Node,
  prog: ts.TypeChecker,
): ts.ClassDeclaration | undefined {
  const type = prog.getTypeAtLocation(node)
  const symbol = type.aliasSymbol ?? type.symbol
  const classDeclaration = symbol.valueDeclaration

  if (!classDeclaration || !ts.isClassDeclaration(classDeclaration)) {
    return undefined
  }

  return classDeclaration
}
