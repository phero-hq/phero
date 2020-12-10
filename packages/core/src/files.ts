import { promises as fs } from "fs"
import { ClientConfig, SamenConfig } from "./domain"
import { SamenManifest } from "./domain/manifest"
import { ConfigMissingError, ManifestMissingError } from "./errors"
import * as paths from "./paths"

export async function readFile<T>(filePath: string): Promise<T | undefined> {
  try {
    const file = await fs.readFile(filePath, { encoding: "utf-8" })
    return (JSON.parse(file) as unknown) as T
  } catch (error) {
    if (error.code === "ENOENT") {
      return
    }
    throw error
  }
}

export async function readManifestFile(): Promise<SamenManifest> {
  const filePath = paths.userManifestFile
  const manifest = await readFile(filePath)
  // TODO: Validate file contents
  if (!manifest) throw new ManifestMissingError(filePath)
  return manifest as SamenManifest
}

export async function readConfigFile(): Promise<SamenConfig> {
  const filePath = paths.userConfigFile
  const config = await readFile(filePath)
  // TODO: Validate file contents
  if (!config) throw new ConfigMissingError(filePath)
  return config as SamenConfig
}

export async function readClientManifestFile(
  clientProjectDir: string,
): Promise<SamenManifest> {
  const filePath = paths.clientManifestFile(clientProjectDir)
  const manifest = await readFile(filePath)
  // TODO: Validate file contents
  if (!manifest) throw new ManifestMissingError(filePath)
  return manifest as SamenManifest
}

export async function readClientConfigFile(
  clientProjectDir: string,
): Promise<ClientConfig> {
  const filePath = paths.clientConfigFile(clientProjectDir)
  const config = await readFile(filePath)
  // TODO: Validate file contents
  if (!config) throw new ConfigMissingError(filePath)
  return config as ClientConfig
}
