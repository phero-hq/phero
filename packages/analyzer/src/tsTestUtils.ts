import ts, {
  FunctionLikeDeclarationBase,
  VariableDeclaration,
} from "typescript"
import { TSFiles, VirtualCompilerHost } from "./VirtualCompilerHost"
import { ParsedSamenApp } from "./parseSamenApp"

export function printSamenApp(app: ParsedSamenApp): string {
  return JSON.stringify(
    {
      services: app.services.map((service) => ({
        name: service.name,
        funcs: service.funcs.map((func) => ({
          name: func.name,
          config: {
            ...func.config,
            // middleware: func.config.middleware?.map(printFunctionDeclaration),
          },
          func: printFunctionDeclaration(func.actualFunction),
        })),
      })),
    },
    null,
    4,
  )

  function printFunctionDeclaration(
    func: FunctionLikeDeclarationBase | VariableDeclaration,
  ): string {
    return func.kind === ts.SyntaxKind.FunctionDeclaration
      ? `[FunctionDeclaration(${func.name?.getText()})]`
      : func.kind === ts.SyntaxKind.VariableDeclaration
      ? `[VariableDeclaration(${func.name?.getText()})]`
      : func.kind === ts.SyntaxKind.FunctionExpression
      ? `[FunctionExpression(${func.name?.getText()})]`
      : func.kind === ts.SyntaxKind.ArrowFunction
      ? `[ArrowFunction(${func.name?.getText()})]`
      : "[UNKNOWN]"
  }
}

export function createTestProgram(input: TSFiles | string) {
  const vHost = new VirtualCompilerHost()

  if (typeof input === "string") {
    vHost.addFile(`samen.ts`, input)
  } else {
    for (const [fileName, content] of Object.entries(input)) {
      vHost.addFile(`${fileName}.ts`, content)
    }
  }

  const program = vHost.createProgram("samen.ts")
  return program
}
