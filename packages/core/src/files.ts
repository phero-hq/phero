import { promises as fs } from "fs"
import { ClientConfig, SamenConfig } from "./domain"
import { SamenManifest } from "./domain/manifest"
import * as paths from "./paths"

export async function readOptionalFile<T>(
  filePath: string,
): Promise<T | undefined> {
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

export async function readRequiredFile<T>(filePath: string): Promise<T> {
  try {
    const file = await fs.readFile(filePath, { encoding: "utf-8" })
    return (JSON.parse(file) as unknown) as T
  } catch (error) {
    throw error
  }
}

export async function readManifestFile(): Promise<SamenManifest> {
  // TODO: Validate contents
  return readRequiredFile(paths.userManifestFile)
}

export async function readConfigFile(): Promise<SamenConfig | undefined> {
  // TODO: Validate contents
  return readOptionalFile(paths.userConfigFile)
}

export async function readClientManifestFile(
  clientProjectDir: string,
): Promise<SamenManifest> {
  // TODO: Validate contents
  return readRequiredFile(paths.clientManifestFile(clientProjectDir))
}

export async function readClientConfigFile(
  clientProjectDir: string,
): Promise<ClientConfig | undefined> {
  // TODO: Validate contents
  return readOptionalFile(paths.clientConfigFile(clientProjectDir))
}
