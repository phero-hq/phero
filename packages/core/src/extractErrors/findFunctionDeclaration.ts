import ts from "typescript"
import { isExternal } from "../lib/tsUtils"

export default function findFunctionDeclaration(
  callExpression: ts.CallExpression | ts.NewExpression,
  prog: ts.Program,
): ts.FunctionLikeDeclarationBase[] {
  return unpackExpression(callExpression, prog)
}

function unpackExpression(
  expression: ts.Expression,
  prog: ts.Program,
): ts.FunctionLikeDeclarationBase[] {
  if (ts.isIdentifier(expression)) {
    const declaration = getDeclarationForExpression(expression, prog)

    if (!declaration) {
      return []
    }

    return unpackDeclaration(declaration, expression, prog)
  }

  if (ts.isCallExpression(expression)) {
    return [
      ...unpackExpression(expression.expression, prog),
      ...expression.arguments.flatMap((arg) => unpackExpression(arg, prog)),
    ]
  }

  if (ts.isNewExpression(expression)) {
    return [
      ...unpackExpression(expression.expression, prog),
      ...(expression.arguments?.flatMap((arg) => unpackExpression(arg, prog)) ??
        []),
    ]
  }

  if (ts.isYieldExpression(expression)) {
    return expression.expression
      ? unpackExpression(expression.expression, prog)
      : []
  }

  if (ts.isBinaryExpression(expression)) {
    return [expression.left, expression.right].flatMap((sub) =>
      unpackExpression(sub, prog),
    )
  }

  if (ts.isConditionalExpression(expression)) {
    return [
      expression.condition,
      expression.whenTrue,
      expression.whenFalse,
    ].flatMap((sub) => unpackExpression(sub, prog))
  }

  if (ts.isAsExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }

  if (ts.isPrefixUnaryExpression(expression)) {
    return unpackExpression(expression.operand, prog)
  }
  if (ts.isPostfixUnaryExpression(expression)) {
    return unpackExpression(expression.operand, prog)
  }

  if (ts.isDeleteExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }
  if (ts.isTypeOfExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }
  if (ts.isVoidExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }
  if (ts.isAwaitExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }
  if (ts.isTemplateExpression(expression)) {
    return expression.templateSpans.flatMap((s) =>
      unpackExpression(s.expression, prog),
    )
  }
  if (ts.isParenthesizedExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return [
      ...unpackExpression(expression.expression, prog),
      ...unpackExpression(expression.name, prog),
    ]
  }

  if (ts.isElementAccessExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }

  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.flatMap((el) => unpackExpression(el, prog))
  }

  if (ts.isSpreadElement(expression)) {
    return unpackExpression(expression.expression, prog)
  }

  if (ts.isObjectLiteralExpression(expression)) {
    return expression.properties.flatMap((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return unpackExpression(prop.initializer, prog)
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call node as initializer
        return prop.objectAssignmentInitializer
          ? unpackExpression(prop.objectAssignmentInitializer, prog)
          : []
      }
      if (ts.isSpreadAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call node as initializer
        return unpackExpression(prop.expression, prog)
      }

      return []
    })
  }

  if (ts.isTypeAssertionExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }

  if (ts.isNonNullExpression(expression)) {
    return unpackExpression(expression.expression, prog)
  }

  if (
    ts.isToken(expression) &&
    expression.kind === ts.SyntaxKind.SuperKeyword
  ) {
    const declaration = getDeclarationForExpression(expression, prog)
    if (!declaration) {
      return []
    }
    return unpackDeclaration(declaration, expression, prog)
  }

  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
    return [expression]
  }

  return []
}

function unpackDeclaration(
  declaration: ts.Declaration,
  expression: ts.Expression,
  prog: ts.Program,
): ts.FunctionLikeDeclarationBase[] {
  if (ts.isVariableDeclaration(declaration)) {
    if (!declaration.initializer) {
      return []
    }

    return unpackExpression(declaration.initializer, prog)
  }

  if (ts.isSetAccessorDeclaration(declaration)) {
    return []
  }

  // Not sure about this one...
  // occurs with `console.log`
  if (ts.isMethodSignature(declaration)) {
    return []
  }

  if (ts.isClassDeclaration(declaration)) {
    const constructor = declaration.members.find((m) =>
      ts.isConstructorDeclaration(m),
    )

    const extendedClass = declaration.heritageClauses?.find(
      (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
    )?.types[0]

    return [
      ...(constructor && ts.isConstructorDeclaration(constructor)
        ? [constructor]
        : []),
      ...(extendedClass && ts.isClassDeclaration(extendedClass)
        ? unpackDeclaration(extendedClass, expression, prog)
        : []),
    ]
  }

  if (ts.isParameter(declaration)) {
    return []
  }

  if (isExternal(declaration, prog)) {
    return []
  }

  if (
    ts.isImportDeclaration(declaration) ||
    ts.isImportClause(declaration) ||
    ts.isImportSpecifier(declaration)
  ) {
    const typeChecker = prog.getTypeChecker()
    const symbol = typeChecker.getSymbolAtLocation(expression)
    if (!symbol) {
      return []
    }

    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    if (!aliasSymbol.valueDeclaration) {
      return []
    }

    return unpackDeclaration(aliasSymbol.valueDeclaration, expression, prog)
  }

  if (
    ts.isArrowFunction(declaration) ||
    ts.isFunctionDeclaration(declaration) ||
    ts.isMethodDeclaration(declaration) ||
    ts.isConstructorDeclaration(declaration) ||
    ts.isGetAccessorDeclaration(declaration)
  ) {
    return [declaration]
  }

  return []
}

function getDeclarationForExpression(
  expression: ts.Expression,
  prog: ts.Program,
): ts.Declaration | undefined {
  const typeChecker = prog.getTypeChecker()
  const symbol = typeChecker.getSymbolAtLocation(expression)
  const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0]
  return declaration
}
