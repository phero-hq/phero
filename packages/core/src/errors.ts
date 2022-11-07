import ts from "typescript"

export class MissingTSConfigFileError extends Error {
  constructor(projectDir: string) {
    super(
      `Could not find a valid tsconfig.json on path ${projectDir}/tsconfig.json`,
    )
  }
}
export class MissingPheroFileError extends Error {
  constructor(projectDir: string) {
    super(`Could not find the phero.ts file on path ${projectDir}`)
  }
}

export class ParseError extends Error {
  constructor(message: string, public readonly node: ts.Node) {
    super(generateErrorMessage(message, node))
  }
}

function generateErrorMessage(message: string, node: ts.Node): string {
  node.getSourceFile()

  return ts.formatDiagnosticsWithColorAndContext(
    [
      {
        code: "-PheroError" as any as number,
        category: ts.DiagnosticCategory.Error,
        file: node.getSourceFile(),
        messageText: `\n\n${message}`,
        start: node.pos,
        length: node.end - node.pos,
      },
    ],
    {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => "",
      getNewLine: () => "\n",
    },
  )
}

export class PortInUseError extends Error {
  constructor(port: number) {
    super(`Port ${port} is already in use`)
  }
}

export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as any).code === "string"
  )
}
