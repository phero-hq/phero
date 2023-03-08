import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import {
  type PheroServiceConfig,
  type Model,
  type PheroError,
  type PheroFunction,
  type PheroModel,
} from "../domain/PheroApp"
import { isModel } from "../lib/isModel"
import { getNameAsString } from "../lib/tsUtils"

export function parseFunctionModels(
  func: PheroFunction,
  prog: ts.Program,
): PheroModel[] {
  const modelMap = new Map<ts.Symbol, Model>()

  for (const param of func.parameters) {
    extractModels(param.type, prog, modelMap)
  }

  extractModels(func.returnType, prog, modelMap)

  return modelMapToModels(modelMap)
}

export function parseMiddlewareModels(
  serviceConfig: PheroServiceConfig,
  prog: ts.Program,
): PheroModel[] {
  const modelMap = new Map<ts.Symbol, Model>()

  if (serviceConfig.contextType) {
    extractModels(serviceConfig.contextType, prog, modelMap)
  }

  return modelMapToModels(modelMap)
}

export function parseErrorModels(
  errors: PheroError[],
  prog: ts.Program,
): PheroModel[] {
  const modelMap = new Map<ts.Symbol, Model>()

  for (const error of errors) {
    for (const prop of error.properties) {
      extractModels(prop.type, prog, modelMap)
    }
  }

  return modelMapToModels(modelMap)
}

function modelMapToModels(modelMap: Map<ts.Symbol, Model>): PheroModel[] {
  return [...modelMap.values()].map((m) => ({
    name: getNameAsString(m.name),
    ref: m,
  }))
}

function extractModels(
  rootNode: ts.Node,
  prog: ts.Program,
  accum: Map<ts.Symbol, Model>,
): Map<ts.Symbol, Model> {
  const typeChecker = prog.getTypeChecker()

  const transformer =
    <T extends ts.Node>(context: ts.TransformationContext) =>
    (rootNode: T) => {
      function visit(node: ts.Node): ts.Node {
        if (
          ts.isTypeReferenceNode(node) ||
          ts.isExpressionWithTypeArguments(node)
        ) {
          const { symbol, declaration } = getDeclaration(node, typeChecker)

          if (!accum.has(symbol) && isModel(declaration)) {
            accum.set(symbol, declaration)
            extractModels(declaration, prog, accum)
          }
        }

        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  ts.transform(rootNode, [transformer])

  return accum
}

function getDeclaration(
  typeNode: ts.TypeReferenceType,
  typeChecker: ts.TypeChecker,
): { symbol: ts.Symbol; declaration: ts.Declaration } {
  const symbol = typeChecker.getSymbolAtLocation(
    ts.isTypeReferenceNode(typeNode) ? typeNode.typeName : typeNode.expression,
  )
  if (!symbol) {
    throw new PheroParseError("Entity must have symbol", typeNode)
  }

  if ((symbol.flags & ts.SymbolFlags.Alias) === ts.SymbolFlags.Alias) {
    const aliasSymbol = typeChecker.getAliasedSymbol(symbol)
    if (aliasSymbol?.declarations?.[0]) {
      return {
        symbol: aliasSymbol,
        declaration: aliasSymbol.declarations?.[0],
      }
    }
  }

  const declaration = symbol?.declarations?.[0]
  if (!declaration) {
    throw new PheroParseError("Entity must have declaration", typeNode)
  }

  return { symbol, declaration }
}
