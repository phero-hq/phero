// import { compile } from "./testCompiler"

import ts from "typescript"

import { parseSamenApp, ParsedSamenApp } from "./parseSamenApp"
import { createTestProgram } from "../tsTestUtils"

function parseProgram(prog: ts.Program): ParsedSamenApp {
  // if (prog.getSemanticDiagnostics().length) {
  //   console.log("OEPS COMPILE ERRORS DETECTED")
  // }

  return parseSamenApp(prog.getSourceFile("samen.ts")!, prog.getTypeChecker())
}

function expectFunctionDeclrWithName(func: any, name: string) {
  expect(func?.name?.getText()).toBe(name)
  expect(func?.kind).toBe(ts.SyntaxKind.FunctionDeclaration)
}

function expectArrowFuncDeclrWithName(func: any, name: string) {
  expect(func?.name?.getText()).toBeUndefined()
  expect(func?.kind).toBe(ts.SyntaxKind.ArrowFunction)
}

function expectFunctionExpressionWithName(func: any, name: string | undefined) {
  expect(func?.name?.getText()).toBe(name)
  expect(func?.kind).toBe(ts.SyntaxKind.FunctionExpression)
}

function expectArrowFunctionWithName(func: any, name: string | undefined) {
  expect(func?.name?.getText()).toBe(name)
  expect(func?.kind).toBe(ts.SyntaxKind.ArrowFunction)
}

function expectFunctionDeclarationWithName(
  func: any,
  name: string | undefined,
) {
  expect(func?.name?.getText()).toBe(name)
  expect(func?.kind).toBe(ts.SyntaxKind.FunctionDeclaration)
}

