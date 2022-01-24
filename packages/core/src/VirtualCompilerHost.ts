import ts from "typescript"
import path from "path"
import { promises as fs } from "fs"

export interface TSFiles {
  [fileName: string]: string
}

export class VirtualCompilerHost {
  private readonly compilerOpts: ts.CompilerOptions
  private readonly host: ts.CompilerHost
  private readonly files: TSFiles = {}

  constructor(opts?: ts.CompilerOptions) {
    this.compilerOpts = {
      ...opts,
      declaration: true,
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

    const host = ts.createCompilerHost(this.compilerOpts)

    host.writeFile = async (fileName: string, contents: string) => {
      // if (opts?.outDir && fileName.startsWith(opts.outDir)) {
      //   await fs.mkdir(path.dirname(fileName), { recursive: true })
      //   await fs.writeFile(fileName, contents, { encoding: "utf-8" })
      //   console.log(fileName)
      // } else {
      //   throw new Error("HUHH" + fileName)
      // }
      // console.log("fileName", fileName)
      this.files[fileName] = contents
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

        // const res = ress(moduleName, containingFile)
        // console.log(
        //   "m",
        //   moduleName,
        //   res?.isExternalLibraryImport,
        //   res?.resolvedFileName,
        // )
        // return res
      })
    }

    const originalReadFile = host.readFile
    host.readFile = (fileName: string) => {
      if (this.files[fileName]) {
        return this.files[fileName]
      }
      // Reads the lib files
      return originalReadFile(fileName)
    }

    host.fileExists = (fileName: string) => {
      // console.log("fileName", fileName)
      return !!this.files[fileName]
    }

    this.host = host
  }

  public addFile(fileName: string, source: string): void {
    this.files[fileName] = source
  }

  public getFile(fileName: string): string | undefined {
    return this.files[fileName]
  }

  public createProgram(rootFileNames: string | string[]): ts.Program {
    return ts.createProgram(
      typeof rootFileNames === "string" ? [rootFileNames] : rootFileNames,
      this.compilerOpts,
      this.host,
    )
  }
}
