import ts, {
  FunctionLikeDeclarationBase,
  VariableDeclaration,
} from "typescript"
import { TSFiles, VirtualCompilerHost } from "./VirtualCompilerHost"
import { ParsedSamenApp } from "./parseSamenApp"
import { KindToNodeMappings } from "./tsUtils"

export function printSamenApp(app: ParsedSamenApp): string {
  return JSON.stringify(
    {
      services: app.services.map((service) => ({
        name: service.name,
        funcs: service.funcs.map((func) => ({
          name: func.name,
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

export function createTestProgram(input: TSFiles | string): ts.Program {
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

export function compileStatement<SK extends ts.SyntaxKind>(
  code: string,
  syntaxKind: SK,
): { statement: KindToNodeMappings[SK]; typeChecker: ts.TypeChecker } {
  const prog = createTestProgram(code)
  const statements = prog.getSourceFile("samen.ts")?.statements
  if (statements?.length !== 1) {
    throw new Error("Should provide exactly 1 statement")
  }
  const statement = statements[0]
  if (statement.kind !== syntaxKind) {
    throw new Error(
      `SytaxKind of statement is ${statement.kind}, but ${syntaxKind} was expected`,
    )
  }

  return {
    typeChecker: prog.getTypeChecker(),
    statement: statement as KindToNodeMappings[SK],
  }
}

export function compileStatements(code: string): {
  statements: ts.Statement[]
  typeChecker: ts.TypeChecker
} {
  const prog = createTestProgram(code)
  const statements = prog.getSourceFile("samen.ts")?.statements
  if (!statements || statements.length < 1) {
    throw new Error("Should provide at least 1 statement")
  }

  return {
    typeChecker: prog.getTypeChecker(),
    statements: statements.map((s) => s),
  }
}

export function compileProgram(input: TSFiles): {
  statements: ts.Statement[]
  typeChecker: ts.TypeChecker
} {
  const prog = createTestProgram(input)
  const statements = prog.getSourceFile("samen.ts")?.statements
  if (!statements || statements.length < 1) {
    throw new Error("Should provide at least 1 statement")
  }

  return {
    typeChecker: prog.getTypeChecker(),
    statements: statements.map((s) => s),
  }
}

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  removeComments: true,
  omitTrailingSemicolon: false,
})

export function printCode(node: ts.Node): string {
  const sf = ts.createSourceFile(
    "a.ts",
    "",
    ts.ScriptTarget.ESNext,
    undefined,
    ts.ScriptKind.TS,
  )

  return printer.printNode(ts.EmitHint.Unspecified, node, sf)
}
