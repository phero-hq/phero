import ts from "typescript"
import { ParseError } from "../errors"

export default function findFunctionDeclaration(
  callExpression: ts.CallExpression | ts.NewExpression,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] {
  const declaration = findDeclaration(callExpression.expression, typeChecker)

  if (!declaration) {
    return []
  }

  if (ts.isSetAccessorDeclaration(declaration)) {
    return []
  }

  if (
    ts.isFunctionDeclaration(declaration) ||
    ts.isMethodDeclaration(declaration) ||
    ts.isFunctionDeclaration(declaration) ||
    ts.isConstructorDeclaration(declaration) ||
    ts.isGetAccessorDeclaration(declaration)
  ) {
    return [declaration]
  }

  // Not sure about this one...
  // occurs with `console.log`
  if (ts.isMethodSignature(declaration)) {
    return []
  }

  if (ts.isClassDeclaration(declaration)) {
    return findConstructorAndSuperConstructors(declaration)
  }

  if (
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer &&
    ts.isArrowFunction(declaration.initializer)
  ) {
    return [declaration.initializer]
  }

  throw new ParseError(
    `Unsupported call expression ${declaration.kind.toString()}`,
    declaration,
  )
}

function findConstructorAndSuperConstructors(
  classDeclaration: ts.ClassDeclaration,
): ts.ConstructorDeclaration[] {
  const constructor = classDeclaration.members.find((m) =>
    ts.isConstructorDeclaration(m),
  )

  const extendedClass = classDeclaration.heritageClauses?.find(
    (clause) => clause.token == ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]

  return [
    ...(constructor && ts.isConstructorDeclaration(constructor)
      ? [constructor]
      : []),
    ...(extendedClass && ts.isClassDeclaration(extendedClass)
      ? findConstructorAndSuperConstructors(extendedClass)
      : []),
  ].filter((classElement) => ts.isConstructorDeclaration(classElement))
}

function findDeclaration(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): ts.Declaration | undefined {
  const symbol = typeChecker.getSymbolAtLocation(node)

  if (!symbol) {
    return
  }

  if (symbol.valueDeclaration) {
    return symbol.valueDeclaration
  }

  // external imports
  const declaration = symbol.declarations?.[0]
  if (!declaration) {
    return
  }

  if (isExternalImport(declaration)) {
    return
  }

  if (
    ts.isImportDeclaration(declaration) ||
    ts.isImportClause(declaration) ||
    ts.isImportSpecifier(declaration)
  ) {
    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    return aliasSymbol.valueDeclaration
  }

  return declaration
}

// TODO we should be using isExternal on ts.Program
// We can fix this after the refactor
function isExternalImport(declaration: ts.Node): boolean {
  if (
    ts.isImportDeclaration(declaration) &&
    ts.isStringLiteral(declaration.moduleSpecifier) &&
    !declaration.moduleSpecifier.text.startsWith(".")
  ) {
    return true
  }
  if (ts.isImportClause(declaration)) {
    return isExternalImport(declaration.parent)
  }
  if (ts.isImportSpecifier(declaration)) {
    return isExternalImport(declaration.parent.parent.parent)
  }

  return false
}
