import fs from "fs"
import path from "path"
import ts from "typescript"
import "jest-specific-snapshot"

import { compileStatements } from "../../lib/tsTestUtils"
import generateParserModel from "../generateParserModel"

describe("generateParserModel", () => {
  getExamples()
    .filter(([name]) =>
      [
        // "debug.ts",

        "native.ts",
        "literal.ts",
        "array.ts",
        "interface.ts",
        "union.ts",

        "typeAlias.ts",
        "enum.ts",

        // "_date.ts",
        // "generics.ts",
        // "indexType.ts",
        // "indexedAccess.ts",
        // "intersection.ts",
        // "mappedType.ts",
        // "objectLiteral.ts",
        // "recursive_data_type.ts",
        // "tuple.ts",
      ].includes(name),
    )
    .forEach(([name, tsContent]) => {
      return describe(name, () => {
        const [funcs, prog] = getFunctionDeclarations(tsContent)
        funcs.forEach((func) => {
          const testCallback = (): void => {
            expect(generateParserModel(func, prog)).toMatchSpecificSnapshot(
              path.join("..", "__tests__", "__snapshots__", `${name}.snap`),
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
