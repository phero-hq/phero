import ts from "typescript"

export default function parseThrowStatement(
  throwStatement: ts.ThrowStatement,
  prog: ts.Program,
): ts.ClassDeclaration | undefined {
  if (!ts.isNewExpression(throwStatement.expression)) {
    // TODO Maybe emit a warning here?
    return undefined
  }

  const classDeclaration = getClassDeclaration(throwStatement.expression, prog)

  if (classDeclaration === undefined) {
    // class has no Error super type
    return undefined
  }

  const superClasses = getSuperClasses(classDeclaration, [], prog)

  if (superClasses === undefined) {
    // class has no Error super type
    return undefined
  }

  if (!classDeclaration.name) {
    return undefined
  }

  return classDeclaration
}

function getSuperClasses(
  classDeclaration: ts.ClassDeclaration,
  accum: ts.ClassDeclaration[],
  prog: ts.Program,
): ts.ClassDeclaration[] | undefined {
  const extendsType = classDeclaration.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]

  if (!extendsType) {
    // class has no Error super type
    // TODO Maybe emit a warning here?
    return
  }

  const typeNode = prog.getTypeChecker().getTypeFromTypeNode(extendsType)
  const refSymbol = typeNode.aliasSymbol ?? typeNode.symbol

  if (refSymbol.name === "Error") {
    return accum
  }

  const superClass = getClassDeclaration(extendsType, prog)

  if (superClass === undefined) {
    return undefined
  }

  return getSuperClasses(superClass, [...accum, superClass], prog)
}

function getClassDeclaration(
  node: ts.Node,
  prog: ts.Program,
): ts.ClassDeclaration | undefined {
  const type = prog.getTypeChecker().getTypeAtLocation(node)
  const symbol = type.aliasSymbol ?? type.symbol
  const classDeclaration = symbol.valueDeclaration

  if (!classDeclaration || !ts.isClassDeclaration(classDeclaration)) {
    return undefined
  }

  return classDeclaration
}
