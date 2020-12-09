import {
  Environment,
  ManifestMissingError,
  paths,
  readConfigFile,
  readManifestFile,
  SamenClientNotInstalledError,
  SamenManifest,
  startSpinner,
} from "@samen/core"
import { exec } from "child_process"
import { promises as fs } from "fs"
import util from "util"
const execAsync = util.promisify(exec)

export default async function buildClients(
  environment: Environment,
): Promise<void> {
  const manifest = await readManifestFile()
  const config = await readConfigFile()

  if (config && config.clients.length > 0) {
    for (const configuredClientPath of config.clients) {
      await buildClientSDK(environment, manifest, configuredClientPath)
    }
  }
}

async function buildClientSDK(
  environment: Environment,
  manifest: SamenManifest,
  configuredClientPath: string,
): Promise<void> {
  const spinner = startSpinner(
    `Generating client SDK for: ${configuredClientPath}`,
  )
  const clientPath = paths.clientProjectDir(configuredClientPath)

  spinner.setSubTask("Writing manifest file")
  await fs.writeFile(
    paths.clientManifestFile(clientPath),
    JSON.stringify(manifest, null, 4),
  )

  spinner.setSubTask("Generating SDK")
  const binPath = paths.clientBinFile(clientPath)
  try {
    await fs.stat(binPath)
  } catch (error) {
    throw new SamenClientNotInstalledError(clientPath)
  }
  const productionFlag =
    environment === Environment.production ? "--production" : ""
  await execAsync(`"${binPath}" build ${productionFlag}`, { cwd: clientPath })

  spinner.succeed(`Generated client SDK for: ${configuredClientPath}`)
}
