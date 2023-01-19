import path from "path"
import https from "https"
import semver from "semver"
import util from "util"
import childProcess from "child_process"
import { promises as fs } from "fs"

const exec = util.promisify(childProcess.exec)

type Item = {
  name: string
  current: string
  latest: string
  location: string
}

async function getLatestFor(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
      let json = ""
      res.on("data", (data) => {
        json += data
      })
      res.on("end", () => {
        const response = JSON.parse(json)
        const latest = response["dist-tags"]?.latest
        if (!latest) {
          reject(new Error("No latest found"))
        }
        resolve(latest)
      })
      res.on("error", reject)
    })
  })
}

async function getGlobalItems(): Promise<Item[]> {
  const current = (await exec("phero --version")).stdout.trim()
  const latest = await getLatestFor("phero")

  if (semver.gt(latest, current)) {
    return [{ name: "phero", location: "global", current, latest }]
  } else {
    return []
  }
}

async function getLocalItem(
  cwd: string,
  executable: string,
  packageName: string,
): Promise<Item | undefined> {
  try {
    const command = `npm exec -- ${executable} --version`
    const current = (await exec(command, { cwd })).stdout.trim()
    const latest = await getLatestFor(packageName)

    if (semver.gt(latest, current)) {
      return { name: packageName, location: cwd, current, latest }
    }
  } catch (error) {
    return undefined
  }
}

async function getLocalItems(cwd: string): Promise<Item[]> {
  const items: Item[] = []

  const clientItem = await getLocalItem(cwd, "phero-client", "@phero/client")
  if (clientItem) items.push(clientItem)

  const serverItem = await getLocalItem(cwd, "phero-server", "@phero/server")
  if (serverItem) items.push(serverItem)

  return items
}

export default async function checkAndWarnForVersions(
  cwds: string[],
  onLog: (log: string) => void,
): Promise<void> {
  try {
    let items: Item[] = []

    items.push(...(await getGlobalItems()))

    for (const cwd of cwds) {
      items.push(...(await getLocalItems(cwd)))
    }

    if (items.length > 0) {
      onLog("\nSome packages are outdated:\n")
      for (const item of items) {
        onLog(`  ${item.name}`)
        onLog(`    Location: ${item.location}`)
        onLog(`    Current:  ${item.current}`)
        onLog(`    Latest:   ${item.latest}\n`)
      }
    }
  } catch (error) {
    // ignore
  }
}
