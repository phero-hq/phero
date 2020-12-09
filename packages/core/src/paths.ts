import path from "path"

/*
 * User project, usually a server-project where the samen-file lives
 */

// example/server
export const userProjectDir = process.cwd()

// example/server/node_modules/@samen/samen/build
export const userBuildDir = path.join(
  userProjectDir,
  "node_modules/@samen/samen/build",
)

// example/server/node_modules/@samen/samen/build/rpcFunctions
export const userRpcFunctionsDir = path.join(userBuildDir, "rpcFunctions")

// example/server/node_modules/@samen/samen/build/samen-manifest.json
export const userManifestFile = path.join(userBuildDir, "samen-manifest.json")

// example/server/samen-config.json
export const userConfigFile = path.join(userProjectDir, "samen-config.json")

/*
 * Client project, could be more than one, web or RN, where the SDK is generated to
 */

// example/client
export const clientProjectDir = (configuredClientDir: string) =>
  path.resolve(userProjectDir, configuredClientDir)

// example/client/samen-manifest.json
export const clientManifestFile = (clientProjectDir: string) =>
  path.join(clientProjectDir, "samen-manifest.json")

// example/client/samen-config.json
export const clientConfigFile = (clientProjectDir: string) =>
  path.join(clientProjectDir, "samen-config.json")

// example/client/node_modules/.bin/samen
export const clientBinFile = (clientProjectDir: string) =>
  path.join(clientProjectDir, "node_modules/.bin/samen")

// example/client/node_modules/@samen/client/build
export const clientBuildDir = (clientProjectDir: string) =>
  path.join(clientProjectDir, "node_modules/@samen/client/build")

// example/client/node_modules/@samen/client/build/sdk
export const clientSdkDir = (clientProjectDir: string) =>
  path.join(clientBuildDir(clientProjectDir), "sdk")
