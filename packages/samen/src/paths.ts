import path from "path"

// TODO: Rename to user*
export const serverProjectPath = process.cwd()

export const serverBuildPath = path.join(
  serverProjectPath,
  "node_modules/@samen/samen/build",
)

export const serverConfigPath = path.join(
  serverProjectPath,
  "samen-config.json",
)

export const serverRpcFunctionsPath = path.join(serverBuildPath, "rpcFunctions")

export const clientProjectPath = (relativeOrAbsoluteClientPath: string) =>
  path.resolve(serverProjectPath, relativeOrAbsoluteClientPath)

export const clientBuildPath = (clientProjectPath: string) =>
  path.join(clientProjectPath, "node_modules/@samen/client/build")

export const clientBinPath = (clientProjectPath: string) =>
  path.join(clientProjectPath, "node_modules/.bin/samen")

// TODO: Seperate these out for server and client
export const manifestPath = (buildPath: string) =>
  path.join(buildPath, "samen-manifest.json")
