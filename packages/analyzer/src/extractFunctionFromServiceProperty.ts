import ts from "typescript"
import { ParseError } from "./errors"
import getLibFunctionCall from "./getLibFunctionCall"
import parseFunctionConfig from "./parseFunctionConfig"
import {
  ParsedSamenFunctionDefinition,
  SamenLibFunctions,
} from "./parseSamenApp"
import { resolveSymbol } from "./tsUtils"

function extractFunctionName(
  node: ts.ObjectLiteralElementLike | ts.VariableDeclaration,
): string {
  const functionName = node.name?.getText()

  if (!functionName) {
    throw new ParseError("Can't find function name", node)
  }

  return functionName
}

export default function extractFunctionFromServiceProperty(
  node: ts.ObjectLiteralElementLike | ts.VariableDeclaration,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition {
  const functionName = extractFunctionName(node)

  const createFunctionCallExpr = getLibFunctionCall(
    node,
    typeChecker,
    SamenLibFunctions.CreateFunction,
  )

  if (!createFunctionCallExpr) {
    return {
      name: functionName,
      config: {},
      ...parseActualFunction(node, typeChecker),
    }
  }

  const [funcArgument, functionConfig] = createFunctionCallExpr.arguments

  return {
    name: functionName,
    config: parseFunctionConfig(functionConfig, typeChecker),
    ...parseActualFunction(funcArgument, typeChecker),
  }
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
    if (!symbol || !symbol.valueDeclaration) {
      throw new ParseError(`Can't find function [${node.kind}]`, node)
    }
    return parseActualFunction(symbol.valueDeclaration, typeChecker)
  }

  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    return {
      actualFunction: node,
      parameters: node.parameters.map((p) => p),
      returnType: getReturnType(node),
    }
  }

  if (ts.isFunctionDeclaration(node)) {
    return {
      actualFunction: node,
      parameters: node.parameters.map((p) => p),
      returnType: getReturnType(node),
    }
  }

  if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    ts.isArrowFunction(node.initializer)
  ) {
    return {
      actualFunction: node.initializer,
      parameters: node.initializer.parameters.map((p) => p),
      returnType: getReturnType(node.initializer),
    }
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (!symbol?.valueDeclaration) {
      throw new ParseError(`Can't find function [${node.kind}]`, node)
    }
    return parseActualFunction(symbol.valueDeclaration, typeChecker)
  }

  if (ts.isPropertyAccessExpression(node)) {
    const lastToken = node.getLastToken()
    if (lastToken) {
      return parseActualFunction(lastToken, typeChecker)
    }
  }

  throw new ParseError("Unsupported syntax" + node.kind, node)
}

export function getReturnType(
  node: ts.FunctionLikeDeclarationBase,
): ts.TypeNode {
  const typeNode: ts.TypeNode | undefined = node.type

  if (!typeNode) {
    throw new ParseError("Return type should be explicitly defined", node)
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const promisedType = typeNode.typeArguments?.[0]
    if (typeNode.typeName.getText() === "Promise" && promisedType) {
      return promisedType
    }
  }

  throw new ParseError("Return type should be a Promise<T>", typeNode)
}
