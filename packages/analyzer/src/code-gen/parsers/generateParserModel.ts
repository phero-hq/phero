import ts from "typescript"

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
  Array = "array",
  ArrayElement = "arrayElement",
  Tuple = "tuple",
  TupleElement = "tupleElement",
  Union = "union",
  Intersection = "intersection",
  Enum = "enum",
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
  | ArrayParserModel
  | ArrayElementParserModel
  | TupleParserModel
  | TupleElementParserModel
  | UnionParserModel
  | IntersectionParserModel
  | EnumParserModel

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
  members: MemberParserModel[]
}
export type MemberParserModel = {
  type: ParserModelType.Member
  name: string
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

export function generateParserModel(
  typeChecker: ts.TypeChecker,
  rootNode: ts.Node,
  rootName: string,
): ParserModel {
  return {
    type: ParserModelType.Root,
    name: rootName,
    parser: generate(rootNode, 0),
  }

  function generate(node: ts.Node, arrayDepth: number): ParserModel {
    if (ts.isInterfaceDeclaration(node) && node === rootNode) {
      return {
        type: ParserModelType.Object,
        members: node.members.reduce((members, member) => {
          return member.name
            ? [
                ...members,
                {
                  type: ParserModelType.Member,
                  name: member.name.getText(),
                  optional: !!member.questionToken,
                  parser: generate(member, arrayDepth),
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
      return generate(node.type, arrayDepth)
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
        depth: arrayDepth,
        element: {
          type: ParserModelType.ArrayElement,
          depth: arrayDepth,
          parser: generate(node.elementType, arrayDepth + 1),
        },
      }
    }

    if (ts.isTypeLiteralNode(node)) {
      return {
        type: ParserModelType.Object,
        members: node.members.reduce((members, member) => {
          return member.name
            ? [
                ...members,
                {
                  type: ParserModelType.Member,
                  name: member.name.getText(),
                  optional: !!member.questionToken,
                  parser: generate(member, arrayDepth),
                },
              ]
            : members
        }, [] as MemberParserModel[]),
      }
    }

    if (ts.isTupleTypeNode(node)) {
      return {
        type: ParserModelType.Tuple,
        elements: node.elements.map((element, position) => ({
          type: ParserModelType.TupleElement,
          position,
          parser: generate(element, arrayDepth),
        })),
      }
    }

    if (ts.isTypeAliasDeclaration(node)) {
      return generate(node.type, arrayDepth)
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
        depth: arrayDepth,
        element: {
          type: ParserModelType.ArrayElement,
          depth: arrayDepth,
          parser: generate(node.typeArguments[0], arrayDepth + 1),
        },
      }
    }

    if (ts.isTypeReferenceNode(node)) {
      const type = typeChecker.getTypeAtLocation(node)
      const declr = type.symbol.valueDeclaration
      if (declr) {
        if (ts.isEnumDeclaration(declr)) {
          return getEnumParser(declr)
        } else if (ts.isEnumMember(declr)) {
          return getEnumParser(declr.parent).members[
            declr.parent.members.indexOf(declr)
          ]
        }
      }
    }

    if (ts.isParenthesizedTypeNode(node)) {
      return generate(node.type, arrayDepth)
    }

    throw new Error("ParserModel not implemented yet: " + node.kind)
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
}
