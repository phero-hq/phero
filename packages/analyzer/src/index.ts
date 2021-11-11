import { SourceFile, TypeChecker } from "ts-morph"
import generateAppDeclarationFile from "./generateAppDeclarationFile"
import parseSamenApp from "./parseSamenApp"
import WatchProgram from "./WatchProgram"

const input = "/Users/kamilafsar/Projects/samen/example/design"
const program = new WatchProgram(input)

// program.onError(() => console.error("oops error!"))
program.onCompileSucceeded(
  (samenSourceFile: SourceFile, typeChecker: TypeChecker) => {
    console.info("something changed!")
    const app = parseSamenApp(samenSourceFile)
    console.log(app)
    generateAppDeclarationFile(app)
  },
)
program.close()
