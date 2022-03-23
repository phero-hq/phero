// import TestRenderer from "react-test-renderer"
import ts from "typescript"

import { render } from "./example"
import { generateAST } from "./ts-elements"

const json = render()
// const json = TestRenderer.create(render()).toTree() as any

console.log(printCode(generateAST(json)))

function printCode(node: ts.Node): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
    removeComments: true,
    omitTrailingSemicolon: false,
  })
  const sf = ts.createSourceFile(
    "a.ts",
    "",
    ts.ScriptTarget.ESNext,
    undefined,
    ts.ScriptKind.TS,
  )

  return printer.printNode(ts.EmitHint.Unspecified, node, sf)
}
