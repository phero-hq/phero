import fs from "fs"
import path from "path"
import ts from "typescript"
import { compileStatements } from "../../lib/tsTestUtils"
import generateParserModel from "../generateParserModel"

describe("generateParserModel", () => {
  getExamples()
    .filter(([name]) =>
      [
        // "_date.ts",
        "array.ts",
        // "enum.ts",
        // "generics.ts",
        // "indexType.ts",
        // "indexedAccess.ts",
        "interface.ts",
        // "intersection.ts",
        "literal.ts",
        // "mappedType.ts",
        "native.ts",
        // "objectLiteral.ts",
        // "recursive_data_type.ts",
        // "tuple.ts",
        "typeAlias.ts",
        "union.ts",
      ].includes(name),
    )
    .forEach(([name, tsContent]) => {
      return describe(name, () => {
        const [funcs, prog] = getFunctionDeclarations(tsContent)
        funcs.forEach((func) => {
          const testCallback = (): void => {
            expect(generateParserModel(func, prog)).toMatchSnapshot(
              func.name?.text,
            )
          }
          const funcName = `${func.name?.text ?? "-"}`
          if (funcName.startsWith("_")) {
            test.only(funcName.substring(1), testCallback)
          } else {
            test(funcName, testCallback)
          }
        })
      })
    })
})

function getExamples(): Array<[name: string, example: string]> {
  const examples = fs.readdirSync(path.join(__dirname, "./examples"))
  return examples.map((fileName) => [
    fileName,
    fs.readFileSync(path.join(__dirname, "./examples", fileName), {
      encoding: "utf-8",
    }),
  ])
}

function getFunctionDeclarations(
  tsContent: string,
): [ts.FunctionDeclaration[], ts.Program] {
  const { statements, prog } = compileStatements(tsContent)
  return [
    statements.filter((st): st is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(st),
    ),
    prog,
  ]
}
