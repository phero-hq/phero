import ts from "typescript"
import { isExternalDeclaration } from "../tsUtils"

export default function findFunctionDeclaration(
  callExpression: ts.CallExpression | ts.NewExpression,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] {
  console.log(
    "callExpression",
    callExpression.expression.kind,
    callExpression.getText(),
  )
  // const declarations = findDeclaration(callExpression.expression, typeChecker)

  const symbol = typeChecker.getSymbolAtLocation(callExpression.expression)

  if (!symbol) {
    console.log("[]", 1)
    return []
  }

  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]

  if (!declaration) {
    console.log("[]", 2)
    return []
  }

  if (ts.isSetAccessorDeclaration(declaration)) {
    console.log("[]", 4)
    return []
  }

  // Not sure about this one...
  // occurs with `console.log`
  if (ts.isMethodSignature(declaration)) {
    console.log("[]", 5)
    return []
  }

  if (ts.isClassDeclaration(declaration)) {
    return findConstructorAndSuperConstructors(declaration)
  }

  if (ts.isParameter(declaration)) {
    console.log("[]", 6)
    return []
  }

  if (isFunctionLike(declaration)) {
    // TODO callExpression.arguments

    return [declaration]
  }

  // TODO deze if moet weg
  if (
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer &&
    isFunctionLike(declaration.initializer)
  ) {
    return [declaration.initializer]
  }

  // TODO deze if moet weg
  if (
    ts.isNewExpression(callExpression) &&
    ts.isIdentifier(callExpression.expression) &&
    callExpression.expression.text === "Promise" &&
    callExpression.arguments?.length === 1 &&
    isFunctionLike(callExpression.arguments[0])
  ) {
    const promiseExecutor = callExpression.arguments[0]
    // TODO: we detected `new Promise((resolve, reject) => ...)`
    // we should also catch calls on the "reject" function in order
    // to find all errors
    return [promiseExecutor]
  }

  // TODO staat deze op de juiste plek?
  if (isExternalDeclaration(declaration)) {
    console.log("[]", 3)
    return []
  }

  if (
    ts.isImportDeclaration(declaration) ||
    ts.isImportClause(declaration) ||
    ts.isImportSpecifier(declaration)
  ) {
    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    if (!aliasSymbol.valueDeclaration) {
      return []
    }
    if (isFunctionLike(aliasSymbol.valueDeclaration)) {
      return [aliasSymbol.valueDeclaration]
    }
  }

  // if (ts.isPropertyAssignment(declaration)) {
  //   return findDeclaration(declaration.initializer, typeChecker)
  // }

  // console.log("callExpression.expression", callExpression.expression.getText())
  // console.log("declaration", declaration.getText())
  // console.log("declaration", declaration.getSourceFile().fileName)

  // throw new ParseError(
  //   `Unsupported call expression ${declaration.kind.toString()}`,
  //   declaration,
  // )

  console.log("findDeclarations()")
  return findDeclarations(callExpression.expression, typeChecker)
}

function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclarationBase {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node)
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

