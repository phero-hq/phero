import {
  ManifestMissingError,
  readFile,
  SamenConfig,
  SamenManifest,
} from "@samen/core"

export async function readManifestFile(
  filePath: string,
): Promise<SamenManifest> {
  const manifest = await readFile(filePath)
  // TODO: Validate file contents
  if (!manifest) throw new ManifestMissingError(filePath)
  return manifest as SamenManifest
}

export async function readConfigFile(filePath: string): Promise<SamenConfig> {
  const config = await readFile(filePath)
  // TODO: Validate file contents
  if (!config) return {}
  return config as SamenConfig
}
