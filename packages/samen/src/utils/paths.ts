import path from "path"

// example/server
export const userProjectDir = process.cwd()

// example/server/node_modules/@samen/samen/build
export const userBuildDir = path.join(
  userProjectDir,
  "node_modules/@samen/samen/build",
)

// example/server/node_modules/@samen/samen/build/rpcFunctions
export const userRpcFunctionsDir = path.join(userBuildDir, "rpcFunctions")

// example/server/samen-config.json
export const userConfigFile = path.join(userProjectDir, "samen-config.json")

// either from a cli-argument, or cwd/samen-manifest.json
export function getManifestPath(): string {
  const manifestPathIndex = process.argv.indexOf("--manifest")
  if (manifestPathIndex === -1) {
    return path.join(process.cwd(), "samen-manifest.json")
  }
  const manifestPath = process.argv[manifestPathIndex + 1]
  if (!manifestPath) throw new Error(`No manifest found at ${manifestPath}`)
  return path.join(process.cwd(), manifestPath)
}
