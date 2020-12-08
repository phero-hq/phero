import { Diagnostic, Project, ts, Type } from "ts-morph"

export class ManifestMissingError extends Error {
  constructor(filePath: string) {
    super(`Manifest missing at: ${filePath}`)
  }
}

export class SamenFileMissingError extends Error {
  constructor(filePath: string) {
    super(`Samen file missing at: ${filePath}`)
  }
}

export class PropertyMissingError extends Error {
  constructor(property: string) {
    super(`Property missing: ${property}`)
  }
}

export class PropertiesMissingError extends Error {
  constructor(properties: string[]) {
    super(`Properties missing: ${properties.join(", ")}`)
  }
}

export class UnsupportedTypeError extends Error {
  constructor(type: Type) {
    super(`Unsupported type: ${type}`)
  }
}

export class SamenClientNotInstalledError extends Error {
  public clientPath: string
  constructor(clientPath: string) {
    super(`The @samen/client package is not installed in "${clientPath}"`)
    this.clientPath = clientPath
  }
}

export class ManifestCompilerError extends Error {
  public originalError: Error
  constructor(originalError: Error) {
    super(`Could not generate manifest`)
    this.originalError = originalError
  }
}

export class ClientSDKCompilerError extends Error {
  public originalError: Error
  constructor(originalError: Error) {
    super(`Could not generate client SDK`)
    this.originalError = originalError
  }
}

export class ApiEndpointCompilerError extends Error {
  public originalError: Error
  constructor(originalError: Error) {
    super(`Could not generate API endpoints`)
    this.originalError = originalError
  }
}

export class TypeScriptCompilerError extends Error {
  public project: Project
  public diagnostics: Diagnostic<ts.Diagnostic>[]
  constructor(project: Project, diagnostics: Diagnostic<ts.Diagnostic>[]) {
    super(`TypeScript compilation error`)
    this.project = project
    this.diagnostics = diagnostics
  }
}

export function validateProject(project: Project) {
  const diagnostics = project.getPreEmitDiagnostics()
  if (diagnostics.length > 0) {
    throw new TypeScriptCompilerError(project, diagnostics)
  }
}

export function handleError(error: Error) {
  console.log("--------")
  console.log(" Error! ")
  console.log("--------")

  if (error instanceof SamenClientNotInstalledError) {
    console.error(error.message)
    // TODO: Prompt to install it and retry
    process.exit(1)
  }

  if (error instanceof TypeScriptCompilerError) {
    console.error(
      error.project.formatDiagnosticsWithColorAndContext(error.diagnostics),
    )
    process.exit(1)
  }

  if (
    error instanceof ManifestCompilerError ||
    error instanceof ClientSDKCompilerError ||
    error instanceof ApiEndpointCompilerError
  ) {
    console.error(error.message)
    handleError(error.originalError)
    process.exit(1)
  }

  console.error(error)
  process.exit(1)
}
