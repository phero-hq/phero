import ts from "typescript"
import { ParseError } from "../errors"
import parseReturnType from "./parseReturnType"
import { ParsedSamenFunctionDefinition } from "./parseSamenApp"
import { resolveSymbol } from "../tsUtils"

export default function parseFunctionDefinition(
  node: ts.ObjectLiteralElementLike | ts.VariableDeclaration,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition {
  if (ts.isSpreadAssignment(node)) {
    throw new ParseError(
      "S116: Sorry, no support for spread assignment (yet)",
      node,
    )
  }

  const parsedSamenFunctionDef: ParsedSamenFunctionDefinition = {
    name: parseFunctionName(node.name),
    ...parseActualFunction(node, typeChecker),
  }

  return parsedSamenFunctionDef
}

function parseFunctionName(
  functionName:
    | ts.Identifier
    | ts.StringLiteral
    | ts.NumericLiteral
    | ts.ComputedPropertyName
    | ts.PrivateIdentifier
    | ts.ObjectBindingPattern
    | ts.ArrayBindingPattern,
): string {
  if (
    ts.isNumericLiteral(functionName) ||
    ts.isComputedPropertyName(functionName) ||
    ts.isPrivateIdentifier(functionName) ||
    ts.isObjectBindingPattern(functionName) ||
    ts.isArrayBindingPattern(functionName)
  ) {
    throw new ParseError(
      "S117: Function name should have a clear identifier, no support for computed names or binding patterns" +
        functionName.kind,
      functionName,
    )
  }
  return functionName.text
}

function parseActualFunction(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): Pick<
  ParsedSamenFunctionDefinition,
  "actualFunction" | "parameters" | "returnType"
> {
  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)

    if (!symbol || !symbol.declarations?.[0]) {
      throw new ParseError(`S118: Can't find function (${node.kind})`, node)
    }

    return parseActualFunction(symbol.declarations?.[0], typeChecker)
  }

  if (ts.isImportSpecifier(node)) {
    return parseActualFunction(node.name, typeChecker)
  }

  if (ts.isPropertyAssignment(node)) {
    return parseActualFunction(node.initializer, typeChecker)
  }

  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    return {
      actualFunction: node,
      parameters: node.parameters.map((p) => p),
      returnType: parseReturnType(node),
    }
  }

  if (ts.isFunctionDeclaration(node)) {
    return {
      actualFunction: node,
      parameters: node.parameters.map((p) => p),
      returnType: parseReturnType(node),
    }
  }

  if (ts.isVariableDeclaration(node) && node.initializer) {
    if (ts.isArrowFunction(node.initializer)) {
      return {
        actualFunction: node.initializer,
        parameters: node.initializer.parameters.map((p) => p),
        returnType: parseReturnType(node.initializer),
      }
    }
    return parseActualFunction(node.initializer, typeChecker)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (!symbol?.declarations?.[0]) {
      throw new ParseError(`S119: Can't find function [${node.kind}]`, node)
    }
    return parseActualFunction(symbol.declarations?.[0], typeChecker)
  }

  if (ts.isPropertyAccessExpression(node)) {
    const lastToken = node.getLastToken()
    if (lastToken) {
      return parseActualFunction(lastToken, typeChecker)
    }
  }

  throw new ParseError("S120: Unsupported syntax" + node.kind, node)
}
