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
