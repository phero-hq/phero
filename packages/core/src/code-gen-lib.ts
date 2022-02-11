import ts from "typescript"
import { ParseError } from "./errors"
import { getReturnType } from "./extractFunctionFromServiceProperty"
import { Model, ParsedSamenFunctionDefinition } from "./parseSamenApp"
import { isExternalType } from "./tsUtils"

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
    undefined, // TODO decoraters are prohibited
    [exportModifier, asyncModifier],
    undefined, // TODO asteriks is prohibited
    func.name,
    undefined, // TODO typeParameters are prohibited
    func.parameters.map((p) =>
      ts.factory.createParameterDeclaration(
        undefined,
        p.modifiers,
        p.dotDotDotToken,
        p.name,
        p.questionToken,
        p.type && generateTypeNode(p.type, refMaker),
        undefined, // initializer is prohibited, only on classes
      ),
    ),
    ts.factory.createTypeReferenceNode("Promise", [
      generateTypeNode(func.returnType, refMaker),
    ]),
    ts.factory.createBlock([
      ts.factory.createThrowStatement(
        ts.factory.createNewExpression(
          ts.factory.createIdentifier("Error"),
          undefined,
          [ts.factory.createStringLiteral("no impl", false)],
        ),
      ),
    ]),
  )
}

export function generateClientFunction(
  serviceName: string,
  func: ts.FunctionLikeDeclarationBase,
  refMaker: ReferenceMaker,
): ts.PropertyAssignment {
  return ts.factory.createPropertyAssignment(
    func.name!,
    ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      func.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          p.modifiers,
          p.dotDotDotToken,
          p.name,
          p.questionToken,
          p.type && generateTypeNode(p.type, refMaker),
          undefined, // initializer is prohibited, only on classes
        ),
      ),
      func.type && generateTypeNode(func.type, refMaker),
      undefined,
      // ts.factory.createBlock([], false),
      generateClientFunctionBlock(serviceName, func, refMaker),
    ),
  )
}

function generateClientFunctionBlock(
  serviceName: string,
  func: ts.FunctionLikeDeclarationBase,
  refMaker: ReferenceMaker,
): ts.Block {
  // TODO should not use getReturnType or refactor
  const returnType = getReturnType(func)
  const isVoid = returnType.kind === ts.SyntaxKind.VoidKeyword

  return ts.factory.createBlock([
    ts.factory.createReturnStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createThis(),
          isVoid
            ? ts.factory.createIdentifier("requestVoid")
            : ts.factory.createIdentifier("request"),
        ),
        isVoid ? undefined : [generateTypeNode(returnType, refMaker)], //typeArgs,
        [
          ts.factory.createStringLiteral(serviceName),
          ts.factory.createStringLiteral(func.name!.getText()),
          ts.factory.createObjectLiteralExpression(
            func.parameters.map((p) => {
              if (ts.isIdentifier(p.name)) {
                return ts.factory.createShorthandPropertyAssignment(
                  ts.factory.createIdentifier(p.name.getText()),
                )
              }
              // TODO https://trello.com/c/UJHzzAHz/25-support-object-array-binding-patterns-in-parameter-names
              throw new Error("No support for prop binding names yet")
            }),
            true,
          ),
        ], // argumentArray
      ),
    ),
  ])
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
          hc.types.map((t) =>
            ts.factory.createExpressionWithTypeArguments(
              ts.isIdentifier(t.expression)
                ? refMaker.fromIdentifier(t.expression)
                : t.expression,
              t.typeArguments?.map((t) => generateTypeNode(t, refMaker)),
            ),
          ),
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
    "Must be identifier, stringliteral or numericliteral",
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
    "Only Property signature is allowed " + typeElement.kind,
    typeElement,
  )
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
    private readonly serviceDomainName: ts.EntityName | undefined,
  ) {
    this.sharedTypes = this.domain.map((m) => typeChecker.getTypeAtLocation(m))
  }

  fromTypeNode(typeNode: ts.TypeReferenceNode): ts.EntityName {
    const type = this.typeChecker.getTypeFromTypeNode(typeNode)
    const result = this.toEntityNames(typeNode.typeName, type)
    return combineAsEntityName(result.flatMap(unpack))
  }

  fromIdentifier(
    identifier: ts.Identifier,
  ): ts.Identifier | ts.PropertyAccessExpression {
    const type = this.typeChecker.getTypeAtLocation(identifier)
    const result = this.toEntityNames(identifier, type)
    return combineAsExpr(result.flatMap(unpack))
  }

  toEntityNames(name: ts.EntityName, type: ts.Type): ts.EntityName[] {
    const isSharedType = this.sharedTypes.some(
      (st) =>
        (st.symbol ?? st.aliasSymbol) === (type.symbol ?? type.aliasSymbol),
    )

    const modelName = cleanTypeName(name, this.typeChecker)

    if (isExternalType(type)) {
      return [modelName]
    }

    const withDomainEntity = (name: ts.EntityName): ts.EntityName[] => {
      return this.sharedDomainName ? [this.sharedDomainName, name] : [name]
    }

    if (isSharedType) {
      return withDomainEntity(modelName)
    }

    if ((type.flags & ts.TypeFlags.EnumLiteral) === ts.TypeFlags.EnumLiteral) {
      const theEnum = this.typeChecker.getBaseTypeOfLiteralType(type)
      if (this.sharedTypes.some((st) => st.symbol === theEnum.symbol)) {
        return withDomainEntity(modelName)
      }
    }

    return this.serviceDomainName
      ? [this.serviceDomainName, modelName]
      : [modelName]
  }
}
