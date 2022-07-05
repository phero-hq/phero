import util from "util"
import childProcess from "child_process"
const exec = util.promisify(childProcess.exec)

type Result = [string, { current: string; latest: string; location: string }][]

async function getOutdatedGlobal(): Promise<Result> {
  try {
    await exec("npm outdated --json --global", { encoding: "utf-8" })
  } catch (error) {
    if (error instanceof Error && (error as any).stdout) {
      const result = JSON.parse((error as any).stdout) as Record<string, any>
      return Object.entries(result)
        .filter(
          ([packageName]) =>
            packageName === "samen" || packageName.startsWith("@samen/"),
        )
        .map(([packageName, info]) => [
          packageName,
          { current: info.current, latest: info.latest, location: "global" },
        ])
    }
  }
  return []
}

async function getOutdatedLocal(cwd: string): Promise<Result> {
  try {
    await exec("npm outdated --json", { encoding: "utf-8", cwd })
  } catch (error) {
    if (error instanceof Error && (error as any).stdout) {
      const result = JSON.parse((error as any).stdout) as Record<string, any>
      return Object.entries(result)
        .filter(
          ([packageName]) =>
            packageName === "samen" || packageName.startsWith("@samen/"),
        )
        .map(([packageName, info]) => [
          packageName,
          { current: info.current, latest: info.latest, location: cwd },
        ])
    }
  }
  return []
}

export default async function checkAndWarnForVersions(
  cwds: string[],
  onLog: (log: string) => void,
): Promise<void> {
  let outdated: Result = []

  outdated.push(...(await getOutdatedGlobal()))

  for (const cwd of cwds) {
    outdated.push(...(await getOutdatedLocal(cwd)))
  }

  if (outdated.length > 0) {
    onLog("\nSome packages are outdated:\n")
    for (const [packageName, info] of outdated) {
      onLog(`  ${packageName}`)
      onLog(`    Location: ${info.location}`)
      onLog(`    Current:  ${info.current}`)
      onLog(`    Latest:   ${info.latest}\n`)
    }
  }
}