function findDeclarations(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] {
  console.log("NODE", node.kind)

  if (ts.isPropertyAccessExpression(node)) {
    return findDeclarations(node.expression, typeChecker)
  }

  if (ts.isIdentifier(node)) {
    const symbol = typeChecker.getSymbolAtLocation(node)

    if (!symbol?.valueDeclaration) {
      return []
    }

    return findDeclarations(symbol.valueDeclaration, typeChecker)
  }

  if (ts.isVariableDeclaration(node)) {
    if (!node.initializer) {
      return []
    }

    return findDeclarations(node.initializer, typeChecker)
  }

  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return findDeclarations(prop.initializer, typeChecker)
      }
      if (
        ts.isShorthandPropertyAssignment(prop) &&
        prop.objectAssignmentInitializer
      ) {
        // TODO follow prop.name, it could reference a variable with a call expr as initializer
        return findDeclarations(prop.objectAssignmentInitializer, typeChecker)
      }
      if (ts.isSpreadAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call expr as initializer
        return findDeclarations(prop.expression, typeChecker)
      }

      return []
    })
  }

  // if (ts.isPropertyAssignment(node)) {
  //   return findDeclarations(node.initializer, typeChecker)
  // }

  // if (ts.isElementAccessExpression(node)) {
  //   for (const x of findFunctionRefInsideVar(node, typeChecker)) {
  //     console.log("X", x.getText())
  //   }
  // }

  // const symbol = typeChecker.getSymbolAtLocation(node)

  // if (!symbol) {
  //   return []
  // }

  // const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]

  // if (!declaration) {
  //   return []
  // }

  // if (isExternalDeclaration(declaration)) {
  //   return []
  // }

  // if (
  //   ts.isImportDeclaration(declaration) ||
  //   ts.isImportClause(declaration) ||
  //   ts.isImportSpecifier(declaration)
  // ) {
  //   const aliasSymbol = typeChecker.getAliasedSymbol(symbol)

  //   if (!aliasSymbol.valueDeclaration) {
  //     return []
  //   }
  //   if (isFunctionLike(aliasSymbol.valueDeclaration)) {
  //     return [aliasSymbol.valueDeclaration]
  //   }
  // }

  // if (isFunctionLike(node)) {
  //   return [node]
  // }

  if (isFunctionLike(node)) {
    return [node]
  }

  console.log("OEPS!")

  return []
}

/**
 * Makes sure it can find funcTwo & funcThree:
 * const obj = {
 *    aad: {
 *       x: funcTwo,
 *       y: funcThree,
 *    },
 * }
 */
function findFunctionRefInsideVar(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): ts.Declaration[] {
  if (ts.isPropertyAssignment(node)) {
    if (!node.initializer) {
      return []
    }
    return findFunctionRefInsideVar(node.initializer, typeChecker)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return findFunctionRefInsideVar(node.expression, typeChecker)
  }

  if (ts.isElementAccessExpression(node)) {
    const symbol = typeChecker.getSymbolAtLocation(node.expression)

    if (!symbol?.valueDeclaration) {
      return []
    }

    return findFunctionRefInsideVar(symbol.valueDeclaration, typeChecker)
  }

  if (ts.isVariableDeclaration(node)) {
    if (!node.initializer) {
      return []
    }

    return findFunctionRefInsideVar(node.initializer, typeChecker)
  }

  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((prop) => {
      if (ts.isPropertyAssignment(prop)) {
        return findFunctionRefInsideVar(prop.initializer, typeChecker)
      }
      if (
        ts.isShorthandPropertyAssignment(prop) &&
        prop.objectAssignmentInitializer
      ) {
        // TODO follow prop.name, it could reference a variable with a call expr as initializer
        return findFunctionRefInsideVar(
          prop.objectAssignmentInitializer,
          typeChecker,
        )
      }
      if (ts.isSpreadAssignment(prop)) {
        // TODO follow prop.name, it could reference a variable with a call expr as initializer
        return findFunctionRefInsideVar(prop.expression, typeChecker)
      }

      return []
    })
  }

  if (ts.isIdentifier(node)) {
    const symbol = typeChecker.getSymbolAtLocation(node)

    if (!symbol?.valueDeclaration) {
      return []
    }

    return findFunctionRefInsideVar(symbol.valueDeclaration, typeChecker)
  }

  if (
    ts.isImportDeclaration(node) ||
    ts.isImportClause(node) ||
    ts.isImportSpecifier(node)
  ) {
    const symbol = typeChecker.getSymbolAtLocation(node)

    if (!symbol) {
      return []
    }

    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)

    if (!aliasSymbol.valueDeclaration) {
      return []
    }

    return [aliasSymbol.valueDeclaration]
  }

  if (isFunctionLike(node)) {
    return [node]
  }

  return []
}
