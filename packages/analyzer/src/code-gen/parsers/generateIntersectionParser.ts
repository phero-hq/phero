import ts from "typescript"
import generateParserFromModel from "./generateParserFromModel"
import { IntersectionParserModel } from "./generateParserModel"
import Pointer from "./Pointer"

export default function generateIntersectionParser(
  pointer: Pointer<IntersectionParserModel>,
): ts.Statement {
  return ts.factory.createBlock(
    pointer.model.parsers.map((parser) =>
      generateParserFromModel(parser, pointer.path),
    ),
  )
}
