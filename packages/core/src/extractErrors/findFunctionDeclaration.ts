import ts from "typescript"
import { isExternalDeclaration } from "../tsUtils"

export default function findFunctionDeclaration(
  callExpression: ts.CallExpression | ts.NewExpression,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] {
  return unpackExpression(callExpression, typeChecker)
}

function unpackExpression(
  expression: ts.Expression,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] {
  if (ts.isIdentifier(expression)) {
    const declaration = getDeclarationForExpression(expression, typeChecker)

    if (!declaration) {
      return []
    }

    return unpackDeclaration(declaration, expression, typeChecker)
  }

  if (ts.isCallExpression(expression)) {
    return [
      ...unpackExpression(expression.expression, typeChecker),
      ...expression.arguments.flatMap((arg) =>
        unpackExpression(arg, typeChecker),
      ),
    ]
  }

  if (ts.isNewExpression(expression)) {
    return [
      ...unpackExpression(expression.expression, typeChecker),
      ...(expression.arguments?.flatMap((arg) =>
        unpackExpression(arg, typeChecker),
      ) ?? []),
    ]
  }

  if (ts.isYieldExpression(expression)) {
    return expression.expression
      ? unpackExpression(expression.expression, typeChecker)
      : []
  }

  if (ts.isBinaryExpression(expression)) {
    return [expression.left, expression.right].flatMap((sub) =>
      unpackExpression(sub, typeChecker),
    )
  }

  if (ts.isConditionalExpression(expression)) {
    return [
      expression.condition,
      expression.whenTrue,
      expression.whenFalse,
    ].flatMap((sub) => unpackExpression(sub, typeChecker))
  }

  if (ts.isAsExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }

  if (ts.isPrefixUnaryExpression(expression)) {
    return unpackExpression(expression.operand, typeChecker)
  }
  if (ts.isPostfixUnaryExpression(expression)) {
    return unpackExpression(expression.operand, typeChecker)
  }

  if (ts.isDeleteExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }
  if (ts.isTypeOfExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }
  if (ts.isVoidExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }
  if (ts.isAwaitExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }
  if (ts.isTemplateExpression(expression)) {
    return expression.templateSpans.flatMap((s) =>
      unpackExpression(s.expression, typeChecker),
    )
  }
  if (ts.isParenthesizedExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return [
      ...unpackExpression(expression.expression, typeChecker),
      ...unpackExpression(expression.name, typeChecker),
    ]
  }

  if (ts.isElementAccessExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }

  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.flatMap((el) =>
      unpackExpression(el, typeChecker),
    )
  }

  if (ts.isSpreadElement(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }

  if (ts.isObjectLiteralExpression(expression)) {
    return expression.properties.flatMap((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return unpackExpression(prop.initializer, typeChecker)
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call node as initializer
        return prop.objectAssignmentInitializer
          ? unpackExpression(prop.objectAssignmentInitializer, typeChecker)
          : []
      }
      if (ts.isSpreadAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call node as initializer
        return unpackExpression(prop.expression, typeChecker)
      }

      return []
    })
  }

  if (ts.isTypeAssertionExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }

  if (ts.isNonNullExpression(expression)) {
    return unpackExpression(expression.expression, typeChecker)
  }

  if (
    ts.isToken(expression) &&
    expression.kind === ts.SyntaxKind.SuperKeyword
  ) {
    const declaration = getDeclarationForExpression(expression, typeChecker)
    if (!declaration) {
      return []
    }
    return unpackDeclaration(declaration, expression, typeChecker)
  }

  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
    return [expression]
  }

  return []
}

function unpackDeclaration(
  declaration: ts.Declaration,
  expression: ts.Expression,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] {
  if (ts.isVariableDeclaration(declaration)) {
    if (!declaration.initializer) {
      return []
    }

    return unpackExpression(declaration.initializer, typeChecker)
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
        ? unpackDeclaration(extendedClass, expression, typeChecker)
        : []),
    ]
  }

  if (ts.isParameter(declaration)) {
    return []
  }

  if (isExternalDeclaration(declaration)) {
    return []
  }

  if (
    ts.isImportDeclaration(declaration) ||
    ts.isImportClause(declaration) ||
    ts.isImportSpecifier(declaration)
  ) {
    const symbol = typeChecker.getSymbolAtLocation(expression)
    if (!symbol) {
      return []
    }

    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    if (!aliasSymbol.valueDeclaration) {
      return []
    }

    return unpackDeclaration(
      aliasSymbol.valueDeclaration,
      expression,
      typeChecker,
    )
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
  typeChecker: ts.TypeChecker,
): ts.Declaration | undefined {
  const symbol = typeChecker.getSymbolAtLocation(expression)
  const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0]
  return declaration
}
