import ts from "typescript"
import { ServerSource } from "../generateClient"
import { Model } from "../parseSamenApp"
import { generateParserForNode } from "./parsers/parsers"
import { TSModelNode, TSNode } from "./parsers/TSNode"

export default function generateRPCProxy(serverSource: ServerSource): string {
  // const funcProxies = serverSource.services.flatMap(service => service.functions.map(func => generateFunctionProxy(service.name, func)))

  return ""
}

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const staticModifier = ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)

export function generateParser(
  model: Model,
  typeChecker: ts.TypeChecker,
): ts.ClassDeclaration {
  const modelName = model.name.escapedText
  return ts.factory.createClassDeclaration(
    undefined,
    [exportModifier],
    `${modelName}Parser`,
    undefined,
    undefined,
    [
      ts.factory.createMethodDeclaration(
        undefined,
        [staticModifier],
        undefined,
        "parse",
        undefined,
        undefined,
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            "data",
            undefined,
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            undefined,
          ),
        ],
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier("ParseResult"),
          [ts.factory.createTypeReferenceNode(model.name, undefined)],
        ),
        generateParserBody(model, typeChecker),
      ),
    ],
  )
}

function generateParserBody(
  model: Model,
  typeChecker: ts.TypeChecker,
): ts.Block {
  const sts: ts.Statement[] = [
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("errors"),
            undefined,
            ts.factory.createArrayTypeNode(
              ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier("ValidationError"),
                undefined,
              ),
            ),
            ts.factory.createArrayLiteralExpression([], false),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("result"),
            undefined,
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            undefined,
          ),
        ],
        ts.NodeFlags.Let,
      ),
    ),
  ]

  const modelNode = new TSModelNode(model, typeChecker, "data")
  sts.push(generateParserForNode(modelNode))

  sts.push(
    ts.factory.createIfStatement(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("errors"),
        ts.factory.createIdentifier("length"),
      ),
      ts.factory.createBlock(
        [
          ts.factory.createReturnStatement(
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("ok"),
                  ts.factory.createFalse(),
                ),
                ts.factory.createShorthandPropertyAssignment(
                  ts.factory.createIdentifier("errors"),
                  undefined,
                ),
              ],
              true,
            ),
          ),
        ],
        true,
      ),
      undefined,
    ),
    ts.factory.createReturnStatement(
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("ok"),
            ts.factory.createTrue(),
          ),
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("result"),
            ts.factory.createAsExpression(
              ts.factory.createIdentifier("result"),
              ts.factory.createTypeReferenceNode(model.name, undefined),
            ),
          ),
        ],
        true,
      ),
    ),
  )
  return ts.factory.createBlock(sts, true)
}

///// DONE
// String = 4,
// Number = 8,
// Boolean = 16,
// StringLiteral = 128,
// NumberLiteral = 256,
// BooleanLiteral = 512,
// Undefined = 32768,
// Null = 65536,
// TypeParameter = 262144,
// Object = 524288,
// Union = 1048576,
// Intersection = 2097152,
// Index = 4194304,
// IndexedAccess = 8388608,

///// TODO
// Any = 1,
// Unknown = 2,
// Enum = 32,
// EnumLiteral = 1024,
// Void = 16384,
// Never = 131072,
// BigInt = 64,
// BigIntLiteral = 2048,

///// UNDECIDED
// ESSymbol = 4096,
// UniqueESSymbol = 8192,
// Conditional = 16777216,
// Substitution = 33554432,
// NonPrimitive = 67108864,
// TemplateLiteral = 134217728,
// StringMapping = 268435456,
// Literal = 2944,
// Unit = 109440,
// StringOrNumberLiteral = 384,
// PossiblyFalsy = 117724,
// StringLike = 402653316,
// NumberLike = 296,
// BigIntLike = 2112,
// BooleanLike = 528,
// EnumLike = 1056,
// ESSymbolLike = 12288,
// VoidLike = 49152,
// UnionOrIntersection = 3145728,
// StructuredType = 3670016,
// TypeVariable = 8650752,
// InstantiableNonPrimitive = 58982400,
// InstantiablePrimitive = 406847488,
// Instantiable = 465829888,
// StructuredOrInstantiable = 469499904,
// Narrowable = 536624127,
