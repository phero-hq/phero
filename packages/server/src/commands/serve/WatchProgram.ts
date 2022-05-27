import ts from "typescript"
import { MissingSamenFileError, MissingTSConfigFile } from "@samen/core"

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

type ErrorCallback = (dianostics: readonly ts.Diagnostic[]) => void
type ChangeCallback = (
  samenSourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
) => void

export default class WatchProgram {
  public readonly projectDir: string
  private readonly tsConfigFilePath: string

  private errorCallback?: ErrorCallback
  private changeCallback?: ChangeCallback
  private readonly watchProgram: ts.WatchOfConfigFile<ts.BuilderProgram>

  constructor(absoluteProjectDir: string) {
    this.projectDir = absoluteProjectDir

    const tsConfigFilePath = ts.findConfigFile(
      absoluteProjectDir,
      ts.sys.fileExists,
      "tsconfig.json",
    )

    if (!tsConfigFilePath) {
      throw new MissingTSConfigFile(absoluteProjectDir)
    }

    this.tsConfigFilePath = tsConfigFilePath
    const host = ts.createWatchCompilerHost(
      tsConfigFilePath,
      {},
      ts.sys,
      ts.createSemanticDiagnosticsBuilderProgram,
      this.reportDiagnostic.bind(this),
      this.reportWatchStatusChanged.bind(this),
    )

    this.watchProgram = ts.createWatchProgram(host)
  }

  public onError(callback: ErrorCallback) {
    this.errorCallback = callback
  }

  public onCompileSucceeded(callback: ChangeCallback) {
    this.changeCallback = callback
    this.provideSamenFileToClient()
  }

  public close() {
    this.watchProgram.close()
    this.errorCallback = undefined
    this.changeCallback = undefined
  }

  private reportDiagnostic(diagnostic: ts.Diagnostic) {
    console.error(
      "TS Error",
      diagnostic.code,
      diagnostic.file?.fileName,
      diagnostic.start,
      diagnostic.length,
      ":",
      ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        formatHost.getNewLine(),
      ),
    )

    if (this.errorCallback) {
      const diagnostics = this.watchProgram
        .getProgram()
        .getSemanticDiagnostics()
      // for (const diag of diagnostics) {
      //   if (diag.category === ts.DiagnosticCategory.Error) {
      //   }
      // }
      this.errorCallback(diagnostics)
    }
  }

  private reportWatchStatusChanged(
    diagnostic: ts.Diagnostic,
    newLine: string,
    options: ts.CompilerOptions,
    errorCount?: number,
  ) {
    if (errorCount === 0) {
      this.provideSamenFileToClient()
    } else {
      // already handled by this.reportDiagnostic()
    }
  }

  private async provideSamenFileToClient() {
    if (!this.changeCallback) {
      return
    }

    const program = this.watchProgram.getProgram()
    // TODO check all root dirs for samen.ts
    const sourceFile = program.getSourceFile(`${this.projectDir}/src/samen.ts`)

    if (!sourceFile) {
      throw new MissingSamenFileError(this.projectDir)
    }

    this.changeCallback(
      sourceFile.getSourceFile(),
      this.watchProgram.getProgram().getProgram().getTypeChecker(),
    )
  }
}
