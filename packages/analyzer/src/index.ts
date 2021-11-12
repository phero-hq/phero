import ts from "typescript"
import generateAppDeclarationFile from "./generateAppDeclarationFile"
import parseSamenApp from "./parseSamenApp"
import WatchProgram from "./WatchProgram"

const input = "/Users/kamilafsar/Projects/samen/example/design"
const program = new WatchProgram(input)

// program.onError(() => console.error("oops error!"))
program.onCompileSucceeded(
  (samenSourceFile: ts.SourceFile, typeChecker: ts.TypeChecker) => {
    console.info("something changed!")
    const app = parseSamenApp(samenSourceFile, typeChecker)
    // console.log(app.services[0].funcs[0])
    generateAppDeclarationFile(app, typeChecker)
  },
)
// program.close()
