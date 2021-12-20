import ts from "typescript"
import { generateParserFromModel, NewPointer } from "./generateParserFromModel"
import { IntersectionParserModel } from "./generateParserModel"

export default function generateIntersectionParser(
  pointer: NewPointer<IntersectionParserModel>,
): ts.Statement {
  return ts.factory.createBlock(
    pointer.model.parsers.map((parser) =>
      generateParserFromModel(parser, pointer.path),
    ),
  )
}
