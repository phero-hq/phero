import ora from "ora"
import { promises as fs } from "fs"

export enum Environment {
  production = "production",
  development = "development",
}

export function getEnvironment(): Environment {
  if (process.argv.includes("--production")) return Environment.production
  if (process.env.NODE_ENV === "production") return Environment.production
  return Environment.development
}

interface ExtendedOra extends ora.Ora {
  setSubTask: (subTask: string) => ExtendedOra
}
export function startSpinner(message: string): ExtendedOra {
  const spinner = ora(message).start()
  const extended = spinner as any
  extended.setSubTask = (subTask: string): ExtendedOra => {
    extended.text = `${message}\n  › ${subTask}`
    return extended
  }
  return extended
}

export async function ensureDir(path: string): Promise<void> {
  if (!(await dirExists(path))) {
    await fs.mkdir(path)
  }
}

export async function dirExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path)
    return true
  } catch (error) {
    return false
  }
}
