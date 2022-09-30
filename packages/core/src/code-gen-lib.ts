import ts from "typescript"
import { generateParserBody } from "./code-gen/parsers/generateParser"
import generateParserFromModel from "./code-gen/parsers/generateParserFromModel"
import generateParserModel from "./code-gen/parsers/generateParserModel"
import { ParseError } from "./errors"
import { ParsedError } from "./extractErrors/parseThrowStatement"
import { isModel } from "./parseAppDeclaration"
import parseReturnType from "./parseSamenApp/parseReturnType"
import {
  Model,
  ParsedSamenFunctionDefinition,
} from "./parseSamenApp/parseSamenApp"
import { getNameAsString } from "./tsUtils"
import * as tsx from "./tsx"

const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
const asyncModifier = ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)

export function generateNamespace(
  name: ts.Identifier,
  body: ts.Statement[],
): ts.ModuleDeclaration {
  return ts.factory.createModuleDeclaration(
    undefined,
    [exportModifier],
    name,
    ts.factory.createModuleBlock(body),
    ts.NodeFlags.Namespace,
  )
}

export function generateFunction(
  func: ParsedSamenFunctionDefinition,
  refMaker: ReferenceMaker,
): ts.FunctionDeclaration {
  return ts.factory.createFunctionDeclaration(
    undefined, // decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // asteriks is prohibited
    func.name,
    undefined, // typeParameters are prohibited
    generateFunctionParameters(func, refMaker),
    ts.factory.createTypeReferenceNode("Promise", [
      generateTypeNode(func.returnType, refMaker),
    ]),
    undefined,
  )
}

function generateFunctionParameters(
  func: ParsedSamenFunctionDefinition,
  refMaker: ReferenceMaker,
): ts.ParameterDeclaration[] {
  const parameters =
    func.serviceContext && func.serviceContext.paramName
      ? func.parameters.slice(1)
      : func.parameters

  const result = parameters.map((param) => {
    if (!param.type) {
      throw new ParseError(
        `S100: Parameter of your functions should have a type`,
        param,
      )
    }

    return ts.factory.createParameterDeclaration(
      undefined,
      param.modifiers,
      param.dotDotDotToken,
      param.name,
      param.questionToken,
      generateTypeNode(param.type, refMaker),
      undefined, // initializer is prohibited, only on classes
    )
  })

  if (func.serviceContext) {
    return [
      // Note: we need to pass the context parameter as the first argument because we can
      // have optional parameters
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        func.serviceContext.paramName ?? "context",
        undefined,
        generateTypeNode(func.serviceContext.type, refMaker),
        undefined,
      ),
      ...result,
    ]
  }

  return result
}

export function generateClientFunction(
  serviceName: string,
  contextType: ts.TypeNode | undefined,
  func: ts.FunctionLikeDeclarationBase,
  refMaker: ReferenceMaker,
  typeChecker: ts.TypeChecker,
): ts.PropertyAssignment {
  let parameters = func.parameters.map((p) =>
    ts.factory.createParameterDeclaration(
      undefined,
      p.modifiers,
      p.dotDotDotToken,
      p.name,
      p.questionToken,
      p.type && generateTypeNode(p.type, refMaker),
      undefined, // initializer is prohibited, only on classes
    ),
  )
  let context: { name: string; type: ts.TypeNode } | undefined

  if (contextType) {
    const firstParam = func.parameters[0]
    if (isParamSamenContextParam(firstParam)) {
      // skip first parameter if we have a context param
      parameters = parameters.slice(1)
      context = {
        name: getNameAsString(firstParam.name),
        type: contextType,
      }
    }
  }

  return ts.factory.createPropertyAssignment(
    func.name!,
    ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      parameters,
      func.type && generateTypeNode(func.type, refMaker),
      undefined,
      generateClientFunctionBlock(
        serviceName,
        context,
        func,
        refMaker,
        typeChecker,
      ),
    ),
  )
}