describe("parseSamenApp", () => {
  describe("parse services & function config", () => {
    test("should parse a simple service/function with no config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle,
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

      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
    })

    test("should parse the correct name of the function", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticleX: getArticle,
        })
      `),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "getArticleX",
              }),
            ],
          }),
        ],
      })
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
    })

    test("should parse a simple service with 2 functions with no config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle: getArticle,
          editArticle,
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
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[1].actualFunction,
        "editArticle",
      )
    })

    test("should parse middleware config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        type SamenNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>
        type SamenContext<T = {}> = T
        type SamenParams<T = {}> = Partial<T>

        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        async function requireCMSUser(params: SamenParams, ctx: SamenContext, next: SamenNextFunction): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle: getArticle,
          editArticle,
        }, {
          middleware: [requireCMSUser],
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
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[1].actualFunction,
        "editArticle",
      )
      expect(parsedApp.services[0].config.middleware).toHaveLength(1)
      expectFunctionDeclrWithName(
        parsedApp.services[0].config.middleware?.[0].middleware,
        "requireCMSUser",
      )
      expect(parsedApp.services[0].config.middleware).toHaveLength(1)
      expectFunctionDeclrWithName(
        parsedApp.services[0].config.middleware?.[0].middleware,
        "requireCMSUser",
      )
    })

    test("should parse multiple services", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        type SamenNextFunction<T = void> = T extends void
          ? () => Promise<void>
          : (ctx: T) => Promise<void>
        type SamenContext<T = {}> = T
        type SamenParams<T = {}> = Partial<T>

        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        async function requireCMSUser(params: SamenParams, ctx: SamenContext, next: SamenNextFunction): Promise<string> {
          return "ok"
        }
        
        export const frontendService = createService({
          getArticle,
        })
        
        export const cmsService = createService({
          editArticle: editArticle,
        }, {
          middleware: [requireCMSUser],
        })
      `),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "frontendService",
            funcs: [
              expect.objectContaining({
                name: "getArticle",
              }),
            ],
          }),
          expect.objectContaining({
            name: "cmsService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
      expectFunctionDeclrWithName(
        parsedApp.services[1].funcs[0].actualFunction,
        "editArticle",
      )
      expect(parsedApp.services[1].config.middleware).toHaveLength(1)
      expectFunctionDeclrWithName(
        parsedApp.services[1].config.middleware?.[0].middleware,
        "requireCMSUser",
      )
    })
  })

  describe("alternative syntax", () => {
    test("should parse a simple service/function with no config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        const getArticle = async (): Promise<string> => {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle,
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

      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
    })

    test("should parse a function import correctly", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          export const getArticle = async (): Promise<string> => {
            return "ok"
          }
          export function editArticle(): Promise<string> {
            return "ok"
          }
          export function publishArticle(): Promise<string> {
            return "ok"
          }`,
          samen: `
          import {getArticle, editArticle, publishArticle as xxx} from './other'       

          export const articleService = createService({
            getArticle: getArticle,
            editArticle,
            publishArticle: xxx,
          })`,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "getArticle",
              }),
              expect.objectContaining({
                name: "editArticle",
              }),
              expect.objectContaining({
                name: "publishArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "getArticle",
      )
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[1].actualFunction,
        "editArticle",
      )
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[2].actualFunction,
        "publishArticle",
      )
    })

    test("should parse a function referenced by an variable declaration", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
          async function _editArticle(): Promise<string> {
            return ""
          }

          const editArticle = _editArticle

          export const articleService = createService({
            editArticle: editArticle,
          })`),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })

    test("should parse an imported arrow function referenced by a variable declaration", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          const _editArticle = async (): Promise<string> => {
            return ""
          }
          export const editArticle = _editArticle
          `,
          samen: `
          import {editArticle} from './other'          

          export const articleService = createService({
            editArticle: editArticle,
          })`,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })

    test("should parse a wildcard imported function", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          const _editArticle = async (): Promise<string> => {
            return ""
          }
          export const editArticle = _editArticle
          `,
          samen: `
          import * as other from './other'          

          export const articleService = createService({
            editArticle: other.editArticle,
          })`,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })

    test("should parse a direct exported function", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          yetAnother: `
          export const _editArticle = async (): Promise<string> => {
            return ""
          }
          `,
          other: `
          import {_editArticle} from './yetAnother'

          export const editArticle = _editArticle
          `,
          samen: `
          import * as articleServiceXXX from './other'          

          export const articleService = createService(articleServiceXXX)`,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })

    test("should parse a direct exported service", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          const _editArticle = async (): Promise<string> => {
            return ""
          }
          const editArticle = _editArticle

          export const articleService = createService({
            editArticle: editArticle,
          })
          `,
          samen: `
          import * as other from './other'          

          export const articleService = other.articleService`,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })
    test("should parse an exported service definition variable declaration", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          const _editArticle = async (): Promise<string> => {
            return ""
          }
          const editArticle = _editArticle

          export const articleService = {
            editArticle: editArticle,
          }
          `,
          samen: `
          import * as other from './other'

          export const articleService = createService(other.articleService)`,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })

    test("should parse an exported service definition from another file", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          const _editArticle = async (): Promise<string> => {
            return ""
          }
          
          const editArticle = _editArticle

          export const articleService = createService({
            editArticle: editArticle,
          })
          `,
          samen: `
          export {articleService as testService} from './other'
          `,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "testService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectArrowFuncDeclrWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })

    test("should parse unnamed function expression", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          export const editArticle = async function(): Promise<string> {
            return "ok"
          }
          `,
          samen: `
          import {editArticle} from './other'

          export const articleService = createService({
            editArticle: editArticle,
          })
          `,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionExpressionWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        undefined,
      )
    })
    test("should parse parenthesized type", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          interface MyInterface {
            prop: (string | null)[]
          }

          export async function myFunction(): Promise<MyInterface> {
            return {
              prop: [null],
            }
          }
          `,
          samen: `
          import { myFunction } from "./other"

          export const articleService = createService({
            editArticle: myFunction,
          })
          `,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
    })
  })

  describe("parse errors", () => {
    test("should parse errors within one function", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
            export class ArticleError extends Error {
            }

            export function editArticle(): Promise<string> {
              throw new ArticleError()
            }
          `,
          samen: `
          import {editArticle} from './other'

          export const articleService = createService({
            editArticle: editArticle,
          })
        `,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            errors: [
              expect.objectContaining({
                name: "ArticleError",
              }),
            ],
          }),
        ],
      })
    })

    test("should parse errors within multiple functions", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
            class ArticleError extends Error {
            }

            export function getArticle(): Promise<string> {
              throw new ArticleError()
            }

            export function editArticle(): Promise<string> {
              throw new ArticleError()
            }
          `,
          samen: `
          import {getArticle, editArticle} from './other'

          export const articleService = createService({
            getArticle,
            editArticle: editArticle,
          })
        `,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            errors: [
              expect.objectContaining({
                name: "ArticleError",
              }),
            ],
          }),
        ],
      })
    })

    test("should recognize re-export of same error class", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          otherOne: `
            export class ArticleError extends Error {
            }

            export function getArticle(): Promise<string> {
              throw new ArticleError()
            }
          `,
          otherTwo: `
            import {ArticleError} from './otherOne'

            export function editArticle(): Promise<string> {
              throw new ArticleError()
            }
          `,
          samen: `
          import {getArticle} from './otherOne'
          import {editArticle} from './otherTwo'

          export const articleService = createService({
            getArticle: getArticle,
            editArticle,
          })
        `,
        }),
      )

      expect(parsedApp).toMatchObject({
        services: [
          expect.objectContaining({
            name: "articleService",
            errors: [
              expect.objectContaining({
                name: "ArticleError",
                sourceFile: "otherOne.ts",
              }),
            ],
          }),
        ],
      })
    })
  })
})
