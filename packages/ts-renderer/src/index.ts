import ts from "typescript"
import { render } from "./example"
import { renderAST } from "./renderer"

console.log(printCode(renderAST(render())))

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
