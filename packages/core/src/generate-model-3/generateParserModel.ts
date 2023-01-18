import ts from "typescript"
import { ParseError } from "../domain/errors"
import { getTypeFlags } from "./generateParserModelUtils"
import {
  EnumMemberParserModel,
  EnumParserModel,
  IndexMemberParserModel,
  MemberParserModel,
  ParserModel,
  ParserModelType,
  ReferenceParserModel,
} from "./ParserModel"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

interface InternalParserModelMap {
  root: ParserModel
  deps: DependencyMap
}

type DependencyMap = Map<string, { name: string; model: ParserModel }>
type TypeParamMap = Map<string, { name: string; model: ParserModel }>

export function generateParserModel(
  func: ts.FunctionDeclaration,
  prog: ts.Program,
): ParserModelMap {
  const typeChecker = prog.getTypeChecker()

  const funcType = func.type

  if (!funcType) {
    throw new ParseError("Function must have type", func)
  }

  const funcTypeType = typeChecker.getTypeAtLocation(
    funcType,
  ) as ts.TypeReference

  const { root, deps } = generateFromTypeNode(
    funcType,
    funcTypeType,
    funcType,
    typeChecker,
    new Map(),
    new Map(),
  )

  return {
    root,
    deps: [...deps.values()].reduce<Record<string, ParserModel>>(
      (result, dep) => ({ ...result, [dep.name]: dep.model }),
      {},
    ),
  }
}

function generateFromArrayTypeNode(
  typeNode: ts.ArrayTypeNode,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const elementType = type.typeArguments?.[0]

  if (!elementType) {
    throw new ParseError("Array should have element type", typeNode)
  }

  const elementModel = generateFromTypeNode(
    typeNode.elementType,
    elementType,
    location,
    typeChecker,
    deps,
    typeParams,
  )

  return {
    root: {
      type: ParserModelType.Array,
      element: {
        type: ParserModelType.ArrayElement,
        parser: elementModel.root,
      },
    },
    deps: elementModel.deps,
  }
}

function generateFromUnionTypeNode(
  typeNode: ts.UnionTypeNode,
  type: ts.UnionType,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const subtypeModels = typeNode.types.reduce<{
    oneOf: ParserModel[]
    deps: DependencyMap
  }>(
    ({ oneOf, deps }, subtype, index) => {
      const subtypeModel = generateFromTypeNode(
        subtype,
        type.types[index],
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        oneOf: [...oneOf, subtypeModel.root],
        deps: subtypeModel.deps,
      }
    },
    { oneOf: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Union,
      oneOf: subtypeModels.oneOf,
    },
    deps: subtypeModels.deps,
  }
}

function generateFromIntersectionTypeNode(
  typeNode: ts.IntersectionTypeNode,
  type: ts.IntersectionType,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const subtypeModels = typeNode.types.reduce<{
    parsers: ParserModel[]
    deps: DependencyMap
  }>(
    ({ parsers, deps }, subtype, index) => {
      const subtypeModel = generateFromTypeNode(
        subtype,
        type.types[index],
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        parsers: [...parsers, subtypeModel.root],
        deps: subtypeModel.deps,
      }
    },
    { parsers: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Intersection,
      parsers: subtypeModels.parsers,
    },
    deps: subtypeModels.deps,
  }
}

function generateFromParenthesizedTypeNode(
  typeNode: ts.ParenthesizedTypeNode,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  return generateFromTypeNode(
    typeNode.type,
    type,
    location,
    typeChecker,
    deps,
    typeParams,
  )
}

function generateFromTupleTypeNode(
  typeNode: ts.TupleTypeNode,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const elementTypes = type.typeArguments

  if (!elementTypes) {
    throw new ParseError("Tuple should have element type", typeNode)
  }

  const elementModels = typeNode.elements.reduce<{
    models: ParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, subtype, index) => {
      const subtypeModel = generateFromTypeNode(
        subtype,
        elementTypes[index],
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        models: [...models, subtypeModel.root],
        deps: subtypeModel.deps,
      }
    },
    { models: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Tuple,
      elements: elementModels.models.map((elementModel, position) => ({
        type: ParserModelType.TupleElement,
        position,
        parser: elementModel,
      })),
    },
    deps: elementModels.deps,
  }
}

