import type ts from "typescript"

export enum ParserModelType {
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
  EnumMember = "enumMember",
  Reference = "reference",
  Date = "date",
  Any = "any",
  BigInt = "bigint",
  BigIntLiteral = "bigint-literal",
  Generic = "generic",
  TemplateLiteral = "template-literal",
}

export type ParserModel =
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
  | EnumMemberParserModel
  | ReferenceParserModel
  | DateParserModel
  | AnyParserModel
  | BigIntParserModel
  | BigIntLiteralParserModel
  | GenericParserModel
  | TemplateLiteralParserModel

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
  optional: boolean
  parser: ParserModel
}
export interface ArrayParserModel {
  type: ParserModelType.Array
  element: ArrayElementParserModel
}
export interface ArrayElementParserModel {
  type: ParserModelType.ArrayElement
  parser: ParserModel
}
export interface TupleParserModel {
  type: ParserModelType.Tuple
  elements: TupleElementParserModel[]
}
export interface TupleElementParserModel {
  type: ParserModelType.TupleElement
  position: number
  isRestElement?: boolean
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
  name: string
  members: EnumMemberParserModel[]
}
export interface EnumMemberParserModel {
  type: ParserModelType.EnumMember
  name: string
  parser: StringLiteralParserModel | NumberLiteralParserModel
}

export interface ReferenceParserModel {
  type: ParserModelType.Reference
  typeName: string
  typeArguments?: ParserModel[]
}
export interface GenericParserModel {
  type: ParserModelType.Generic
  typeName: string
  typeArguments?: ParserModel[]
  parser: ParserModel
}

export interface TemplateLiteralParserModel {
  type: ParserModelType.TemplateLiteral
  parsers: ParserModel[]
}

export interface DateParserModel {
  type: ParserModelType.Date
}
export interface AnyParserModel {
  type: ParserModelType.Any
}
export interface BigIntParserModel {
  type: ParserModelType.BigInt
}
export interface BigIntLiteralParserModel {
  type: ParserModelType.BigIntLiteral
  literal: ts.PseudoBigInt
}
