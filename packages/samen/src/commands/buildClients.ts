import {
  Environment,
  ManifestMissingError,
  paths,
  SamenClientNotInstalledError,
  SamenConfig,
} from "@samen/core"
import { exec } from "child_process"
import { promises as fs } from "fs"
import util from "util"
const execAsync = util.promisify(exec)

export default async function buildClients(
  environment: Environment,
): Promise<void> {
  console.log(`Building samen clients in ${environment} mode`)

  const manifestFile = await readManifestFile()
  const config = await readConfig()

  if (config && config.clients.length > 0) {
    for (const configuredClientPath of config.clients) {
      await buildClientSDK(environment, manifestFile, configuredClientPath)
    }
  }
}

async function readManifestFile(): Promise<string> {
  const filePath = paths.userManifestFile
  try {
    // No need to parse it, we're going to write it out as-is
    return await fs.readFile(filePath, { encoding: "utf-8" })
  } catch (error) {
    throw new ManifestMissingError(filePath)
  }
}

export async function readConfig(): Promise<SamenConfig | null> {
  try {
    const samenConfig = await fs.readFile(paths.userConfigFile)
    // TODO validate samenConfig
    return JSON.parse(samenConfig.toString()) as SamenConfig
  } catch (e) {
    if (e.code === "ENOENT") {
      return null
    }
    throw e
  }
}

async function buildClientSDK(
  environment: Environment,
  manifestFile: string,
  configuredClientPath: string,
): Promise<void> {
  const clientPath = paths.clientProjectDir(configuredClientPath)
  console.log(`Building client: "${configuredClientPath}"`)

  console.log(` Writing manifest file...`)
  await fs.writeFile(paths.clientManifestFile(clientPath), manifestFile)

  console.log(` Building client SDK...`)
  const binPath = paths.clientBinFile(clientPath)
  try {
    await fs.stat(binPath)
  } catch (error) {
    throw new SamenClientNotInstalledError(clientPath)
  }
  const productionFlag =
    environment === Environment.production ? "--production" : ""
  await execAsync(`"${binPath}" build ${productionFlag}`, { cwd: clientPath })
}