function isParamSamenContextParam(param: ts.ParameterDeclaration): boolean {
  return (
    !!param &&
    !!param.type &&
    ts.isTypeReferenceNode(param.type) &&
    getNameAsString(param.type.typeName) === "SamenContext"
  )
}

function generateClientFunctionBlock(
  serviceName: string,
  context: { name: string; type: ts.TypeNode } | undefined,
  func: ts.FunctionLikeDeclarationBase,
  refMaker: ReferenceMaker,
  typeChecker: ts.TypeChecker,
): ts.Block {
  const returnType = parseReturnType(func)
  const isVoid = returnType.kind === ts.SyntaxKind.VoidKeyword

  const returnTypeNode = generateTypeNode(returnType, refMaker)

  return tsx.block(
    tsx.statement.return(
      tsx.expression.call(
        tsx.expression.propertyAccess(
          ts.factory.createThis(),
          isVoid ? "requestVoid" : "request",
        ),
        {
          typeArgs: isVoid ? undefined : [returnTypeNode],

          args: [
            tsx.literal.string(serviceName),
            tsx.literal.string(func.name!.getText()),
            tsx.literal.object(
              ...func.parameters.map((p, i) => {
                if (!ts.isIdentifier(p.name)) {
                  // TODO https://trello.com/c/UJHzzAHz/25-support-object-array-binding-patterns-in-parameter-names
                  throw new ParseError(
                    "S133: No support for prop binding names yet",
                    p.name,
                  )
                }

                if (context && i === 0) {
                  return tsx.property.assignment(
                    context.name,
                    tsx.expression.await(
                      tsx.expression.call(
                        tsx.expression.propertyAccess(
                          ts.factory.createThis(),
                          "opts",
                          "context",
                          serviceName,
                        ),
                      ),
                    ),
                  )
                }

                return tsx.property.shorthandAssignment(p.name.getText())
              }),
            ),
            `error_parser_${serviceName}`,
            ...(isVoid
              ? []
              : [
                  makeReferenceToParserFunction(
                    returnType,
                    returnTypeNode,
                    refMaker,
                    typeChecker,
                  ),
                ]),
          ],
        },
      ),
    ),
  )
}

export function generateModel(model: Model, refMaker: ReferenceMaker): Model {
  if (ts.isTypeAliasDeclaration(model)) {
    return ts.factory.createTypeAliasDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint, refMaker),
          tp.default && generateTypeNode(tp.default, refMaker),
        ),
      ),
      generateTypeNode(model.type, refMaker),
    )
  } else if (ts.isInterfaceDeclaration(model)) {
    return ts.factory.createInterfaceDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.typeParameters?.map((tp) =>
        ts.factory.createTypeParameterDeclaration(
          tp.name,
          tp.constraint && generateTypeNode(tp.constraint, refMaker),
          tp.default && generateTypeNode(tp.default, refMaker),
        ),
      ),
      model.heritageClauses?.map((hc) =>
        ts.factory.createHeritageClause(
          hc.token,
          hc.types.map((t) => {
            return ts.factory.createExpressionWithTypeArguments(
              ts.isIdentifier(t.expression)
                ? refMaker.fromIdentifier(t.expression)
                : ts.isPropertyAccessExpression(t.expression) &&
                  ts.isIdentifier(t.expression.name)
                ? refMaker.fromIdentifier(t.expression.name)
                : t.expression,
              t.typeArguments?.map((t) => generateTypeNode(t, refMaker)),
            )
          }),
        ),
      ),
      model.members.map((m) => generateTypeElement(m, refMaker)),
    )
  } else if (ts.isEnumDeclaration(model)) {
    return ts.factory.createEnumDeclaration(
      undefined,
      [exportModifier],
      model.name,
      model.members.map((member) => {
        return ts.factory.createEnumMember(
          generatePropertyName(member.name),
          member.initializer &&
            (ts.isStringLiteral(member.initializer)
              ? ts.factory.createStringLiteral(member.initializer.text)
              : ts.isNumericLiteral(member.initializer)
              ? ts.factory.createNumericLiteral(member.initializer.text)
              : undefined),
        )
      }),
    )
  }

  return model
}

