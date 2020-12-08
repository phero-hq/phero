import {
  Environment,
  ManifestMissingError,
  paths,
  SamenClientNotInstalledError,
  SamenConfig,
  startSpinner,
} from "@samen/core"
import { exec } from "child_process"
import { promises as fs } from "fs"
import util from "util"
const execAsync = util.promisify(exec)

export default async function buildClients(
  environment: Environment,
): Promise<void> {
  const manifestFile = await readManifestFile()
  const config = await readConfig()

  if (config && config.clients.length > 0) {
    for (const configuredClientPath of config.clients) {
      await buildClientSDK(environment, manifestFile, configuredClientPath)
    }
  }
}

async function readManifestFile(): Promise<string> {
  const spinner = startSpinner("Reading manifest file")
  const filePath = paths.userManifestFile
  try {
    // No need to parse it, we're going to write it out as-is
    const result = await fs.readFile(filePath, { encoding: "utf-8" })
    spinner.succeed("Manifest is ready")
    return result
  } catch (error) {
    throw new ManifestMissingError(filePath)
  }
}

export async function readConfig(): Promise<SamenConfig | null> {
  const spinner = startSpinner("Reading config file")
  try {
    const samenConfig = await fs.readFile(paths.userConfigFile)
    // TODO validate samenConfig
    const result = JSON.parse(samenConfig.toString()) as SamenConfig
    spinner.succeed("Config is ready")
    return result
  } catch (e) {
    if (e.code === "ENOENT") {
      spinner.succeed("No config file is found, but that's ok")
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
  const prefix = `Found client project: "${configuredClientPath}"\n`
  const clientPath = paths.clientProjectDir(configuredClientPath)

  const spinner = startSpinner(prefix + "  Writing manifest file...")
  await fs.writeFile(paths.clientManifestFile(clientPath), manifestFile)

  spinner.text = prefix + "  Building client SDK..."
  const binPath = paths.clientBinFile(clientPath)
  try {
    await fs.stat(binPath)
  } catch (error) {
    throw new SamenClientNotInstalledError(clientPath)
  }
  const productionFlag =
    environment === Environment.production ? "--production" : ""
  await execAsync(`"${binPath}" build ${productionFlag}`, { cwd: clientPath })

  spinner.succeed(`Client is ready: ${configuredClientPath}`)
}
