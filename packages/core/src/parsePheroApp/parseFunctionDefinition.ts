import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import parseReturnType from "./parseReturnType"
import {
  type PheroFunction,
  type PheroFunctionParameter,
} from "../domain/PheroApp"
import { getNameAsString, resolveSymbol } from "../lib/tsUtils"
import {
  type DependencyMap,
  generateParserModelForFunction,
} from "../generateModel"

export default function parseFunctionDefinition(
  node: ts.ObjectLiteralElementLike | ts.VariableDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroFunction {
  if (ts.isSpreadAssignment(node)) {
    throw new PheroParseError(
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
    | ts.BigIntLiteral
    | ts.ComputedPropertyName
    | ts.PrivateIdentifier
    | ts.ObjectBindingPattern
    | ts.ArrayBindingPattern
    | ts.NoSubstitutionTemplateLiteral,
): string {
  if (
    ts.isNumericLiteral(functionName) ||
    ts.isBigIntLiteral(functionName) ||
    ts.isComputedPropertyName(functionName) ||
    ts.isPrivateIdentifier(functionName) ||
    ts.isObjectBindingPattern(functionName) ||
    ts.isArrayBindingPattern(functionName) ||
    ts.isNoSubstitutionTemplateLiteral(functionName)
  ) {
    throw new PheroParseError(
      "S117: Function name should have a clear identifier, no support for computed names or binding patterns " +
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
  | "ref"
  | "returnType"
  | "returnTypeModel"
  | "parameters"
  | "parametersModel"
  | "contextType"
  | "contextTypeModel"
> {
  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)

    if (!symbol?.declarations?.[0]) {
      throw new PheroParseError(
        `S118: Can't find function (${node.kind})`,
        node,
      )
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
    const functionParserModel = generateParserModelForFunction(
      node,
      typeChecker,
      deps,
    )
    return {
      ref: node,
      returnType: parseReturnType(node),
      returnTypeModel: functionParserModel.returnType,
      parameters: makeParams(node.parameters),
      parametersModel: functionParserModel.parameters,
      contextType: parseContextParameterType(node.parameters),
      contextTypeModel: functionParserModel.contextType,
    }
  }

  if (ts.isFunctionDeclaration(node)) {
    const functionParserModel = generateParserModelForFunction(
      node,
      typeChecker,
      deps,
    )
    return {
      ref: node,
      returnType: parseReturnType(node),
      returnTypeModel: functionParserModel.returnType,
      parameters: makeParams(node.parameters),
      parametersModel: functionParserModel.parameters,
      contextType: parseContextParameterType(node.parameters),
      contextTypeModel: functionParserModel.contextType,
    }
  }

  if (ts.isVariableDeclaration(node) && node.initializer) {
    if (ts.isArrowFunction(node.initializer)) {
      const functionParserModel = generateParserModelForFunction(
        node.initializer,
        typeChecker,
        deps,
      )
      return {
        ref: node.initializer,
        returnType: parseReturnType(node.initializer),
        returnTypeModel: functionParserModel.returnType,
        parameters: makeParams(node.initializer.parameters),
        parametersModel: functionParserModel.parameters,
        contextType: parseContextParameterType(node.initializer.parameters),
        contextTypeModel: functionParserModel.contextType,
      }
    }
    return parseActualFunction(node.initializer, typeChecker, deps)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (!symbol?.declarations?.[0]) {
      throw new PheroParseError(
        `S119: Can't find function (${node.kind})`,
        node,
      )
    }
    return parseActualFunction(symbol.declarations?.[0], typeChecker, deps)
  }

  if (ts.isPropertyAccessExpression(node)) {
    const lastToken = node.getLastToken()
    if (lastToken) {
      return parseActualFunction(lastToken, typeChecker, deps)
    }
  }

  throw new PheroParseError(`S120: Unsupported syntax (${node.kind})`, node)
}

function makeParams(
  params: ts.NodeArray<ts.ParameterDeclaration>,
): PheroFunctionParameter[] {
  return params.reduce<PheroFunctionParameter[]>(
    (result, param, paramIndex) => {
      if (!param.type) {
        throw new PheroParseError(`Parameter should have a type`, param)
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

function parseContextParameterType(
  params: ts.NodeArray<ts.ParameterDeclaration>,
): ts.TypeNode | undefined {
  const ctxParamType = params[0]?.type
  if (
    !ctxParamType ||
    !ts.isTypeReferenceNode(ctxParamType) ||
    getNameAsString(ctxParamType.typeName) !== "PheroContext"
  ) {
    return undefined
  }

  return ctxParamType.typeArguments?.[0]
}
