import ts from "typescript"
import generateBooleanLiteralParser from "./generateBooleanLiteralParser"
import generateBooleanParser from "./generateBooleanParser"
import generateNullParser from "./generateNullParser"
import generateNumberLiteralParser from "./generateNumberLiteralParser"
import generateNumberParser from "./generateNumberParser"
import generateObjectParser from "./generateObjectParser"
import generateStringLiteralParser from "./generateStringLiteralParser"
import generateStringParser from "./generateStringParser"
import generateUndefinedParser from "./generateUndefinedParser"
import { TSNode } from "./TSNode"

type Parser = (node: TSNode) => ts.Statement

const parsers: Array<{
  flag: ts.TypeFlags
  parser: Parser
}> = [
  {
    flag: ts.TypeFlags.NumberLiteral,
    parser: generateNumberLiteralParser,
  },
  {
    flag: ts.TypeFlags.StringLiteral,
    parser: generateStringLiteralParser,
  },
  {
    flag: ts.TypeFlags.BooleanLiteral,
    parser: generateBooleanLiteralParser,
  },
  { flag: ts.TypeFlags.Number, parser: generateNumberParser },
  { flag: ts.TypeFlags.String, parser: generateStringParser },
  { flag: ts.TypeFlags.Boolean, parser: generateBooleanParser },
  { flag: ts.TypeFlags.Null, parser: generateNullParser },
  { flag: ts.TypeFlags.Undefined, parser: generateUndefinedParser },
  { flag: ts.TypeFlags.Object, parser: generateObjectParser },
]

export function generateParserForNode(node: TSNode): ts.Statement {
  const parser = parsers.reduce((result, { flag, parser }) => {
    if (result) {
      return result
    }
    return (node.type.flags & flag) === flag ? parser : null
  }, null as Parser | null)

  if (!parser) {
    throw new Error(`No parser found for type with flag ${node.type.flags}`)
  }

  return parser(node)
}
