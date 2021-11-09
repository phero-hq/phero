import { promises as fs } from "fs"

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
