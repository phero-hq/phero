import ts from "typescript"
import { ParseError } from "../domain/errors"
import { getTypeFlags } from "../generate-model-2/generateParserModelUtils"
import {
  EnumMemberParserModel,
  EnumParserModel,
  IndexMemberParserModel,
  MemberParserModel,
  ObjectParserModel,
  ParserModel,
  ParserModelType,
} from "../generate-model-2/ParserModel"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

export function generateParserModel(
  func: ts.FunctionDeclaration,
  prog: ts.Program,
): ParserModelMap {
  const typeChecker = prog.getTypeChecker()

  const funcType = func.type

  if (!funcType) {
    throw new ParseError("Function must have type", func)
  }

  const { root, deps } = generate(funcType, typeChecker)

  const funcTypeType = typeChecker.getTypeAtLocation(funcType)
  return { root, deps: resolveDependencies(deps, typeChecker, funcTypeType) }

  // DIT WERKT ALS EEN TIERELIER -->>>>
  // if (ts.isTypeReferenceNode(funcType)) {
  //   const funcTypeType = typeChecker.getTypeAtLocation(funcType)

  //   const propSymbol = funcTypeType.getProperty("prop")
  //   const typeOfProp = typeChecker.getTypeOfSymbolAtLocation(
  //     propSymbol!,
  //     funcType,
  //   )

  //   const innerSymbol = typeOfProp.getProperty("inner")
  //   const typeOfInner = typeChecker.getTypeOfSymbolAtLocation(
  //     innerSymbol!,
  //     funcType,
  //   )

  //   console.log("XX1", getTypeFlags(typeOfProp))
  //   console.log("XX2", getTypeFlags(typeOfInner))
  // }

  throw new Error("xxxx")
}

function generate(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
): { root: ParserModel; deps: ts.TypeReferenceNode[] } {
  if (ts.isTokenKind(typeNode.kind)) {
    return { root: generateTokenType(typeNode.kind), deps: [] }
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    return { root: generateLiteralType(typeNode, typeChecker), deps: [] }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    const { root: elementParser, deps } = generate(
      typeNode.elementType,
      typeChecker,
    )
    return {
      root: {
        type: ParserModelType.Array,
        element: {
          type: ParserModelType.ArrayElement,
          parser: elementParser,
        },
      },
      deps,
    }
  }

  if (ts.isUnionTypeNode(typeNode)) {
    const typeParserModels = typeNode.types.map((type) =>
      generate(type, typeChecker),
    )
    return {
      root: {
        type: ParserModelType.Union,
        oneOf: typeParserModels.map((pm) => pm.root),
      },
      deps: typeParserModels.flatMap((pm) => pm.deps),
    }
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    const typeParserModels = typeNode.types.map((type) =>
      generate(type, typeChecker),
    )
    return {
      root: {
        type: ParserModelType.Intersection,
        parsers: typeParserModels.map((pm) => pm.root),
      },
      deps: typeParserModels.flatMap((pm) => pm.deps),
    }
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return generate(typeNode.type, typeChecker)
  }

  if (ts.isTupleTypeNode(typeNode)) {
    const elementParsers = typeNode.elements.map((element) =>
      generate(element, typeChecker),
    )
    return {
      root: {
        type: ParserModelType.Tuple,
        elements: elementParsers.map(({ root: parser }, position) => ({
          type: ParserModelType.TupleElement,
          position,
          parser,
        })),
      },
      deps: elementParsers.flatMap((p) => p.deps),
    }
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    const memberParsers = typeNode.members.map((member) =>
      generateMemberParserModel(member, typeChecker),
    )
    return {
      root: {
        type: ParserModelType.Object,
        members: memberParsers.map((member) => member.root),
      },
      deps: memberParsers.flatMap((member) => member.deps),
    }
  }

  if (ts.isConditionalTypeNode(typeNode)) {
    const conditionalType = typeChecker.getTypeAtLocation(
      typeNode,
    ) as ts.ConditionalType
    // const p = typeToParserModel(t)
    // console.log("P", p)
    // console.log(conditionalType)

    // root: ConditionalRoot;
    // checkType: Type;
    // extendsType: Type;

    console.log(conditionalType.extendsType)
    console.log("---")
    console.log(conditionalType.resolvedFalseType)
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const symbol = typeChecker.getSymbolAtLocation(typeNode.typeName)
    const declaration = symbol && symbol.declarations?.[0]
    const isTypeParameter =
      !!declaration && ts.isTypeParameterDeclaration(declaration)

    if (isTypeParameter) {
      return {
        root: {
          type: ParserModelType.TypeParameter,
          name: entityNameAsString(typeNode.typeName),
          position: 0,
        },
        deps: [],
      }
    }

    const typeNodeType = typeChecker.getTypeAtLocation(typeNode)
    const typeNodeTypeAsTypeRef = typeNodeType as ts.TypeReference

    const typeArgumentTypes =
      typeNodeTypeAsTypeRef.typeArguments ??
      typeNodeTypeAsTypeRef.aliasTypeArguments

    const typeArgumentParsers = typeArgumentTypes?.map((ta) =>
      typeToParserModel(ta, typeNode, typeChecker),
    )

    return {
      root: {
        type: ParserModelType.Reference,
        typeName: entityNameAsString(typeNode.typeName),
        typeArguments: typeArgumentParsers,
      },
      deps: [typeNode],
    }
  }

  throw new ParseError("TypeNode not implemented " + typeNode.kind, typeNode)
}