function generateFromTypeLiteralNode(
  typeNode: ts.TypeLiteralNode,
  type: ts.ObjectType,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const memberModels = typeNode.members.reduce<{
    models: (MemberParserModel | IndexMemberParserModel)[]
    deps: DependencyMap
  }>(
    ({ models, deps }, member) => {
      const memberModel = generateFromTypeElementDeclaration(
        member,
        type,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        models: [...models, memberModel.root],
        deps: memberModel.deps,
      }
    },
    { models: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Object,
      members: memberModels.models,
    },
    deps: memberModels.deps,
  }
}

function getTypeParamParserModel(
  typeNode: ts.TypeNode,
  declaration: ts.TypeParameterDeclaration,
  typeParams: TypeParamMap,
): { name: string; model: ParserModel } {
  const typeParamModel = typeParams.get(declaration.name.text)
  if (!typeParamModel) {
    throw new ParseError(
      `No type found for type parameter ${declaration.name.text}`,
      typeNode,
    )
  }
  return typeParamModel
}

function generateFromTypeReferenceNode(
  typeNode: ts.TypeReferenceType,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const declaration = getDeclaration(typeNode, typeChecker)

  if (ts.isTypeParameterDeclaration(declaration)) {
    const typeParserModel = getTypeParamParserModel(
      typeNode,
      declaration,
      typeParams,
    )
    return {
      root: typeParserModel.model,
      deps,
    }
  }

  const { typeParams: updatedTypeParams, deps: updatedDeps } =
    getUpdatedTypeParams(
      typeNode,
      location,
      declaration,
      type,
      typeChecker,
      typeParams,
      deps,
    )

  const ref = generateReferenceParserModelForDeclaration(
    typeNode,
    declaration,
    updatedTypeParams,
  )

  if (updatedDeps.has(ref.typeName)) {
    return {
      root: ref,
      deps: updatedDeps,
    }
  }

  const depModel = generateFromDeclaration(
    typeNode,
    declaration,
    type,
    location,
    typeChecker,
    new Map([
      ...updatedDeps,
      // short circuit for recursive reference types
      [
        ref.typeName,
        {
          name: `TODO`,
          model: ref,
        },
      ],
    ]),
    updatedTypeParams,
  )

  return {
    root: ref,
    deps: new Map([
      ...depModel.deps,
      [
        ref.typeName,
        ref.typeArguments
          ? {
              name: ref.typeName,
              model: {
                type: ParserModelType.Generic,
                typeName: ref.typeName,
                typeArguments: ref.typeArguments,
                parser: depModel.root,
              },
            }
          : {
              name: ref.typeName,
              model: depModel.root,
            },
      ],
    ]),
  }
}

