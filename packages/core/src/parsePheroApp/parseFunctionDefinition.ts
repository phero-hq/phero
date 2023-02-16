import ts from "typescript"
import { ParseError } from "../domain/errors"
import parseReturnType from "./parseReturnType"
import { PheroFunction, PheroFunctionParameter } from "../domain/PheroApp"
import { getNameAsString, resolveSymbol } from "../lib/tsUtils"
import { DependencyMap, generateParserModel } from "../generateModel"

export default function parseFunctionDefinition(
  node: ts.ObjectLiteralElementLike | ts.VariableDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroFunction {
  if (ts.isSpreadAssignment(node)) {
    throw new ParseError(
      "S116: Sorry, no support for spread assignment (yet)",
      node,
    )
  }

  const parsedPheroFunctionDef: PheroFunction = {
    name: parseFunctionName(node.name),
    ...parseActualFunction(node, typeChecker, deps),
  }

  return parsedPheroFunctionDef
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
  deps: DependencyMap,
): Pick<
  PheroFunction,
  "ref" | "parameters" | "parametersModel" | "returnType" | "returnTypeModel"
> {
  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)

    if (!symbol || !symbol.declarations?.[0]) {
      throw new ParseError(`S118: Can't find function (${node.kind})`, node)
    }

    return parseActualFunction(symbol.declarations?.[0], typeChecker, deps)
  }

  if (ts.isImportSpecifier(node)) {
    return parseActualFunction(node.name, typeChecker, deps)
  }

  if (ts.isPropertyAssignment(node)) {
    return parseActualFunction(node.initializer, typeChecker, deps)
  }

  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    const parserModel = generateParserModel(node, typeChecker, deps)
    return {
      ref: node,
      parameters: makeParams(node.parameters),
      returnType: parseReturnType(node),
      returnTypeModel: parserModel.returnType,
      parametersModel: parserModel.parameters,
    }
  }

  if (ts.isFunctionDeclaration(node)) {
    const parserModel = generateParserModel(node, typeChecker, deps)
    return {
      ref: node,
      parameters: makeParams(node.parameters),
      returnType: parseReturnType(node),
      returnTypeModel: parserModel.returnType,
      parametersModel: parserModel.parameters,
    }
  }

  if (ts.isVariableDeclaration(node) && node.initializer) {
    if (ts.isArrowFunction(node.initializer)) {
      const parserModel = generateParserModel(
        node.initializer,
        typeChecker,
        deps,
      )
      return {
        ref: node.initializer,
        parameters: makeParams(node.initializer.parameters),
        returnType: parseReturnType(node.initializer),
        returnTypeModel: parserModel.returnType,
        parametersModel: parserModel.parameters,
      }
    }
    return parseActualFunction(node.initializer, typeChecker, deps)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (!symbol?.declarations?.[0]) {
      throw new ParseError(`S119: Can't find function (${node.kind})`, node)
    }
    return parseActualFunction(symbol.declarations?.[0], typeChecker, deps)
  }

  if (ts.isPropertyAccessExpression(node)) {
    const lastToken = node.getLastToken()
    if (lastToken) {
      return parseActualFunction(lastToken, typeChecker, deps)
    }
  }

  throw new ParseError(`S120: Unsupported syntax (${node.kind})`, node)
}

function makeParams(
  params: ts.NodeArray<ts.ParameterDeclaration>,
): PheroFunctionParameter[] {
  return params.reduce<PheroFunctionParameter[]>(
    (result, param, paramIndex) => {
      if (!param.type) {
        throw new ParseError(`Parameter should have a type`, param)
      }

      if (
        paramIndex === 0 &&
        ts.isTypeReferenceNode(param.type) &&
        getNameAsString(param.type.typeName) === "PheroContext"
      ) {
        return result
      }

      return [
        ...result,
        {
          name: getNameAsString(param.name),
          questionToken: !!param.questionToken,
          type: param.type,
        },
      ]
    },
    [],
  )
}