function generateTokenType(tokenKind: ts.SyntaxKind): ParserModel {
  switch (tokenKind) {
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
      throw new Error(`TokenKind ${tokenKind} not implemented`)
  }
}

function generateLiteralType(
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
      throw new Error(`Literal ${typeNode.literal.kind} not implemented`)
  }
}

function generateMemberParserModel(
  member: ts.TypeElement,
  typeChecker: ts.TypeChecker,
): {
  root: MemberParserModel | IndexMemberParserModel
  deps: ts.TypeReferenceNode[]
} {
  if (ts.isPropertySignature(member)) {
    if (!member.type) {
      throw new ParseError("Member must have a type", member)
    }
    const { root: parser, deps } = generate(member.type, typeChecker)
    return {
      root: {
        type: ParserModelType.Member,
        name: getMemberNameAsString(member),
        optional: !!member.questionToken,
        parser,
      },
      deps,
    }
  } else if (ts.isIndexSignatureDeclaration(member)) {
    if (!member.type) {
      throw new ParseError("Member must have a type", member)
    }
    // TODO IndexMember
  }
  throw new ParseError("Member type is not supported", member)
}

function resolveDependencies(
  deps: ts.TypeReferenceNode[],
  typeChecker: ts.TypeChecker,
  funcTypeType: ts.Type,
  symbols: ts.Symbol[] = [],
  accum: Record<string, ParserModel> = {},
): Record<string, ParserModel> {
  if (deps.length === 0) {
    return accum
  }

  const [typeRefNode, ...otherDeps] = deps

  const symbol = typeChecker.getSymbolAtLocation(typeRefNode.typeName)

  if (!symbol) {
    throw new ParseError("TypeReferenceNode has no symbol", typeRefNode)
  }

  if (symbols.includes(symbol)) {
    return resolveDependencies(
      otherDeps,
      typeChecker,
      funcTypeType,
      symbols,
      accum,
    )
  }

  const declaration = symbol?.declarations?.[0]

  if (!declaration) {
    throw new ParseError("TypeReference must have declaration", typeRefNode)
  }

  if (ts.isEnumDeclaration(declaration)) {
    const enumParser = getEnumParserModelFromDeclaration(
      declaration,
      typeChecker,
    )
    return resolveDependencies(
      otherDeps,
      typeChecker,
      funcTypeType,
      [...symbols, symbol],
      {
        ...accum,
        [enumParser.name]: enumParser,
      },
    )
  } else if (ts.isEnumMember(declaration)) {
    const enumMemberParser = getEnumMemberParserModelFromDeclaration(
      declaration,
      typeChecker,
    )
    const enumName = declaration.parent.name.text
    return resolveDependencies(
      otherDeps,
      typeChecker,
      funcTypeType,
      [...symbols, symbol],
      {
        ...accum,
        [`${enumName}.${enumMemberParser.name}`]: enumMemberParser,
      },
    )
  } else if (ts.isInterfaceDeclaration(declaration)) {
    const { root: objectParser, deps: interfaceDeclrDeps } =
      getObjectParserModelFromDeclaration(declaration, typeChecker)

    return resolveDependencies(
      [...otherDeps, ...interfaceDeclrDeps],
      typeChecker,
      funcTypeType,
      [...symbols, symbol],
      {
        ...accum,
        [`${entityNameAsString(typeRefNode.typeName)}${getTypeParameterNames(
          declaration,
        )}`]: objectParser,
      },
    )
  } else if (ts.isTypeAliasDeclaration(declaration)) {
    if (ts.isConditionalTypeNode(declaration.type)) {
      const conditionalType = typeChecker.getTypeAtLocation(typeRefNode)
      console.log(
        "YYYYYYY",
        JSON.stringify(
          typeToParserModel(conditionalType, typeRefNode, typeChecker),
          null,
          4,
        ),
      )
      // return {
      //   ty
      // }
    }

    const { root: typeAliasParser, deps: typeAliasDeclrDeps } = generate(
      declaration.type,
      typeChecker,
    )
    return resolveDependencies(
      [...otherDeps, ...typeAliasDeclrDeps],
      typeChecker,
      funcTypeType,
      [...symbols, symbol],
      {
        ...accum,
        [`${entityNameAsString(typeRefNode.typeName)}${getTypeParameterNames(
          declaration,
        )}`]: typeAliasParser,
      },
    )
  } else if (ts.isTypeParameterDeclaration(declaration)) {
    return resolveDependencies(
      otherDeps,
      typeChecker,
      funcTypeType,
      [...symbols, symbol],
      accum,
    )
  }

  throw new Error("Declaration not implemented " + declaration.kind)
}

