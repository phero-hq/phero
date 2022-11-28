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
  Reference = "reference",
  Date = "date",
  Any = "any",
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
  | ReferenceParserModel
  | DateParserModel
  | AnyParserModel

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
  typeArguments?: ParserModel[]
}
export interface DateParserModel {
  type: ParserModelType.Date
}
export interface AnyParserModel {
  type: ParserModelType.Any
}
