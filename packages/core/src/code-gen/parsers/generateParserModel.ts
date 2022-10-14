import ts from "typescript"
import { ParseError } from "../../errors"
import { printCode } from "../../tsTestUtils"
import {
  getFullyQualifiedName,
  getTypeName,
  isExternalType,
} from "../../tsUtils"

export enum ParserModelType {
  Root = "root",
  String = "string",
  StringLiteral = "string-literal",
  Number = "number",
  NumberLiteral = "number-literal",
  Boolean = "boolean",
  BooleanLiteral = "boolean-literal",
  Null = "null",
  Undefined = "undefined",
  Void = "void",
  Object = "object",
  Member = "member",
  IndexMember = "indexMember",
  Array = "array",
  ArrayElement = "arrayElement",
  Tuple = "tuple",
  TupleElement = "tupleElement",
  Union = "union",
  Intersection = "intersection",
  Enum = "enum",
  Reference = "reference",
  Date = "date",
  Any = "any",
  TypeParameter = "typeParameter",
}

export type ParserModel =
  | RootParserModel
  | StringParserModel
  | StringLiteralParserModel
  | NumberParserModel
  | NumberLiteralParserModel
  | BooleanParserModel
  | BooleanLiteralParserModel
  | NullParserModel
  | UndefinedParserModel
  | VoidParserModel
  | ObjectParserModel
  | MemberParserModel
  | IndexMemberParserModel
  | ArrayParserModel
  | ArrayElementParserModel
  | TupleParserModel
  | TupleElementParserModel
  | UnionParserModel
  | IntersectionParserModel
  | EnumParserModel
  | ReferenceParserModel
  | DateParserModel
  | AnyParserModel
  | TypeParameterParserModel

export interface RootParserModel {
  type: ParserModelType.Root
  rootTypeParser?: {
    typeName: string
    baseTypeName: string
    typeParameters: {
      typeName: string
      defaultParser?: {
        typeName: string
        parser: ParserModel
      }
    }[]
  }
  name: string
  parser: ParserModel
}
export interface StringParserModel {
  type: ParserModelType.String
}
export interface StringLiteralParserModel {
  type: ParserModelType.StringLiteral
  literal: string
}
export interface NumberParserModel {
  type: ParserModelType.Number
}
export interface NumberLiteralParserModel {
  type: ParserModelType.NumberLiteral
  literal: number
}
export interface BooleanParserModel {
  type: ParserModelType.Boolean
}
export interface BooleanLiteralParserModel {
  type: ParserModelType.BooleanLiteral
  literal: boolean
}
export interface NullParserModel {
  type: ParserModelType.Null
}
export interface UndefinedParserModel {
  type: ParserModelType.Undefined
}
export interface VoidParserModel {
  type: ParserModelType.Void
}
export interface ObjectParserModel {
  type: ParserModelType.Object
  members: (MemberParserModel | IndexMemberParserModel)[]
}
export interface MemberParserModel {
  type: ParserModelType.Member
  name: string
  optional: boolean
  parser: ParserModel
}
export interface IndexMemberParserModel {
  type: ParserModelType.IndexMember
  keyParser: ParserModel
  depth: number
  optional: boolean
  parser: ParserModel
}
export interface ArrayParserModel {
  type: ParserModelType.Array
  depth: number
  element: ArrayElementParserModel
}
export interface ArrayElementParserModel {
  type: ParserModelType.ArrayElement
  depth: number
  parser: ParserModel
}
export interface TupleParserModel {
  type: ParserModelType.Tuple
  elements: TupleElementParserModel[]
}
export interface TupleElementParserModel {
  type: ParserModelType.TupleElement
  position: number
  parser: ParserModel
}
export interface UnionParserModel {
  type: ParserModelType.Union
  oneOf: ParserModel[]
}
export interface IntersectionParserModel {
  type: ParserModelType.Intersection
  parsers: ParserModel[]
}
export interface EnumParserModel {
  type: ParserModelType.Enum
  members: (StringLiteralParserModel | NumberLiteralParserModel)[]
}
export interface ReferenceParserModel {
  type: ParserModelType.Reference
  typeName: string
  fullyQualifiedName: {
    base: string
    typeArgs?: string
    full: string
  }
  baseTypeName: string
  typeArguments: {
    typeName: string
    fullyQualifiedName?: {
      base: string
      typeArgs?: string
      full: string
    }
    parser: ParserModel
  }[]
}
export interface DateParserModel {
  type: ParserModelType.Date
}
export interface AnyParserModel {
  type: ParserModelType.Any
}
export interface TypeParameterParserModel {
  type: ParserModelType.TypeParameter
  typeName: string
  position: number
  defaultParser?: {
    typeName: string
    parser: ParserModel
  }
}

