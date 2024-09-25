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

        async function myMiddleware(context: PheroContext, next: PheroNextFunction<{ x: number }>) {
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

  test("should ignore members tagged with PheroUnchecked when parsing", () => {
    const parsedApp = parseProgram(
      createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T

        type PheroUnchecked<T> = T

        class RealDB {
          async query(): Promise<string> {
            return "result"
          }
        }
        
        async function getArticle(ctx: PheroContext<{ db: PheroUnchecked<RealDB> }>): Promise<string> {
          return ctx.db.query()
        }

        async function myMiddleware(context: PheroContext, next: PheroNextFunction<{ db: PheroUnchecked<RealDB> }>) {
          await next({ db: new RealDB() })
        }        

        export const articleService = createService({
          getArticle,
        }, {
          middleware: [myMiddleware]
        })
      `),
    )

    expect(parsedApp.services[0].config.contextTypeModel).toBeUndefined()

    expect(parsedApp).toMatchObject({
      services: [
        expect.objectContaining({
          name: "articleService",
          funcs: [
            expect.objectContaining({
              name: "getArticle",
              contextTypeModel: {
                type: "object",
                members: [
                  {
                    type: "member",
                    name: "db",
                    optional: false,
                    parser: { type: "unchecked" },
                  },
                ],
              },
            }),
          ],
          config: expect.objectContaining({
            middleware: [
              expect.objectContaining({
                nextTypeModel: {
                  type: "object",
                  members: [
                    {
                      type: "member",
                      name: "db",
                      optional: false,
                      parser: { type: "unchecked" },
                    },
                  ],
                },
              }),
            ],
          }),
        }),
      ],
    })

    expectFunctionDeclarationWithName(
      parsedApp.services[0].funcs[0].ref,
      "getArticle",
    )
  })

  test("PheroUnchecked shouldn't be used as input parameter", () => {
    expect(() =>
      parseProgram(
        createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T

        type PheroUnchecked<T> = T

        async function getArticle(test: PheroUnchecked<string>): Promise<string> {
          return test
        }

        export const articleService = createService({
          getArticle,
        }, {
          middleware: []
        })
      `),
      ),
    ).toThrow(
      "PheroUnchecked is only allowed within PheroContext and PheroNextFunction, like this: PheroContext<{ dbClient: PheroUnchecked<MyDBClient> }>",
    )
  })

  test("PheroUnchecked shouldn't be used as output result", () => {
    expect(() =>
      parseProgram(
        createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T

        type PheroUnchecked<T> = T

        async function getArticle(test: string): Promise<PheroUnchecked<string>> {
          return test
        }

        export const articleService = createService({
          getArticle,
        }, {
          middleware: []
        })
      `),
      ),
    ).toThrow(
      "PheroUnchecked is only allowed within PheroContext and PheroNextFunction, like this: PheroContext<{ dbClient: PheroUnchecked<MyDBClient> }>",
    )
  })

  test("PheroUnchecked shouldn't be used inside a parameter model", () => {
    expect(() =>
      parseProgram(
        createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T

        type PheroUnchecked<T> = T

        interface Result {
          prop: PheroUnchecked<string>
        }

        async function getArticle(test: Result): Promise<string> {
          return test.prop
        }

        export const articleService = createService({
          getArticle,
        }, {
          middleware: []
        })
      `),
      ),
    ).toThrow(
      "PheroUnchecked is only allowed within PheroContext and PheroNextFunction, like this: PheroContext<{ dbClient: PheroUnchecked<MyDBClient> }>",
    )
  })

  test("PheroUnchecked shouldn't be used inside a result model", () => {
    expect(() =>
      parseProgram(
        createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T

        type PheroUnchecked<T> = T

        interface Result {
          prop: PheroUnchecked<string>
        }

        async function getArticle(test: string): Promise<Result> {
          return { prop: test }
        }

        export const articleService = createService({
          getArticle,
        }, {
          middleware: []
        })
      `),
      ),
    ).toThrow(
      "PheroUnchecked is only allowed within PheroContext and PheroNextFunction, like this: PheroContext<{ dbClient: PheroUnchecked<MyDBClient> }>",
    )
  })

  test.only("PheroUnchecked can't be used for service context", () => {
    expect(() =>
      parseProgram(
        createTestProgram(`
        type PheroNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>

        type PheroContext<T = {}> = T

        type PheroUnchecked<T> = T

        class RealDB {
          async query(): Promise<string> {
            return "result"
          }
        }
        
        async function getArticle(ctx: PheroContext<{ result: string }>): Promise<string> {
          return ctx.db.query()
        }

        async function myMiddleware(context: PheroContext<{ db: PheroUnchecked<RealDB> }>, next: PheroNextFunction<{ result: string }>) {
          await next({ result: context.db.query() })
        }

        export const articleService = createService({
          getArticle,
        }, {
          middleware: [myMiddleware]
        })
      `),
      ),
    ).toThrow("PheroUnchecked can't be service context")
  })
})
