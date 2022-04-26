import ts from "typescript"
import { ParseError } from "../errors"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

export default function extractErrors(
  func: ts.FunctionLikeDeclarationBase,
  typeChecker: ts.TypeChecker,
): ts.ThrowStatement[] {
  return recursivelyFindThrowStatements(func, typeChecker)
}

export function parseThrowStatement(
  throwStatement: ts.ThrowStatement,
  typeChecker: ts.TypeChecker,
): boolean {
  if (!ts.isNewExpression(throwStatement.expression)) {
    throw new ParseError(
      `throw statement should be like "throw new SomeError()"`,
      throwStatement.expression,
    )
  }

  const classDeclaration = getClassDeclaration(
    throwStatement.expression,
    typeChecker,
  )

  if (!isDescendantOfError(classDeclaration, typeChecker)) {
    throw new ParseError(
      `Error class should be subtype of Error`,
      throwStatement.expression,
    )
  }

  console.log("classDeclaration.members", classDeclaration.members.length)
  classDeclaration.members.forEach((m) => {
    console.log(m.name?.getText())
  })

  // TODO get all classDeclarations en daar dan alle public members van

  return true
}

function isDescendantOfError(
  classDeclaration: ts.ClassDeclaration,
  typeChecker: ts.TypeChecker,
): boolean {
  const extendsType = classDeclaration.heritageClauses?.find(
    (clause) => clause.token == ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]

  if (!extendsType) {
    return false
  }

  const typeNode = typeChecker.getTypeFromTypeNode(extendsType)
  const refSymbol = typeNode.aliasSymbol ?? typeNode.symbol

  return (
    refSymbol.name === "Error" ||
    isDescendantOfError(
      getClassDeclaration(extendsType, typeChecker),
      typeChecker,
    )
  )
}

function getClassDeclaration(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): ts.ClassDeclaration {
  const type = typeChecker.getTypeAtLocation(node)
  const symbol = type.aliasSymbol ?? type.symbol
  const classDeclaration = symbol.valueDeclaration

  if (!classDeclaration || !ts.isClassDeclaration(classDeclaration)) {
    throw new ParseError(
      `throw statement should throw an instance of a subtype of Error`,
      node,
    )
  }

  return classDeclaration
}