function getTypeParameterNames(
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
): string {
  const typeParameterNames = declaration.typeParameters?.map(
    (typeParam) => typeParam.name.text,
  )

  return typeParameterNames ? `<${typeParameterNames.join(", ")}>` : ""
}

function getObjectParserModelFromDeclaration(
  interfaceDeclr: ts.InterfaceDeclaration,
  typeChecker: ts.TypeChecker,
): { root: ObjectParserModel; deps: ts.TypeReferenceNode[] } {
  const memberParsers = interfaceDeclr.members.map((member) =>
    generateMemberParserModel(member, typeChecker),
  )
  return {
    root: {
      type: ParserModelType.Object,
      members: memberParsers.map((member) => member.root),
    },
    deps: memberParsers.flatMap((member) => member.deps),
  }
}

function getEnumParserModelFromDeclaration(
  enumDeclr: ts.EnumDeclaration,
  typeChecker: ts.TypeChecker,
): EnumParserModel {
  return {
    type: ParserModelType.Enum,
    name: enumDeclr.name.text,
    members: enumDeclr.members.map((member) =>
      getEnumMemberParserModelFromDeclaration(member, typeChecker),
    ),
  }
}

function getEnumMemberParserModelFromDeclaration(
  member: ts.EnumMember,
  typeChecker: ts.TypeChecker,
): EnumMemberParserModel {
  const enumValueType = typeChecker.getTypeAtLocation(member)
  const memberParser = typeToParserModel(enumValueType, undefined, typeChecker)
  if (
    memberParser.type !== ParserModelType.NumberLiteral &&
    memberParser.type !== ParserModelType.StringLiteral
  ) {
    throw new ParseError(
      "Enum member should be either of type string or number",
      member,
    )
  }
  return {
    type: ParserModelType.EnumMember,
    name: propertyNameAsString(member.name),
    parser: memberParser,
  }
}

function typeToParserModel(
  type: ts.Type,
  typeNode: ts.TypeNode | undefined,
  typeChecker: ts.TypeChecker,
): ParserModel {
  if (type.flags & ts.TypeFlags.StringLiteral) {
    const s = type as ts.StringLiteralType
    return {
      type: ParserModelType.StringLiteral,
      literal: s.value,
    }
  } else if (type.flags & ts.TypeFlags.NumberLiteral) {
    const s = type as ts.NumberLiteralType
    return {
      type: ParserModelType.NumberLiteral,
      literal: s.value,
    }
  } else if (type.flags & ts.TypeFlags.String) {
    return {
      type: ParserModelType.String,
    }
  } else if (type.flags & ts.TypeFlags.Number) {
    return {
      type: ParserModelType.Number,
    }
  } else if (type.flags & ts.TypeFlags.Boolean) {
    return {
      type: ParserModelType.Boolean,
    }
  } else if (type.flags & ts.TypeFlags.TypeParameter) {
    return {
      type: ParserModelType.TypeParameter,
      name: type.symbol.name,
      position: 0,
    }
  } else if (type.flags & ts.TypeFlags.Object) {
    if (typeNode == undefined) {
      throw new Error("typeNode should not be typeNode")
    }
    return {
      type: ParserModelType.Object,
      members: type.getProperties().map((prop) => {
        const g = typeChecker.getTypeOfSymbolAtLocation(prop, typeNode)
        const parser = typeToParserModel(g, typeNode, typeChecker)
        return {
          type: ParserModelType.Member,
          name: prop.name,
          optional:
            (prop.flags & ts.SymbolFlags.Optional) === ts.SymbolFlags.Optional,
          parser,
        }
      }),
    }
  } else if (type.flags & ts.TypeFlags.Union) {
    const unionType = type as ts.UnionType
    return {
      type: ParserModelType.Union,
      oneOf: unionType.types.map((type) =>
        typeToParserModel(type, typeNode, typeChecker),
      ),
    }
  } else if (type.flags & ts.TypeFlags.Undefined) {
    return { type: ParserModelType.Undefined }
  } else if (type.flags & ts.TypeFlags.Conditional) {
    const conditionalType = type as ts.ConditionalType
    const t = typeChecker.getTypeOfSymbolAtLocation(type.symbol, typeNode!)
    if (ts.isTypeParameterDeclaration(conditionalType.root.node.parent)) {
      return {
        type: ParserModelType.TypeParameter,
        name: conditionalType.root.node.parent.name.text,
        position: 0,
      }
    }
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

function entityNameAsString(typeName: ts.EntityName): string {
  if (ts.isIdentifier(typeName)) {
    return typeName.text
  }
  return `${entityNameAsString(typeName.left)}.${typeName.right.text}`
}
