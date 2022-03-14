import ts from "typescript"
import generateAppDeclarationFile from "./generateAppDeclarationFile"

import parseSamenApp from "./parseSamenApp"
import { createTestProgram } from "./tsTestUtils"

function generate(prog: ts.Program): string {
  // if (prog.getSemanticDiagnostics().length) {
  //   // console.log("OEPS COMPILE ERRORS DETECTED")
  //   console.error(prog.getSemanticDiagnostics())
  //   throw new Error("Compile error")
  // }
  const typeChecker = prog.getTypeChecker()
  const parsedApp = parseSamenApp(prog.getSourceFile("samen.ts")!, typeChecker)
  const dts = generateAppDeclarationFile(parsedApp, typeChecker)
  return dts
}

describe("generateAppDeclarationFile", () => {
  test("should parse middleware", () => {
    const parsedApp = generate(
      createTestProgram(`
        type NextFunction<T = void> = (ctx: T) => Promise<void>
        type SamenContext<T> = {}

        async function getArticle(aap: string, ctx: SamenContext<{ user: User }>): Promise<string> {
          return "ok"
        }

        interface User { uid: string }

        async function requireUID(next: NextFunction<{ uid: string, x: string }>, ctx: SamenContext<{ uid: string }>) {
          // valideer id token
          await next({ uid, x })
        }
        
        async function requireCmsUser(next: NextFunction<{ user: User }>, ctx: SamenContext<{ uid: string, x: string }>) {
          // zet om naar user, of het cms user is
          await next({ user: { uid } })
        }

        export const articleService = createService({
          getArticle: createFunction(getArticle),
        }, {
          middleware: [requireUID, requireCmsUser],
        })
      `),
    )

    // EXPECT function getArticle(aap: string): Promise<string>;
    // because x:number is provided implicitly by middleware
    expect(parsedApp).toMatchSnapshot()
  })
})
