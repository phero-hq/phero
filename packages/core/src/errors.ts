import ts from "typescript"

export class MissingTSConfigFile extends Error {
  constructor(projectDir: string) {
    super(
      `Could not find a valid tsconfig.json on path ${projectDir}/tsconfig.json`,
    )
  }
}
export class MissingSamenFileError extends Error {
  constructor(projectDir: string) {
    super(`Could not find the samen.ts file on path ${projectDir}`)
  }
}

export class ParseError extends Error {
  constructor(message: string, public readonly node: ts.Node) {
    super(message + "-->" + node.getText())
  }
}

export class PortInUseError extends Error {
  constructor(port: number) {
    super(`Port ${port} is already in use`)
  }
}
