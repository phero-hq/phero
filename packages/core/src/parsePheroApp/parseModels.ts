import ts from "typescript"
import { tsx } from ".."
import { PheroParseError } from "../domain/errors"
import {
  type Model,
  type PheroError,
  type PheroFunction,
  type PheroModel,
  type PheroServiceConfig,
} from "../domain/PheroApp"
import { isModel } from "../lib/isModel"
import { getNameAsString, isLib } from "../lib/tsUtils"

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

          if (
            !accum.has(symbol) &&
            isModel(declaration) &&
            !isLib(declaration, prog)
          ) {
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

  return {
    symbol,
    declaration: handleTypeQueryDeclaration(declaration, typeChecker),
  }
}

function handleTypeQueryDeclaration(
  declr: ts.Declaration,
  typeChecker: ts.TypeChecker,
): ts.Declaration {
  if (
    !ts.isTypeAliasDeclaration(declr) ||
    !declr.type ||
    !ts.isTypeQueryNode(declr.type)
  ) {
    return declr
  }

  return tsx.typeAlias({
    name: declr.name,
    typeParameters: declr.typeParameters?.map((p) => p),
    type: createTypeQueryType(declr.type.exprName, typeChecker),
  })
}

function createTypeQueryType(
  expr: ts.EntityName,
  typeChecker: ts.TypeChecker,
): ts.TypeNode {
  return loop(expr)
  function loop(n: ts.Node): ts.TypeNode {
    if (ts.isLiteralExpression(n)) {
      return ts.factory.createLiteralTypeNode(n)
    }
    if (ts.isObjectLiteralExpression(n)) {
      return ts.factory.createTypeLiteralNode(
        n.properties.map((p) => {
          if (!ts.isPropertyAssignment(p)) {
            // TODO:
            // ShorthandPropertyAssignment
            // SpreadAssignment
            // GetAccessorDeclaration
            throw new PheroParseError(
              "We only support property assignments for now",
              p,
            )
          }

          return ts.factory.createPropertySignature(
            ts.canHaveModifiers(p) ? ts.getModifiers(p) : undefined,
            p.name,
            undefined,
            typeChecker.typeToTypeNode(
              typeChecker.getTypeAtLocation(p.initializer),
              undefined,
              undefined,
            ),
          )
        }),
      )
    }

    const symbol = typeChecker.getSymbolAtLocation(expr)
    const declr = symbol?.declarations?.[0]

    if (declr && ts.isVariableDeclaration(declr) && declr?.initializer) {
      return loop(declr.initializer)
    }

    throw new Error(
      `Cant find declraration for EnityName ${
        ts.isIdentifier(expr) ? expr.text : expr.right.text
      }.`,
    )
  }
}
