import ts from "typescript"
import * as tsx from "../../tsx"
import generateParserFromModel from "./generateParserFromModel"
import { IntersectionParserModel } from "./generateParserModel"
import Pointer from "./Pointer"

export default function generateIntersectionParser(
  pointer: Pointer<IntersectionParserModel>,
): ts.Statement {
  return ts.factory.createBlock([
    tsx.const({
      name: "intersectionResult",
      init: tsx.literal.object(),
      type: tsx.type.any,
    }),
    ...pointer.model.parsers.flatMap((parser) => [
      generateParserFromModel(parser, pointer.path),
      tsx.statement.expression(
        tsx.expression.call(tsx.expression.propertyAccess("Object", "assign"), {
          args: ["intersectionResult", "result"],
        }),
      ),
    ]),
    tsx.statement.expression(
      tsx.expression.binary(
        tsx.expression.identifier("result"),
        "=",
        tsx.expression.identifier("intersectionResult"),
      ),
    ),
  ])
}
