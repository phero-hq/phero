import ts from "typescript"

export function findCallExpressionsInStatement(
  statement: ts.Statement,
): (ts.CallExpression | ts.NewExpression)[] {
  if (
    ts.isExpressionStatement(statement) ||
    ts.isIfStatement(statement) ||
    ts.isDoStatement(statement) ||
    ts.isWhileStatement(statement) ||
    ts.isReturnStatement(statement) ||
    ts.isWithStatement(statement)
  ) {
    return findCallExpressionsInExpression(statement.expression)
  }

  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations
      .map((d) => d.initializer)
      .flatMap(findCallExpressionsInExpression)
  }

  if (ts.isForStatement(statement)) {
    return [
      ...(statement.initializer &&
      ts.isVariableDeclarationList(statement.initializer)
        ? statement.initializer.declarations.map((d) => d.initializer)
        : [statement.initializer]),
      statement.condition,
      statement.incrementor,
    ].flatMap(findCallExpressionsInExpression)
  }

  if (ts.isForInStatement(statement) || ts.isForOfStatement(statement)) {
    return [
      ...(statement.initializer &&
      ts.isVariableDeclarationList(statement.initializer)
        ? statement.initializer.declarations.map((d) => d.initializer)
        : [statement.initializer]),
      statement.expression,
    ].flatMap(findCallExpressionsInExpression)
  }

  if (ts.isSwitchStatement(statement)) {
    return statement.caseBlock.clauses
      .reduce(
        (result, clause) => {
          return ts.isCaseClause(clause)
            ? [...result, clause.expression]
            : result
        },
        [statement.expression] as ts.Expression[],
      )
      .flatMap(findCallExpressionsInExpression)
  }

  if (ts.isTryStatement(statement)) {
    return findCallExpressionsInExpression(
      statement.catchClause?.variableDeclaration?.initializer,
    )
  }

  return []
}

// TODO support for JSX expressions
export function findCallExpressionsInExpression(
  expr?: ts.Expression,
): (ts.CallExpression | ts.NewExpression)[] {
  if (!expr) {
    return []
  }

  // TODO ? ts.TaggedTemplateExpression

  if (ts.isCallExpression(expr)) {
    return [...expr.arguments.flatMap(findCallExpressionsInExpression), expr]
  }

  if (ts.isNewExpression(expr)) {
    return [
      ...(expr.arguments?.flatMap(findCallExpressionsInExpression) ?? []),
      expr,
    ]
  }

  if (ts.isYieldExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isBinaryExpression(expr)) {
    return [expr.left, expr.right].flatMap(findCallExpressionsInExpression)
  }

  if (ts.isConditionalExpression(expr)) {
    return [expr.condition, expr.whenTrue, expr.whenFalse].flatMap(
      findCallExpressionsInExpression,
    )
  }

  if (ts.isAsExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isPrefixUnaryExpression(expr)) {
    return findCallExpressionsInExpression(expr.operand)
  }
  if (ts.isPostfixUnaryExpression(expr)) {
    return findCallExpressionsInExpression(expr.operand)
  }

  if (ts.isDeleteExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }
  if (ts.isTypeOfExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }
  if (ts.isVoidExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }
  if (ts.isAwaitExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }
  if (ts.isTemplateExpression(expr)) {
    return expr.templateSpans.flatMap((s) =>
      findCallExpressionsInExpression(s.expression),
    )
  }
  if (ts.isParenthesizedExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isPropertyAccessExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isElementAccessExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.flatMap(findCallExpressionsInExpression)
  }

  if (ts.isSpreadElement(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.flatMap((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return findCallExpressionsInExpression(prop.initializer)
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call expr as initializer
        return findCallExpressionsInExpression(prop.objectAssignmentInitializer)
      }
      if (ts.isSpreadAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call expr as initializer
        return findCallExpressionsInExpression(prop.expression)
      }

      return []
    })
  }

  if (ts.isTypeAssertionExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  if (ts.isNonNullExpression(expr)) {
    return findCallExpressionsInExpression(expr.expression)
  }

  return []
}