export default function generateParserModel(
  typeChecker: ts.TypeChecker,
  rootNode: ts.Node,
  rootName: string,
): RootParserModel {
  const type = typeChecker.getTypeAtLocation(rootNode)
  const typeName = typeChecker.typeToString(type, rootNode, undefined)

  if (ts.isInterfaceDeclaration(rootNode)) {
    const heritageReferenceParsers = (rootNode.heritageClauses ?? [])
      .flatMap((heritageClause) => heritageClause.types)
      .map((heritageType) =>
        generateReferenceParserModel(type, heritageType, 0),
      )

    const objectParser: ObjectParserModel = {
      type: ParserModelType.Object,
      members: rootNode.members.reduce((members, member) => {
        return member.name
          ? [
              ...members,
              {
                type: ParserModelType.Member,
                name: getMemberName(member.name),
                optional: !!member.questionToken,
                parser: generate(member, 0),
              },
            ]
          : members
      }, [] as MemberParserModel[]),
    }

    return {
      type: ParserModelType.Root,
      name: rootName,
      rootTypeParser: {
        baseTypeName: rootNode.name.text,
        typeName,
        typeParameters:
          rootNode.typeParameters?.map((typeParam) => ({
            typeName: typeParam.name.text,
            defaultParser: typeParam.default && {
              typeName: typeChecker.typeToString(
                typeChecker.getTypeFromTypeNode(typeParam.default),
                rootNode,
                undefined,
              ),
              parser: generate(typeParam.default, 0),
            },
          })) ?? [],
      },
      parser: heritageReferenceParsers.length
        ? {
            type: ParserModelType.Intersection,
            parsers: [...heritageReferenceParsers, objectParser],
          }
        : objectParser,
    }
  } else if (ts.isTypeAliasDeclaration(rootNode)) {
    return {
      type: ParserModelType.Root,
      name: rootName,
      rootTypeParser: {
        baseTypeName: rootNode.name.text,
        typeName: rootNode.typeParameters?.length
          ? typeName
          : rootNode.name.text,
        typeParameters:
          rootNode.typeParameters?.map((typeParam) => ({
            typeName: typeParam.name.text,
            defaultParser: typeParam.default && {
              typeName: typeChecker.typeToString(
                typeChecker.getTypeFromTypeNode(typeParam.default),
                rootNode,
                undefined,
              ),
              parser: generate(typeParam.default, 0),
            },
          })) ?? [],
      },
      parser: generate(rootNode.type, 0),
    }
  } else if (ts.isFunctionDeclaration(rootNode)) {
    return {
      type: ParserModelType.Root,
      name: rootName,
      parser: {
        type: ParserModelType.Object,
        members: rootNode.parameters.map((param) => {
          const paramType =
            //  if it's of type PheroContext, we actually want the type arg
            param.type &&
            ts.isTypeReferenceNode(param.type) &&
            getTypeName(param.type) === "PheroContext"
              ? param.type.typeArguments?.[0]
              : param.type

          if (!paramType) {
            throw new ParseError(
              "S153: Function parameter has no returnType",
              param,
            )
          }

          return {
            type: ParserModelType.Member,
            name: getMemberName(param.name),
            optional: !!param.questionToken,
            parser: generate(paramType, 0),
          }
        }),
      },
      // parser: generate(rootNode, 0),
    }
  }

  return {
    type: ParserModelType.Root,
    name: rootName,
    rootTypeParser: {
      typeName,
      baseTypeName: typeName,
      typeParameters: [],
    },
    parser: generate(rootNode, 0),
  }

  function generate(node: ts.Node, depth: number): ParserModel {
    if (ts.isPropertySignature(node)) {
      if (!node.type) {
        throw new ParseError("S154: Property has no type", node)
      }
      return generate(node.type, depth)
    }

    if (ts.isTypeNode(node)) {
      switch (node.kind) {
        case ts.SyntaxKind.VoidKeyword:
          return {
            type: ParserModelType.Void,
          }
        case ts.SyntaxKind.UndefinedKeyword:
          return {
            type: ParserModelType.Undefined,
          }
        case ts.SyntaxKind.StringKeyword:
          return {
            type: ParserModelType.String,
          }
        case ts.SyntaxKind.NumberKeyword:
          return {
            type: ParserModelType.Number,
          }
        case ts.SyntaxKind.BooleanKeyword:
          return {
            type: ParserModelType.Boolean,
          }
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.UnknownKeyword:
          return {
            type: ParserModelType.Any,
          }
      }
    }

    if (ts.isLiteralTypeNode(node)) {
      switch (node.literal.kind) {
        case ts.SyntaxKind.NullKeyword:
          return { type: ParserModelType.Null }
        case ts.SyntaxKind.UndefinedKeyword:
          return { type: ParserModelType.Undefined }
        case ts.SyntaxKind.TrueKeyword:
          return { type: ParserModelType.BooleanLiteral, literal: true }
        case ts.SyntaxKind.FalseKeyword:
          return { type: ParserModelType.BooleanLiteral, literal: false }
        case ts.SyntaxKind.NumericLiteral:
          return {
            type: ParserModelType.NumberLiteral,
            literal: parseInt(node.literal.text, 10),
          }

        case ts.SyntaxKind.StringLiteral:
          return {
            type: ParserModelType.StringLiteral,
            literal: node.literal.text,
          }
      }
    }

    if (ts.isArrayTypeNode(node)) {
      return {
        type: ParserModelType.Array,
        depth,
        element: {
          type: ParserModelType.ArrayElement,
          depth,
          parser: generate(node.elementType, depth + 1),
        },
      }
    }

    if (ts.isTypeLiteralNode(node)) {
      return {
        type: ParserModelType.Object,
        members: node.members.reduce((members, member) => {
          if (
            ts.isIndexSignatureDeclaration(member) &&
            member.parameters.length === 1 &&
            member.parameters[0].type
          ) {
            return [
              ...members,
              {
                type: ParserModelType.IndexMember,
                depth,
                keyParser: generate(member.parameters[0].type, depth + 1),
                optional: !!member.questionToken,
                parser: generate(member.type, depth + 1),
              },
            ]
          } else if (member.name) {
            return [
              ...members,
              {
                type: ParserModelType.Member,
                name: getMemberName(member.name),
                optional: !!member.questionToken,
                parser: generate(member, depth),
              },
            ]
          } else {
            return members
          }
        }, [] as ObjectParserModel["members"]),
      }
    }

    if (ts.isTupleTypeNode(node)) {
      return {
        type: ParserModelType.Tuple,
        elements: node.elements.map((element, position) => ({
          type: ParserModelType.TupleElement,
          position,
          parser: generate(element, depth),
        })),
      }
    }

    if (ts.isUnionTypeNode(node)) {
      return {
        type: ParserModelType.Union,
        oneOf: node.types.map(generate),
      }
    }

    if (ts.isIntersectionTypeNode(node)) {
      return {
        type: ParserModelType.Intersection,
        parsers: node.types.map(generate),
      }
    }

    if (
      ts.isTypeReferenceNode(node) &&
      getMemberName(node.typeName) === "Array" &&
      node.typeArguments?.length === 1
    ) {
      return {
        type: ParserModelType.Array,
        depth,
        element: {
          type: ParserModelType.ArrayElement,
          depth,
          parser: generate(node.typeArguments[0], depth + 1),
        },
      }
    }

    if (ts.isEnumDeclaration(node)) {
      return getEnumParser(node)
    }

    if (ts.isTypeReferenceNode(node)) {
      const type = typeChecker.getTypeAtLocation(node)
      const declr = type.symbol?.valueDeclaration
      if (declr) {
        if (isExternalType(type) && type.symbol.name === "Date") {
          return {
            type: ParserModelType.Date,
          }
        } else if (ts.isEnumDeclaration(declr)) {
          return getEnumParser(declr)
        } else if (ts.isEnumMember(declr)) {
          return getEnumParser(declr.parent).members[
            declr.parent.members.indexOf(declr)
          ]
        }
      }
      // in case there's no actual argument for the TypeParameter
      else if (
        (type.flags & ts.TypeFlags.TypeParameter) ===
        ts.TypeFlags.TypeParameter
      ) {
        const defaultType = type.getDefault()
        const defaultTypeNode =
          defaultType &&
          typeChecker.typeToTypeNode(defaultType, node, undefined)

        const defaultParser = defaultTypeNode
          ? {
              typeName: typeChecker.typeToString(defaultType, node, undefined),
              parser: generate(defaultTypeNode, depth),
            }
          : undefined

        const declr = type.symbol.declarations?.[0]
        let position = -1
        if (declr && ts.isTypeParameterDeclaration(declr)) {
          if (
            ts.isInterfaceDeclaration(declr.parent) ||
            ts.isTypeAliasDeclaration(declr.parent)
          ) {
            position = declr.parent.typeParameters?.indexOf(declr) ?? -1
          } else {
            throw new ParseError(
              "S144: Should be either interface or TypeAlias",
              declr,
            )
          }
        }

        return {
          type: ParserModelType.TypeParameter,
          typeName: typeChecker.typeToString(type, node, undefined),
          position,
          defaultParser,
        }
      } else if ((type.flags & ts.TypeFlags.Object) === ts.TypeFlags.Object) {
        return generateObjectType(type, node, depth)
      } else if (type.isUnionOrIntersection()) {
        return generateReferenceParserModel(type, node, depth)
      }
    }

    if (ts.isParenthesizedTypeNode(node)) {
      return generate(node.type, depth)
    }

    if (
      ts.isMappedTypeNode(node) &&
      node.type &&
      node.typeParameter.constraint
    ) {
      return {
        type: ParserModelType.Object,
        members: [
          {
            type: ParserModelType.IndexMember,
            depth,
            keyParser: generate(node.typeParameter.constraint, depth + 1),
            optional: false,
            parser: generate(node.type, depth + 1),
          },
        ],
      }
    }

    if (
      ts.isTypeOperatorNode(node) &&
      node.operator === ts.SyntaxKind.KeyOfKeyword
    ) {
      const type = typeChecker.getTypeAtLocation(node.type)
      const props = typeChecker.getAugmentedPropertiesOfType(type)
      return {
        type: ParserModelType.Union,
        oneOf: props.map((member) => ({
          type: ParserModelType.StringLiteral,
          literal: member.name,
        })),
      }
    }

    if (
      ts.isIndexedAccessTypeNode(node) &&
      ts.isLiteralTypeNode(node.indexType) &&
      ts.isStringLiteral(node.indexType.literal)
    ) {
      const prop = typeChecker
        .getTypeAtLocation(node.objectType)
        .getProperty(node.indexType.literal.text)

      if (prop?.valueDeclaration) {
        return generate(prop.valueDeclaration, depth)
      }
    }

    throw new ParseError(
      `S145: ParserModel not implemented yet: \`${printCode(node)}\` (kind:${
        node.kind
      })`,
      node,
    )
  }

  function generateObjectType(
    type: ts.Type,
    node: ts.TypeReferenceNode,
    depth: number,
  ): ParserModel {
    if (isExternalType(type)) {
      const props = typeChecker.getAugmentedPropertiesOfType(type)

      return {
        type: ParserModelType.Object,
        members: props.reduce<MemberParserModel[]>((members, member) => {
          const memberType = typeChecker.getTypeOfSymbolAtLocation(member, node)
          const actualType = typeChecker.typeToTypeNode(
            memberType,
            node,
            undefined,
          )
          const optional =
            (member.flags & ts.SymbolFlags.Optional) === ts.SymbolFlags.Optional

          return member.name && actualType
            ? [
                ...members,
                {
                  type: ParserModelType.Member,
                  name: member.name,
                  optional,
                  parser: generate(actualType, depth),
                },
              ]
            : members
        }, []),
      }
    }
    return generateReferenceParserModel(type, node, depth)
  }

  function getMemberName(
    name: ts.PropertyName | ts.EntityName | ts.BindingName,
  ): string {
    if (!name) {
      throw new Error("No member name")
    }

    if (ts.isIdentifier(name)) {
      return name.text
    } else if (ts.isStringLiteral(name)) {
      return name.text
    } else if (ts.isNumericLiteral(name)) {
      return name.text
    } else if (ts.isQualifiedName(name)) {
      return name.right.text
    } else if (ts.isComputedPropertyName(name)) {
      throw new ParseError(
        `S146: No support for computed names ${printCode(name)}`,
        name,
      )
    } else if (ts.isPrivateIdentifier(name)) {
      throw new ParseError(
        `S147: No support for private names ${printCode(name)}`,
        name,
      )
    } else if (ts.isBindingName(name)) {
      throw new ParseError(
        `S148: No support for binding names ${printCode(name)}`,
        name,
      )
    }

    throw new ParseError("S149: Name not supported", name)
  }

  function getEnumParser(enumDeclr: ts.EnumDeclaration): EnumParserModel {
    let nextUninitializedValue = 0
    return {
      type: ParserModelType.Enum,
      members: enumDeclr.members.map((member) => {
        if (member.initializer) {
          if (ts.isStringLiteral(member.initializer)) {
            return {
              type: ParserModelType.StringLiteral,
              literal: member.initializer.text,
            }
          } else if (ts.isNumericLiteral(member.initializer)) {
            const memberValue = parseInt(member.initializer.text, 10)
            nextUninitializedValue = memberValue + 1
            return {
              type: ParserModelType.NumberLiteral,
              literal: memberValue,
            }
          } else {
            throw new ParseError(
              "S150: Enum member has unsupported value",
              enumDeclr,
            )
          }
        } else {
          return {
            type: ParserModelType.NumberLiteral,
            literal: nextUninitializedValue++,
          }
        }
      }),
    }
  }

  function generateReferenceParserModel(
    type: ts.Type,
    node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
    depth: number,
  ): ReferenceParserModel {
    const baseTypeName = ts.isTypeReferenceNode(node)
      ? getMemberName(node.typeName)
      : ts.isIdentifier(node.expression)
      ? node.expression.text
      : ts.isPropertyAccessExpression(node.expression)
      ? getMemberName(node.expression.name)
      : undefined

    if (!baseTypeName) {
      throw new ParseError(
        `Unexpected expression (${(node as any)?.expression.kind ?? 0})`,
        node,
      )
    }

    return {
      type: ParserModelType.Reference,
      baseTypeName,
      typeName: typeChecker.typeToString(type, node, undefined),
      fullyQualifiedName: getFullyQualifiedName(node, typeChecker),
      typeArguments:
        node.typeArguments?.map((typeArg) => ({
          typeName: typeChecker.typeToString(
            typeChecker.getTypeFromTypeNode(typeArg),
          ),
          fullyQualifiedName: ts.isTypeReferenceNode(typeArg)
            ? getFullyQualifiedName(typeArg, typeChecker)
            : undefined,
          parser: generate(typeArg, depth),
        })) ?? [],
    }
  }
}