export function generateErrorClass(
  error: ParsedError,
  refMaker: ReferenceMaker,
): ts.ClassDeclaration {
  return tsx.classDeclaration({
    name: error.name,
    extendsType: ts.factory.createExpressionWithTypeArguments(
      tsx.expression.identifier("Error"),
      undefined,
    ),
    export: true,
    constructor: tsx.constructor({
      params: error.properties.map((prop) =>
        tsx.param({
          public: true,
          readonly: true,
          name: prop.name,
          type: generateTypeNode(prop.type, refMaker),
        }),
      ),
    }),
  })
}

function generatePropertyName(propName: ts.PropertyName): ts.PropertyName {
  if (ts.isIdentifier(propName)) {
    return ts.factory.createIdentifier(propName.text)
  } else if (ts.isStringLiteral(propName)) {
    return ts.factory.createStringLiteral(propName.text)
  } else if (ts.isNumericLiteral(propName)) {
    return ts.factory.createNumericLiteral(propName.text)
  }
  // else if (ts.isComputedPropertyName(propName)) {
  // } else if (ts.isPrivateIdentifier(propName)) {
  // }
  throw new ParseError(
    "S101: We currently do not support these kind of property names",
    propName,
  )
}

function generateTypeElement(
  typeElement: ts.TypeElement,
  refMaker: ReferenceMaker,
): ts.TypeElement {
  if (ts.isPropertySignature(typeElement)) {
    return ts.factory.createPropertySignature(
      typeElement.modifiers,
      typeElement.name,
      typeElement.questionToken,
      typeElement.type && generateTypeNode(typeElement.type, refMaker),
    )
  }

  if (ts.isIndexSignatureDeclaration(typeElement)) {
    return ts.factory.createIndexSignature(
      undefined,
      typeElement.modifiers,
      typeElement.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          p.modifiers,
          p.dotDotDotToken,
          p.name,
          p.questionToken,
          p.type && generateTypeNode(p.type, refMaker),
          p.initializer,
        ),
      ),
      generateTypeNode(typeElement.type, refMaker),
    )
  }

  throw new ParseError(
    `S102: We currently do not support this syntax (${typeElement.kind})`,
    typeElement,
  )
}

function makeReferenceToParserFunction(
  typeNode: ts.TypeNode,
  returnTypeNode: ts.TypeNode,
  refMaker: ReferenceMaker,
  typeChecker: ts.TypeChecker,
): ts.Expression {
  return tsx.arrowFunction({
    params: [tsx.param({ name: "data", type: tsx.type.any })],
    returnType: tsx.type.reference({
      name: "ParseResult",
      args: [returnTypeNode],
    }),
    body: generateParserBody(
      returnTypeNode,
      generateParserFromModel(
        generateParserModel(typeChecker, typeNode, "data"),
      ),
    ),
  })
}

function generateTypeNode(
  type: ts.TypeNode,
  refMaker: ReferenceMaker,
): ts.TypeNode {
  if (ts.isTypeReferenceNode(type)) {
    return ts.factory.createTypeReferenceNode(
      refMaker.fromTypeNode(type),
      type.typeArguments?.map((t) => generateTypeNode(t, refMaker)),
    )
  }
  if (ts.isLiteralTypeNode(type)) {
    if (ts.isStringLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createStringLiteral(type.literal.text),
      )
    } else if (ts.isNumericLiteral(type.literal)) {
      return ts.factory.createLiteralTypeNode(
        ts.factory.createNumericLiteral(type.literal.text),
      )
    }
  }
  if (ts.isUnionTypeNode(type)) {
    return ts.factory.createUnionTypeNode(
      type.types.map((t) => generateTypeNode(t, refMaker)),
    )
  }
  if (ts.isIntersectionTypeNode(type)) {
    return ts.factory.createIntersectionTypeNode(
      type.types.map((t) => generateTypeNode(t, refMaker)),
    )
  }

  if (ts.isTypeLiteralNode(type)) {
    return ts.factory.createTypeLiteralNode(
      type.members.map((m) => generateTypeElement(m, refMaker)),
    )
  }

  if (ts.isArrayTypeNode(type)) {
    return ts.factory.createArrayTypeNode(
      generateTypeNode(type.elementType, refMaker),
    )
  }

  if (ts.isIndexedAccessTypeNode(type)) {
    return ts.factory.createIndexedAccessTypeNode(
      generateTypeNode(type.objectType, refMaker),
      generateTypeNode(type.indexType, refMaker),
    )
  }

  if (ts.isTupleTypeNode(type)) {
    return ts.factory.createTupleTypeNode(
      type.elements.map((el) => generateTypeNode(el, refMaker)),
    )
  }

  return type
}

