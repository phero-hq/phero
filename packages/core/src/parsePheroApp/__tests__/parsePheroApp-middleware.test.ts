// import { compile } from "./testCompiler"

import ts from "typescript"

import { parsePheroApp } from "../parsePheroApp"
import { type PheroApp } from "../../domain/PheroApp"
import { createTestProgram } from "../../lib/tsTestUtils"

function parseProgram(prog: ts.Program): PheroApp {
  // if (prog.getSemanticDiagnostics().length) {
  //   console.log("OEPS COMPILE ERRORS DETECTED")
  // }

  return parsePheroApp(prog)
}

function expectFunctionDeclarationWithName(
  func: any,
  name: string | undefined,
): void {
  expect(func?.name?.getText()).toBe(name)
  expect(func?.kind).toBe(ts.SyntaxKind.FunctionDeclaration)
}

describe("parsePheroApp middleware", () => {
  test("should parse middleware", () => {
    const parsedApp = parseProgram(
      createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T
        
        async function getArticle(ctx: PheroContext<{ x: number }>, aap: string): Promise<string> {
          return "ok"
        }

        async function myMiddleware(context: PheroContext, next: PheroNextFunction<{ x: number }) {
          await next({ x: 123 })
        }

        export const articleService = createService({
          getArticle,
        }, {
          middleware: [myMiddleware]
        })
      `),
    )

    expect(parsedApp).toMatchObject({
      services: [
        expect.objectContaining({
          name: "articleService",
          funcs: [
            expect.objectContaining({
              name: "getArticle",
            }),
          ],
        }),
      ],
    })

    expectFunctionDeclarationWithName(
      parsedApp.services[0].funcs[0].ref,
      "getArticle",
    )
  })
})
