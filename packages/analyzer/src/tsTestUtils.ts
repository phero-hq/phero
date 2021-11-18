import ts, {
  FunctionLikeDeclarationBase,
  VariableDeclaration,
} from "typescript"
import { ParsedSamenApp } from "./parseSamenApp"

export const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

interface TSFiles {
  [fileName: string]: string
}

export function createTSProgram(input: TSFiles | string) {
  const files: TSFiles = {}

  if (typeof input === "string") {
    files["samen.ts"] = input
  } else {
    if (!input["samen"]) {
      throw new Error("Typescript project should have samen.ts file")
    }
    for (const [fileName, content] of Object.entries(input)) {
      files[`${fileName}.ts`] = content
    }
  }

  // const printer = ts.createPrinter({
  //   newLine: ts.NewLineKind.LineFeed,
  //   removeComments: true,
  // })

  const opts: ts.CompilerOptions = {
    // declaration: true,
    // emitDeclarationOnly: true,
    // NOTE: we need Promise support in our declaration file. In a normal TS project you would add
    // the "es2015". Because we're implementing a file system here, sort of, we need to set the file
    // name more explicitly. (Implementing our own fileExists makes compilation much much faster.)
    lib: [
      // support for Promise
      "lib.es2015.d.ts",
      // support for Pick, Omit, and other TS utilities
      "lib.es5.d.ts",
    ],
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
  }
  const host = ts.createCompilerHost(opts)
  const originalReadFile = host.readFile

  host.writeFile = (fileName: string, contents: string) => {
    files[fileName] = contents
  }

  host.resolveModuleNames = (
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    options: ts.CompilerOptions,
  ): (ts.ResolvedModule | undefined)[] => {
    return moduleNames.map((moduleName) => {
      // moduleName './kaas' -> fileName "kaas.ts"
      const fileName = `${moduleName.substring("./".length)}.ts`
      return {
        resolvedFileName: fileName,
        isExternalLibraryImport: false,
      }
    })
  }
  host.readFile = (fileName: string) => {
    if (files[fileName]) {
      return files[fileName]
    }
    // Reads the lib files
    return originalReadFile(fileName)
  }

  host.fileExists = (fileName: string) => {
    return !!files[fileName]
  }

  // // Prepare and emit the d.ts files
  const program = ts.createProgram(["samen.ts"], opts, host)
  return program
}

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
