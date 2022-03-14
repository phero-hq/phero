// import { compile } from "./testCompiler"

import ts from "typescript"

import parseSamenApp, { ParsedSamenApp } from "./parseSamenApp"
import { createTestProgram } from "./tsTestUtils"

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
          getArticle: createFunction(getArticle),
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
                config: {},
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

    test("should parse a simple service/function with config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle: createFunction(getArticle, {
            memory: 1024
          }),
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
                config: {
                  memory: 1024,
                },
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
          getArticleX: createFunction(getArticle, {
            memory: 1024
          }),
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
                config: {
                  memory: 1024,
                },
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
          getArticle: createFunction(getArticle),
          editArticle: createFunction(editArticle),
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
                config: {},
              }),
              expect.objectContaining({
                name: "editArticle",
                config: {},
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

    test("should parse a service with 2 functions with different config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle: createFunction(getArticle, {
            memory: 512,
          }),
          editArticle: createFunction(editArticle, {
            memory: 1024,
          }),
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
                config: {
                  memory: 512,
                },
              }),
              expect.objectContaining({
                name: "editArticle",
                config: {
                  memory: 1024,
                },
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

    test("should parse a service with default config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle: createFunction(getArticle),
          editArticle: createFunction(editArticle, {
            memory: 1024,
          }),
        }, {
          memory: 512,
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
                config: {
                  memory: 512,
                },
              }),
              expect.objectContaining({
                name: "editArticle",
                config: {
                  memory: 1024,
                },
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
        interface NextFunction {}

        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        async function requireCMSUser(next: NextFunction): Promise<string> {
          return "ok"
        }
        
        export const articleService = createService({
          getArticle: createFunction(getArticle),
          editArticle: createFunction(editArticle, {
            memory: 1024,
          }),
        }, {
          memory: 512,
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
                config: expect.objectContaining({
                  memory: 512,
                }),
              }),
              expect.objectContaining({
                name: "editArticle",
                config: expect.objectContaining({
                  memory: 1024,
                }),
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
      expect(parsedApp.services[0].funcs[0].config.middleware).toHaveLength(1)
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[0].config.middleware?.[0].middleware,
        "requireCMSUser",
      )
      expect(parsedApp.services[0].funcs[1].config.middleware).toHaveLength(1)
      expectFunctionDeclrWithName(
        parsedApp.services[0].funcs[1].config.middleware?.[0].middleware,
        "requireCMSUser",
      )
    })

    test("should parse multiple services", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        interface NextFunction {}

        async function getArticle(): Promise<string> {
          return "ok"
        }
        
        async function editArticle(): Promise<string> {
          return "ok"
        }
        
        async function requireCMSUser(next: NextFunction): Promise<string> {
          return "ok"
        }
        
        export const frontendService = createService({
          getArticle: createFunction(getArticle),
        }, {
          memory: 512,
        })
        
        export const cmsService = createService({
          editArticle: createFunction(editArticle),
        }, {
          memory: 1024,
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
                config: expect.objectContaining({
                  memory: 512,
                }),
              }),
            ],
          }),
          expect.objectContaining({
            name: "cmsService",
            funcs: [
              expect.objectContaining({
                name: "editArticle",
                config: expect.objectContaining({
                  memory: 1024,
                }),
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
      expect(parsedApp.services[1].funcs[0].config.middleware).toHaveLength(1)
      expectFunctionDeclrWithName(
        parsedApp.services[1].funcs[0].config.middleware?.[0].middleware,
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
          getArticle: createFunction(getArticle),
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
                config: {},
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
            getArticle: createFunction(getArticle),
            editArticle: createFunction(editArticle),
            publishArticle: createFunction(xxx),
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
                config: {},
              }),
              expect.objectContaining({
                name: "editArticle",
                config: {},
              }),
              expect.objectContaining({
                name: "publishArticle",
                config: {},
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

          const editArticle = createFunction(_editArticle)

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
                config: {},
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
          export const editArticle = createFunction(_editArticle)
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
                config: {},
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
          export const editArticle = createFunction(_editArticle)
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
                config: {},
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

          export const editArticle = createFunction(_editArticle)
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
                config: {},
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
          const editArticle = createFunction(_editArticle)

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
                config: {},
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
          const editArticle = createFunction(_editArticle)

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
                config: {},
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
          
          const editArticle = createFunction(_editArticle)

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
                config: {},
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

    test("should parse inline function expression", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          export const editArticle = createFunction(async function _editArticle(): Promise<string> {
            return "ok"
          })
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
                config: {},
              }),
            ],
          }),
        ],
      })
      expectFunctionExpressionWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "_editArticle",
      )
    })
    test("should parse inline arrow function expression", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          export const editArticle = createFunction(async (): Promise<string> => {
            return "ok"
          })
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
                config: {},
              }),
            ],
          }),
        ],
      })
      expectArrowFunctionWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        undefined,
      )
    })

    test("should parse unnamed function expression", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
          export const editArticle = createFunction(async function(): Promise<string> {
            return "ok"
          })
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
                config: {},
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

    test("should parse short hand assignment function", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        const editArticle = createFunction(async function inlineFunc(): Promise<string> {
          return "ok"
        })

        export const articleService = createService({
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
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionExpressionWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "inlineFunc",
      )
    })

    test("should parse short hand assignment function without config", () => {
      const parsedApp = parseProgram(
        createTestProgram(`
        function editArticle(): Promise<string> {
          return "ok"
        }

        export const articleService = createService({
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
                name: "editArticle",
              }),
            ],
          }),
        ],
      })
      expectFunctionDeclarationWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "editArticle",
      )
    })

    test("should parse a imported+referenced function config", () => {
      const parsedApp = parseProgram(
        createTestProgram({
          other: `
            const timeout = 5
            
            export const config = {
              timeout,
            }
          `,
          samen: `
          import {config} from './other'

          function editArticle(): Promise<string> {
            return "ok"
          }

          export const articleService = createService({
            editArticle: createFunction(editArticle, config),
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
      expectFunctionDeclarationWithName(
        parsedApp.services[0].funcs[0].actualFunction,
        "editArticle",
      )
    })
  })
})
