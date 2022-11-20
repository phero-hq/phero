import ts from "typescript"
import * as tsx from "../tsx"
import { getNameAsString, hasModifier } from "../lib/tsUtils"

export interface PheroError {
  name: string
  sourceFile: string
  properties: PheroErrorProperty[]
  ref: ts.ClassDeclaration
}

export interface PheroErrorProperty {
  name: string
  type: ts.TypeNode
}

export default function parseThrowStatement(
  throwStatement: ts.ThrowStatement,
  prog: ts.Program,
): PheroError | undefined {
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

  const properties: PheroErrorProperty[] = [
    { name: "message", type: tsx.type.string },
    ...[classDeclaration, ...superClasses].flatMap((classDeclaration) =>
      findPublicProperties(classDeclaration, prog),
    ),
  ]

  if (!classDeclaration.name) {
    return undefined
  }

  return {
    name: classDeclaration.name.text,
    sourceFile: classDeclaration.getSourceFile().fileName,
    properties,
    ref: classDeclaration,
  }
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

function findPublicProperties(
  classDeclaration: ts.ClassDeclaration,
  prog: ts.Program,
): PheroErrorProperty[] {
  const typeChecker = prog.getTypeChecker()
  const result: PheroErrorProperty[] = []

  for (const member of classDeclaration.members) {
    if (
      (ts.isPropertyDeclaration(member) ||
        ts.isGetAccessorDeclaration(member)) &&
      (member.modifiers === undefined ||
        hasModifier(member, ts.SyntaxKind.PublicKeyword))
    ) {
      const typeNode = typeChecker.typeToTypeNode(
        typeChecker.getTypeAtLocation(member),
        member,
        undefined,
      )

      if (typeNode) {
        result.push({
          name: getNameAsString(member.name),
          type: typeNode,
        })
      }
    }

    if (ts.isConstructorDeclaration(member)) {
      for (const param of member.parameters) {
        if (
          hasModifier(param, ts.SyntaxKind.PublicKeyword) &&
          !ts.isObjectBindingPattern(param.name) &&
          !ts.isArrayBindingPattern(param.name)
        ) {
          const typeNode = typeChecker.typeToTypeNode(
            typeChecker.getTypeAtLocation(param),
            param,
            undefined,
          )
          if (typeNode) {
            result.push({
              name: param.name.text,
              type: typeNode,
            })
          }
        }
      }
    }
  }

  return result
}