function generateFromTypeNode(
  typeNode: ts.TypeNode,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (ts.isToken(typeNode)) {
    return { root: generateFromTokenTypeNode(typeNode), deps }
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    return { root: generateFromLiteralTypeNode(typeNode, typeChecker), deps }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    // console.group("array", printCode(typeNode))
    const result = generateFromArrayTypeNode(
      typeNode,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isUnionTypeNode(typeNode)) {
    if (!type.isUnion()) {
      throw new ParseError("Type should be Union", typeNode)
    }
    // console.group("union", printCode(typeNode))
    const result = generateFromUnionTypeNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    if (!type.isIntersection()) {
      throw new ParseError("Type should be Intersection", typeNode)
    }
    // console.group("intersection", printCode(typeNode))
    const result = generateFromIntersectionTypeNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    // console.group("Parenthesized", printCode(typeNode))
    const result = generateFromParenthesizedTypeNode(
      typeNode,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isTupleTypeNode(typeNode)) {
    // console.group("tuple", printCode(typeNode))
    const result = generateFromTupleTypeNode(
      typeNode,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    // console.group("typeLiteral", printCode(typeNode))
    const result = generateFromTypeLiteralNode(
      typeNode,
      type as ts.ObjectType,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const result = generateFromTypeReferenceNode(
      typeNode,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return result
  }

  if (ts.isConditionalTypeNode(typeNode)) {
    return typeToParserModel(
      type,
      typeNode,
      location,
      typeChecker,
      deps,
      typeParams,
    )
  }

  throw new ParseError("TypeNode not implemented " + typeNode.kind, typeNode)
}

function generateFromTokenTypeNode(typeNode: ts.TypeNode): ParserModel {
  switch (typeNode.kind) {
    case ts.SyntaxKind.AnyKeyword:
      return { type: ParserModelType.Any }
    case ts.SyntaxKind.BigIntKeyword:
      return { type: ParserModelType.BigInt }
    case ts.SyntaxKind.BooleanKeyword:
      return { type: ParserModelType.Boolean }
    case ts.SyntaxKind.FalseKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: false }
    case ts.SyntaxKind.NullKeyword:
      return { type: ParserModelType.Null }
    case ts.SyntaxKind.NumberKeyword:
      return { type: ParserModelType.Number }
    case ts.SyntaxKind.StringKeyword:
      return { type: ParserModelType.String }
    case ts.SyntaxKind.TrueKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: true }
    case ts.SyntaxKind.UndefinedKeyword:
      return { type: ParserModelType.Undefined }
    case ts.SyntaxKind.UnknownKeyword:
      return { type: ParserModelType.Any }
    case ts.SyntaxKind.VoidKeyword:
      return { type: ParserModelType.Undefined }

    case ts.SyntaxKind.ObjectKeyword:
    case ts.SyntaxKind.SymbolKeyword:
    // TODO?
    default:
      throw new ParseError(
        `TokenKind ${typeNode.kind} not implemented`,
        typeNode,
      )
  }
}

function generateFromLiteralTypeNode(
  typeNode: ts.LiteralTypeNode,
  typeChecker: ts.TypeChecker,
): ParserModel {
  switch (typeNode.literal.kind) {
    case ts.SyntaxKind.NullKeyword:
      return { type: ParserModelType.Null }
    case ts.SyntaxKind.TrueKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: true }
    case ts.SyntaxKind.FalseKeyword:
      return { type: ParserModelType.BooleanLiteral, literal: false }
    case ts.SyntaxKind.StringLiteral: {
      const stringType = typeChecker.getTypeAtLocation(
        typeNode,
      ) as ts.StringLiteralType
      return {
        type: ParserModelType.StringLiteral,
        literal: stringType.value,
      }
    }
    case ts.SyntaxKind.NumericLiteral: {
      const numberType = typeChecker.getTypeAtLocation(
        typeNode,
      ) as ts.NumberLiteralType
      return {
        type: ParserModelType.NumberLiteral,
        literal: numberType.value,
      }
    }
    case ts.SyntaxKind.BigIntLiteral: {
      const bigIntType = typeChecker.getTypeAtLocation(
        typeNode,
      ) as ts.BigIntLiteralType
      return {
        type: ParserModelType.BigIntLiteral,
        literal: bigIntType.value,
      }
    }
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.JsxAttributes:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PrefixUnaryExpression:
    default:
      throw new ParseError(
        `Literal ${typeNode.literal.kind} not implemented`,
        typeNode,
      )
  }
}

function generateFromTypeElementDeclaration(
  member: ts.TypeElement,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): {
  root: MemberParserModel | IndexMemberParserModel
  deps: DependencyMap
} {
  if (ts.isPropertySignature(member)) {
    if (!member.type) {
      throw new ParseError("Member must have a type", member)
    }

    const memberName = getMemberNameAsString(member)
    // console.group("g>" + memberName, printCode(member))

    const prop = type.getProperty(memberName)
    if (!prop) {
      console.log("NO PROP")
      throw new Error(
        "TODO " +
          memberName +
          " > " +
          type
            .getProperties()
            .map((p) => p.name)
            .join("|") +
          " >>> " +
          typeChecker.typeToString(type),
      )
    }

    const propType = typeChecker.getTypeOfSymbolAtLocation(prop, location)
    const optional = !!member.questionToken
    const actualOptionalType = optional
      ? getNonOptionalType(propType)
      : propType

    const memberParser = generateFromTypeNode(
      member.type,
      actualOptionalType,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()
    return {
      root: {
        type: ParserModelType.Member,
        name: memberName,
        optional,
        parser: memberParser.root,
      },
      deps: memberParser.deps,
    }
  } else if (ts.isIndexSignatureDeclaration(member)) {
    if (!member.type) {
      throw new ParseError("Member must have a type", member)
    }
    // TODO IndexMember
  }
  throw new ParseError("Member type is not supported", member)
}

function generateFromDeclaration(
  typeNode: ts.TypeReferenceType,
  declaration: ts.Declaration,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (ts.isEnumDeclaration(declaration)) {
    const enumParser = generateFromEnumDeclaration(declaration, typeChecker)
    return { root: enumParser, deps }
  }

  if (ts.isEnumMember(declaration)) {
    const enumMemberParser = generateFromEnumMemberDeclaration(
      declaration,
      typeChecker,
    )
    return { root: enumMemberParser, deps }
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    const result = generateFromInterfaceDeclaration(
      declaration,
      type as ts.TypeReference,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    return result
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const result = generateFromTypeNode(
      declaration.type,
      type,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    return result
  }

  throw new ParseError(
    `Reference to type with kind ${
      ts.tokenToString(declaration.kind) ?? declaration.kind.toString()
    } not supported`,
    typeNode,
  )
}

function generateFromInterfaceDeclaration(
  interfaceDeclr: ts.InterfaceDeclaration,
  type: ts.TypeReference,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  const memberParsers = interfaceDeclr.members.reduce<{
    models: (MemberParserModel | IndexMemberParserModel)[]
    deps: DependencyMap
  }>(
    ({ models, deps }, member) => {
      // console.group(
      //   "getObjectParserModelFromDeclaration",
      //   interfaceDeclr.name.text,
      // )
      const memberModel = generateFromTypeElementDeclaration(
        member,
        type,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      // console.groupEnd()
      return {
        models: [...models, memberModel.root],
        deps: memberModel.deps,
      }
    },
    { models: [], deps },
  )

  const selfModel = {
    type: ParserModelType.Object,
    members: memberParsers.models,
  } as const

  const inheritedTypes: ts.ExpressionWithTypeArguments[] | undefined =
    interfaceDeclr.heritageClauses
      ?.filter((base) => {
        return base.token === ts.SyntaxKind.ExtendsKeyword
      })
      .flatMap((extendClause) => extendClause.types)

  if (!inheritedTypes) {
    return {
      root: selfModel,
      deps: memberParsers.deps,
    }
  }

  const inheritedParsers = inheritedTypes.reduce<{
    models: ParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, inheritedType) => {
      const inheritedTypeModel = generateFromTypeReferenceNode(
        inheritedType,
        type,
        location,
        typeChecker,
        deps,
        typeParams,
      )
      return {
        models: [...models, inheritedTypeModel.root],
        deps: inheritedTypeModel.deps,
      }
    },
    { models: [], deps: memberParsers.deps },
  )

  return {
    root: {
      type: ParserModelType.Intersection,
      parsers: [selfModel, ...inheritedParsers.models],
    },
    deps: inheritedParsers.deps,
  }
}

function generateFromEnumDeclaration(
  enumDeclr: ts.EnumDeclaration,
  typeChecker: ts.TypeChecker,
): EnumParserModel {
  return {
    type: ParserModelType.Enum,
    name: enumDeclr.name.text,
    members: enumDeclr.members.map((member) =>
      generateFromEnumMemberDeclaration(member, typeChecker),
    ),
  }
}

function generateFromEnumMemberDeclaration(
  member: ts.EnumMember,
  typeChecker: ts.TypeChecker,
): EnumMemberParserModel {
  // member.initializer

  const enumValueType = typeChecker.getTypeAtLocation(member)
  // const memberParser = typeToParserModel(enumValueType, undefined, typeChecker)
  if (
    // memberParser.type !== ParserModelType.NumberLiteral &&
    // memberParser.type !== ParserModelType.StringLiteral
    enumValueType.flags & ts.TypeFlags.StringLiteral
  ) {
    return {
      type: ParserModelType.EnumMember,
      name: propertyNameAsString(member.name),
      parser: {
        type: ParserModelType.StringLiteral,
        literal: (enumValueType as ts.StringLiteralType).value,
      },
    }
  }
  if (
    // memberParser.type !== ParserModelType.NumberLiteral &&
    // memberParser.type !== ParserModelType.StringLiteral
    enumValueType.flags & ts.TypeFlags.NumberLiteral
  ) {
    return {
      type: ParserModelType.EnumMember,
      name: propertyNameAsString(member.name),
      parser: {
        type: ParserModelType.NumberLiteral,
        literal: (enumValueType as ts.NumberLiteralType).value,
      },
    }
  }

  throw new ParseError(
    "Enum member should be either of type string or number",
    member,
  )
}

function typeToParserModel(
  type: ts.Type,
  typeNode: ts.TypeNode,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): InternalParserModelMap {
  if (type.flags & ts.TypeFlags.StringLiteral) {
    const s = type as ts.StringLiteralType
    return {
      root: {
        type: ParserModelType.StringLiteral,
        literal: s.value,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.NumberLiteral) {
    const s = type as ts.NumberLiteralType
    return {
      root: {
        type: ParserModelType.NumberLiteral,
        literal: s.value,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.String) {
    return {
      root: {
        type: ParserModelType.String,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.Number) {
    return {
      root: {
        type: ParserModelType.Number,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.Boolean) {
    return {
      root: {
        type: ParserModelType.Boolean,
      },
      deps,
    }
  } else if (type.flags & ts.TypeFlags.Object) {
    const memberModels = type.getProperties().reduce<{
      models: (IndexMemberParserModel | MemberParserModel)[]
      deps: DependencyMap
    }>(
      ({ models, deps }, prop) => {
        const propType = typeChecker.getTypeOfSymbolAtLocation(prop, typeNode)

        const propSignature = prop.declarations?.[0]

        if (!propSignature || !ts.isPropertySignature(propSignature)) {
          throw new ParseError("Unexpected declaration", typeNode)
        }

        if (!propSignature.type) {
          throw new ParseError("Property must have type", propSignature)
        }

        const propModel = generateFromTypeNode(
          propSignature.type,
          propType,
          location,
          typeChecker,
          deps,
          typeParams,
        )

        return {
          models: [
            ...models,
            {
              type: ParserModelType.Member,
              name: prop.name,
              optional:
                (prop.flags & ts.SymbolFlags.Optional) ===
                ts.SymbolFlags.Optional,
              parser: propModel.root,
            },
          ],
          deps: propModel.deps,
        }
      },
      { models: [], deps },
    )

    return {
      root: {
        type: ParserModelType.Object,
        members: memberModels.models,
      },
      deps: memberModels.deps,
    }
  } else if (type.flags & ts.TypeFlags.Union) {
    const unionType = type as ts.UnionType
    const unionModels = unionType.types.reduce<{
      models: ParserModel[]
      deps: DependencyMap
    }>(
      ({ models, deps }, type) => {
        const typeModel = typeToParserModel(
          type,
          typeNode,
          location,
          typeChecker,
          deps,
          typeParams,
        )
        return {
          models: [...models, typeModel.root],
          deps: typeModel.deps,
        }
      },
      { models: [], deps },
    )

    return {
      root: {
        type: ParserModelType.Union,
        oneOf: unionModels.models,
      },
      deps: unionModels.deps,
    }
  } else if (type.flags & ts.TypeFlags.Undefined) {
    return { root: { type: ParserModelType.Undefined }, deps }
  }

  throw new Error(
    `ParserModel for Type with flags (${getTypeFlags(type).join(
      " | ",
    )}) not implemented`,
  )
}

function getMemberNameAsString(member: ts.TypeElement): string {
  const memberName = member.name

  if (!memberName) {
    throw new ParseError("Member has no name", member)
  }

  return propertyNameAsString(memberName)
}

function propertyNameAsString(propertyName: ts.PropertyName): string {
  if (ts.isIdentifier(propertyName)) {
    return propertyName.text
  }
  if (ts.isStringLiteral(propertyName)) {
    return propertyName.text
  }
  if (ts.isNumericLiteral(propertyName)) {
    return propertyName.text
  }
  if (ts.isComputedPropertyName(propertyName)) {
    throw new ParseError(
      "Member name must not be computed property",
      propertyName,
    )
  }

  if (ts.isPrivateIdentifier(propertyName)) {
    throw new ParseError(
      "Member name must not be private identifier",
      propertyName,
    )
  }

  throw new ParseError(`Unexpected value for member name`, propertyName)
}

export function getDeclaration(
  typeNode: ts.TypeReferenceType,
  typeChecker: ts.TypeChecker,
): ts.Declaration {
  const symbol = typeChecker.getSymbolAtLocation(
    ts.isTypeReferenceNode(typeNode) ? typeNode.typeName : typeNode.expression,
  )
  if (!symbol) {
    throw new ParseError("Entity must have symbol", typeNode)
  }

  const declaration = symbol?.declarations?.[0]
  if (!declaration) {
    throw new ParseError("Entity must have declaration", typeNode)
  }

  return declaration
}

function getNonOptionalType(propType: ts.Type): ts.Type {
  if (!propType.isUnion() || propType.types.length !== 2) {
    return propType
  }

  const nonUndefinedType = propType.types.find(
    (t) => (t.flags & ts.TypeFlags.Undefined) === 0,
  )

  if (!nonUndefinedType) {
    return propType
  }

  return nonUndefinedType
}

function getUpdatedTypeParams(
  typeNode: ts.TypeReferenceType,
  location: ts.TypeNode,
  declaration: ts.Declaration,
  type: ts.TypeReference,
  typeChecker: ts.TypeChecker,
  typeParams: TypeParamMap,
  deps: DependencyMap,
): { typeParams: TypeParamMap; deps: DependencyMap } {
  if (
    (!ts.isInterfaceDeclaration(declaration) &&
      !ts.isTypeAliasDeclaration(declaration)) ||
    !declaration.typeParameters ||
    declaration.typeParameters.length === 0
  ) {
    return { typeParams, deps }
  }

  const typeArgumentTypes: readonly ts.Type[] =
    type.aliasTypeArguments ?? typeChecker.getTypeArguments(type)
  const typeArguments = typeNode.typeArguments ?? []

  let depsMap: DependencyMap = deps

  for (let i = 0; i < declaration.typeParameters.length; i++) {
    const typeParam = declaration.typeParameters[i]
    const typeArgument = typeArguments[i]
    const typeArgumentType = typeArgumentTypes[i]

    if (typeArgumentType) {
      const typeArgModel = typeToParserModel(
        typeArgumentType,
        typeNode,
        location,
        typeChecker,
        depsMap,
        typeParams,
      )
      typeParams.set(typeParam.name.text, {
        name: typeChecker.typeToString(typeArgumentType),
        model: typeArgModel.root,
      })
      depsMap = typeArgModel.deps
    } else if (typeArgument) {
      const inferedTypeArgumentType =
        typeChecker.getTypeAtLocation(typeArgument)
      if (inferedTypeArgumentType.isTypeParameter()) {
        typeParams.set(
          typeParam.name.text,
          getTypeParamParserModel(typeNode, typeParam, typeParams),
        )
      } else {
        const typeArgModel = generateFromTypeNode(
          typeArgument,
          inferedTypeArgumentType,
          location,
          typeChecker,
          deps,
          typeParams,
        )
        typeParams.set(typeParam.name.text, {
          name: typeChecker.typeToString(inferedTypeArgumentType),
          model: typeArgModel.root,
        })
        depsMap = typeArgModel.deps
      }
    } else {
      throw new ParseError(
        "Type parameter has no default or is is it parameterised",
        typeParam,
      )
    }
  }

  return { typeParams, deps: depsMap }
}

function generateTypeName(typeNode: ts.TypeReferenceType): string {
  if (ts.isExpressionWithTypeArguments(typeNode)) {
    if (!ts.isIdentifier(typeNode.expression)) {
      throw new ParseError("Expression not supported", typeNode.expression)
    }
    return entityNameAsString(typeNode.expression)
  }

  return entityNameAsString(typeNode.typeName)

  function entityNameAsString(typeName: ts.EntityName): string {
    if (ts.isIdentifier(typeName)) {
      return typeName.text
    }
    return `${entityNameAsString(typeName.left)}.${typeName.right.text}`
  }
}

function generateReferenceParserModelForDeclaration(
  typeNode: ts.TypeReferenceType,
  declaration: ts.Declaration,
  typeParams: TypeParamMap,
): ReferenceParserModel {
  if (
    (!ts.isInterfaceDeclaration(declaration) &&
      !ts.isTypeAliasDeclaration(declaration)) ||
    !declaration.typeParameters ||
    declaration.typeParameters.length === 0
  ) {
    return {
      type: ParserModelType.Reference,
      typeName: generateTypeName(typeNode),
    }
  }

  const typeArgumentModels: Array<{ name: string; model: ParserModel }> = []

  for (let i = 0; i < declaration.typeParameters.length; i++) {
    const typeParam = declaration.typeParameters[i]
    const typeParamModel = getTypeParamParserModel(
      typeNode,
      typeParam,
      typeParams,
    )
    typeArgumentModels.push(typeParamModel)
  }

  return {
    type: ParserModelType.Reference,
    typeName: `${generateTypeName(typeNode)}<${typeArgumentModels
      .map((tam) => tam.name)
      .join(", ")}>`,
    typeArguments: typeArgumentModels.map((tam) => tam.model),
  }
}
