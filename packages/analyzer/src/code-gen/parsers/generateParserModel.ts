import ts from "typescript"
import { isExternalType } from "../../tsUtils"

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

export type RootParserModel = {
  type: ParserModelType.Root
  name: string
  parser: ParserModel
}
export type StringParserModel = { type: ParserModelType.String }
export type StringLiteralParserModel = {
  type: ParserModelType.StringLiteral
  literal: string
}
export type NumberParserModel = { type: ParserModelType.Number }
export type NumberLiteralParserModel = {
  type: ParserModelType.NumberLiteral
  literal: number
}
export type BooleanParserModel = { type: ParserModelType.Boolean }
export type BooleanLiteralParserModel = {
  type: ParserModelType.BooleanLiteral
  literal: boolean
}
export type NullParserModel = { type: ParserModelType.Null }
export type UndefinedParserModel = { type: ParserModelType.Undefined }
export type ObjectParserModel = {
  type: ParserModelType.Object
  members: (MemberParserModel | IndexMemberParserModel)[]
}
export type MemberParserModel = {
  type: ParserModelType.Member
  name: string
  optional: boolean
  parser: ParserModel
}
export type IndexMemberParserModel = {
  type: ParserModelType.IndexMember
  keyParser: ParserModel
  depth: number
  optional: boolean
  parser: ParserModel
}
export type ArrayParserModel = {
  type: ParserModelType.Array
  depth: number
  element: ArrayElementParserModel
}
export type ArrayElementParserModel = {
  type: ParserModelType.ArrayElement
  depth: number
  parser: ParserModel
}
export type TupleParserModel = {
  type: ParserModelType.Tuple
  elements: TupleElementParserModel[]
}
export type TupleElementParserModel = {
  type: ParserModelType.TupleElement
  position: number
  parser: ParserModel
}
export type UnionParserModel = {
  type: ParserModelType.Union
  oneOf: ParserModel[]
}
export type IntersectionParserModel = {
  type: ParserModelType.Intersection
  parsers: ParserModel[]
}
export type EnumParserModel = {
  type: ParserModelType.Enum
  members: (StringLiteralParserModel | NumberLiteralParserModel)[]
}
export type ReferenceParserModel = {
  type: ParserModelType.Reference
  name: string
}
export type DateParserModel = {
  type: ParserModelType.Date
}
export type AnyParserModel = {
  type: ParserModelType.Any
}

export default function generateParserModel(
  typeChecker: ts.TypeChecker,
  rootNode: ts.Node,
  rootName: string,
): ParserModel {
  return {
    type: ParserModelType.Root,
    name: rootName,
    parser: generate(rootNode, 0),
  }

  function generate(node: ts.Node, depth: number): ParserModel {
    if (ts.isInterfaceDeclaration(node) && node === rootNode) {
      return {
        type: ParserModelType.Object,
        members: node.members.reduce((members, member) => {
          return member.name
            ? [
                ...members,
                {
                  type: ParserModelType.Member,
                  name: getMemberName(member),
                  optional: !!member.questionToken,
                  parser: generate(member, depth),
                },
              ]
            : members
        }, [] as MemberParserModel[]),
      }
    }

    if (ts.isPropertySignature(node)) {
      if (!node.type) {
        throw new Error("Property has no type")
      }
      return generate(node.type, depth)
    }

    if (ts.isTypeNode(node)) {
      switch (node.kind) {
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
        depth: depth,
        element: {
          type: ParserModelType.ArrayElement,
          depth: depth,
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
                name: getMemberName(member),
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

    if (ts.isTypeAliasDeclaration(node)) {
      return generate(node.type, depth)
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
      node.typeName.getText() === "Array" &&
      node.typeArguments?.length === 1
    ) {
      return {
        type: ParserModelType.Array,
        depth: depth,
        element: {
          type: ParserModelType.ArrayElement,
          depth: depth,
          parser: generate(node.typeArguments[0], depth + 1),
        },
      }
    }

    if (ts.isTypeReferenceNode(node)) {
      const type = typeChecker.getTypeAtLocation(node)
      const declr = type.symbol.valueDeclaration
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

        if (defaultTypeNode) {
          return generate(defaultTypeNode, depth)
        }

        return { type: ParserModelType.Any }
      } else if ((type.flags & ts.TypeFlags.Object) === ts.TypeFlags.Object) {
        // in case of "non-generic" Interface or TypeAlias
        if (!node.typeArguments || node.typeArguments.length === 0) {
          return {
            type: ParserModelType.Reference,
            name: node.typeName.getText(),
          }
        }
        // in case of a generic Interface or TypeAlias or TypeLiteral
        else {
          const props = typeChecker.getAugmentedPropertiesOfType(type)

          return {
            type: ParserModelType.Object,
            members: props.reduce((members, member) => {
              const memberType = typeChecker.getTypeOfSymbolAtLocation(
                member,
                node,
              )
              const actualType = typeChecker.typeToTypeNode(
                memberType,
                node,
                undefined,
              )
              const optional =
                (member.flags & ts.SymbolFlags.Optional) ===
                ts.SymbolFlags.Optional

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
            }, [] as MemberParserModel[]),
          }
        }
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

    throw new Error("ParserModel not implemented yet: " + node.kind)
  }

  function getMemberName({ name }: ts.TypeElement): string {
    if (!name) {
      throw new Error("No member name")
    }

    if (ts.isIdentifier(name)) {
      return name.text
    } else if (ts.isStringLiteral(name)) {
      return name.text
    } else if (ts.isNumericLiteral(name)) {
      return name.text
    }

    throw new Error("Member name is either computed or private")
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
            throw new Error("Enum member has unsupport value")
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

  // function reduceAad(
  //   members: MemberParserModel[],
  //   member: ts.TypeElement,
  //   // arrayDepth: number,
  // ): MemberParserModel[] {
  //   if (
  //     ts.isIndexSignatureDeclaration(member) &&
  //     member.parameters.length === 1 &&
  //     member.parameters[0].type
  //   ) {
  //     return [
  //       ...members,
  //       {
  //         type: ParserModelType.IndexMember,
  //         depth: arrayDepth++,
  //         keyParser: generate(member.parameters[0].type, arrayDepth),
  //         optional: !!member.questionToken,
  //         parser: generate(member.type, arrayDepth),
  //       },
  //     ]
  //   } else if (member.name) {
  //     return [
  //       ...members,
  //       {
  //         type: ParserModelType.Member,
  //         name: getMemberName(member),
  //         optional: !!member.questionToken,
  //         parser: generate(member, arrayDepth),
  //       },
  //     ]
  //   } else {
  //     return members
  //   }
  // }
}
