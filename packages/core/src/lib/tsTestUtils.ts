import ts, {
  FunctionLikeDeclarationBase,
  VariableDeclaration,
} from "typescript"
import { TSFiles, VirtualCompilerHost } from "./VirtualCompilerHost"
import { PheroApp } from "../domain/PheroApp"
import { KindToNodeMappings } from "./tsUtils"
import {
  DependencyMap,
  FunctionParserModel,
  generateParserModel,
  ParserModelMap,
} from "../generate-model-3/generateParserModel"
import { ObjectParserModel, ParserModel } from "../generate-model-3/ParserModel"

export function printPheroApp(app: PheroApp): string {
  return JSON.stringify(
    {
      services: app.services.map((service) => ({
        name: service.name,
        funcs: service.funcs.map((func) => ({
          name: func.name,
          func: printFunctionDeclaration(func.ref),
        })),
      })),
    },
    null,
    4,
  )

  function printFunctionDeclaration(
    func: FunctionLikeDeclarationBase | VariableDeclaration,
  ): string {
    const funcName = func.name?.getText()

    if (!funcName) {
      throw new Error("Func must have name")
    }

    return func.kind === ts.SyntaxKind.FunctionDeclaration
      ? `[FunctionDeclaration(${funcName})]`
      : func.kind === ts.SyntaxKind.VariableDeclaration
      ? `[VariableDeclaration(${funcName})]`
      : func.kind === ts.SyntaxKind.FunctionExpression
      ? `[FunctionExpression(${funcName})]`
      : func.kind === ts.SyntaxKind.ArrowFunction
      ? `[ArrowFunction(${funcName})]`
      : "[UNKNOWN]"
  }
}

export function createTestProgram(input: TSFiles | string): ts.Program {
  const vHost = new VirtualCompilerHost()

  if (typeof input === "string") {
    vHost.addFile(`phero.ts`, input)
  } else {
    for (const [fileName, content] of Object.entries(input)) {
      vHost.addFile(`${fileName}.ts`, content)
    }
  }

  const program = vHost.createProgram("phero.ts")
  return program
}

export function compileStatement<SK extends ts.SyntaxKind>(
  code: string,
  syntaxKind: SK,
): { statement: KindToNodeMappings[SK]; prog: ts.Program } {
  const prog = createTestProgram(code)
  const statements = prog.getSourceFile("phero.ts")?.statements
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
    prog,
    statement: statement as KindToNodeMappings[SK],
  }
}

export function compileStatements(code: string): {
  statements: ts.Statement[]
  prog: ts.Program
} {
  const prog = createTestProgram(code)
  const statements = prog.getSourceFile("phero.ts")?.statements
  if (!statements || statements.length < 1) {
    throw new Error("Should provide at least 1 statement")
  }

  return {
    prog,
    statements: statements.map((s) => s),
  }
}

export function compileProgram(input: TSFiles): {
  statements: ts.Statement[]
  prog: ts.Program
} {
  const prog = createTestProgram(input)
  const statements = prog.getSourceFile("phero.ts")?.statements
  if (!statements || statements.length < 1) {
    throw new Error("Should provide at least 1 statement")
  }

  return {
    prog,
    statements: statements.map((s) => s),
  }
}

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  removeComments: true,
  omitTrailingSemicolon: false,
})

export function printCode(code: ts.Node | ts.Node[]): string {
  const sf = ts.createSourceFile(
    "phero-manifest.d.ts",
    "",
    ts.ScriptTarget.ESNext,
    undefined,
    ts.ScriptKind.TS,
  )

  return Array.isArray(code)
    ? printer.printList(
        ts.ListFormat.SourceFileStatements,
        ts.factory.createNodeArray(code),
        sf,
      )
    : printer.printNode(ts.EmitHint.Unspecified, code, sf)
}

export function generateParserModelForReturnType(tsContent: string): {
  root: ParserModel
  deps: Record<string, ParserModel>
} {
  const { statements, prog } = compileStatements(tsContent)

  const func = statements.find((st): st is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(st),
  )

  if (!func) {
    throw new Error("Ts content doesn't contain any function")
  }

  const funcModel = generateParserModel(func, prog.getTypeChecker(), new Map())
  return {
    root: funcModel.returnType,

    deps: [...funcModel.deps.entries()].reduce<Record<string, ParserModel>>(
      (result, [name, model]) => ({ ...result, [name]: model }),
      {},
    ),
  }
}

export function generateParserModelForFunction(tsContent: string): {
  returnType: ParserModel
  parameters: ObjectParserModel
  deps: Record<string, ParserModel>
} {
  const { statements, prog } = compileStatements(tsContent)

  const func = statements.find((st): st is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(st),
  )

  if (!func) {
    throw new Error("Ts content doesn't contain any function")
  }

  const funcModel = generateParserModel(func, prog.getTypeChecker(), new Map())

  return {
    returnType: funcModel.returnType,
    parameters: funcModel.parameters,
    deps: [...funcModel.deps.entries()].reduce<Record<string, ParserModel>>(
      (result, [name, model]) => ({ ...result, [name]: model }),
      {},
    ),
  }
}