function cleanTypeName(
  tn: ts.EntityName,
  typeChecker: ts.TypeChecker,
): ts.EntityName {
  if (ts.isIdentifier(tn)) {
    return tn
  }

  const symbol = typeChecker.getSymbolAtLocation(tn)

  if (
    !symbol ||
    (symbol.flags & ts.SymbolFlags.EnumMember) !== ts.SymbolFlags.EnumMember
  ) {
    return tn.right
  }

  if (ts.isIdentifier(tn.left)) {
    return tn
  }

  return ts.factory.createQualifiedName(
    tn.left.right, // Enum
    tn.right, // EnumMember
  )
}

function unpack(entityName: ts.EntityName): ts.Identifier[] {
  return ts.isIdentifier(entityName)
    ? [entityName]
    : [...unpack(entityName.left), entityName.right]
}

function combineAsEntityName(ids: ts.Identifier[]): ts.EntityName {
  if (ids.length === 1) {
    return ids[0]
  }

  const rest = ids.slice(0, ids.length - 1)
  const last = ids[ids.length - 1]

  return ts.factory.createQualifiedName(combineAsEntityName(rest), last)
}

function combineAsExpr(
  ids: ts.Identifier[],
): ts.Identifier | ts.PropertyAccessExpression {
  if (ids.length === 1) {
    return ids[0]
  }

  const rest = ids.slice(0, ids.length - 1)
  const last = ids[ids.length - 1]

  return ts.factory.createPropertyAccessExpression(combineAsExpr(rest), last)
}

export class ReferenceMaker {
  private readonly sharedTypes: ts.Type[]

  constructor(
    private readonly domain: Model[],
    private readonly typeChecker: ts.TypeChecker,
    private readonly sharedDomainName: ts.EntityName | undefined,
  ) {
    this.sharedTypes = this.domain.map((m) => typeChecker.getTypeAtLocation(m))
  }

  public fromTypeNode(typeNode: ts.TypeReferenceNode): ts.EntityName {
    if (typeNode.typeName.getText() === "SamenContext") {
      return ts.factory.createIdentifier("samen.SamenContext")
    }

    const symbol = this.typeChecker.getSymbolAtLocation(typeNode.typeName)

    const declr = symbol?.declarations?.[0]

    if (declr && isModel(declr) && this.domain.includes(declr)) {
      return combineAsEntityName(
        [
          ...(this.sharedDomainName ? [this.sharedDomainName] : []),
          cleanTypeName(typeNode.typeName, this.typeChecker),
        ].flatMap(unpack),
      )
    }

    return typeNode.typeName
  }

  public fromIdentifier(
    identifier: ts.Identifier,
  ): ts.Identifier | ts.PropertyAccessExpression {
    if (identifier.text === "SamenContext") {
      return ts.factory.createIdentifier("samen.SamenContext")
    }

    const symbol = this.typeChecker.getSymbolAtLocation(identifier)

    const declr = symbol?.declarations?.[0]

    if (declr && isModel(declr) && this.domain.includes(declr)) {
      return combineAsExpr(
        [
          ...(this.sharedDomainName ? [this.sharedDomainName] : []),
          cleanTypeName(identifier, this.typeChecker),
        ].flatMap(unpack),
      )
    }

    return identifier
  }
}
