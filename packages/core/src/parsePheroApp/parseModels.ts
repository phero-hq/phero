import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import {
  type Model,
  type PheroError,
  type PheroFunction,
  type PheroModel,
  type PheroServiceConfig,
} from "../domain/PheroApp"
import getDeclaration from "../lib/getDeclaration"
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
        if (ts.isTypeQueryNode(node)) {
          const { declaration } = getDeclaration(node.exprName, typeChecker)
          extractModels(declaration, prog, accum)
        }

        // fixes "as const" expression (it has no declaration)
        if (
          node.parent &&
          ts.isAsExpression(node.parent) &&
          ts.isTypeReferenceNode(node) &&
          getNameAsString(node.typeName) === "const"
        ) {
          return node
        }
        if (
          ts.isTypeReferenceNode(node) ||
          ts.isExpressionWithTypeArguments(node) ||
          ts.isIdentifier(node) ||
          ts.isQualifiedName(node)
        ) {
          const { symbol, declaration } = getDeclaration(node, typeChecker)

          if (
            !accum.has(symbol) &&
            isModel(declaration) &&
            !isLib(declaration, prog)
          ) {
            accum.set(symbol, rewriteTypeQueryNodes(declaration, prog))
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

function createTypeQueryType(
  expr: ts.EntityName,
  typeChecker: ts.TypeChecker,
): ts.TypeNode {
  return loop(expr)
  function loop(n: ts.Node): ts.TypeNode {
    if (ts.isAsExpression(n)) {
      return loop(n.expression)
    }
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

/**
 * Rewrites "typeof" expressions to the generated types because we don't want constants in our manifest.
 **/
function rewriteTypeQueryNodes(declaration: Model, prog: ts.Program): Model {
  const typeChecker = prog.getTypeChecker()

  const transformer =
    <T extends ts.Node>(context: ts.TransformationContext) =>
    (rootNode: T) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isTypeQueryNode(node)) {
          return createTypeQueryType(node.exprName, typeChecker)
        }

        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  const result = ts.transform<Model>(declaration, [transformer])

  return result.transformed[0]
}
