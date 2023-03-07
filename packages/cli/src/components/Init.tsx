import util from "util"
import childProcess from "child_process"
const exec = util.promisify(childProcess.exec)
import { promises as fs } from "fs"

import { Box, Text } from "ink"
import SelectInput from "ink-select-input/build"
import { useCallback, useEffect, useState } from "react"
import ActivityIndicator from "./ActivityIndicator"
import { PheroCommandInit } from "lib"

const serverPheroFile = `import { createService } from '@phero/server'

async function helloWorld(name: string): Promise<string> {
  return \`Hi there, \${name}!\`
}

export const helloWorldService = createService({
  helloWorld,
})
`

const clientPheroFile = `import { PheroClient } from "./phero.generated";

const fetch = window.fetch.bind(this);
const client = new PheroClient(fetch);

async function main() {
  const message = await client.helloWorldService.helloWorld('Jim')
  console.log(message) // \`Hi there, Jim!\`
}

main()
`

enum OptionValue {
  InitServer = "InitServer",
  InitClient = "InitClient",
  ShutDown = "ShutDown",
}

function SelectIndicator({ isSelected }: { isSelected?: boolean }) {
  return <Text color="yellow">{isSelected ? "▶ " : "  "}</Text>
}

function SelectItem({
  isSelected,
  label,
}: {
  isSelected?: boolean
  label: string
}) {
  return <Text color={isSelected ? "yellow" : undefined}>{label}</Text>
}

async function hasPackageInstalled(name: string): Promise<boolean> {
  const packageJson = await fs.readFile("./package.json", { encoding: "utf-8" })
  const { dependencies, devDependencies } = JSON.parse(packageJson)
  return [
    ...Object.keys(dependencies ?? {}),
    ...Object.keys(devDependencies ?? {}),
  ].some((key) => key === name)
}

async function installPackage(name: string): Promise<void> {
  if (!(await hasPackageInstalled(name))) {
    await exec(`npm i ${name}`)
  }
}

async function hasSourceFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function createSourceFile(
  filePath: string,
  content: string,
): Promise<void> {
  if (!(await hasSourceFile(filePath))) {
    await fs.mkdir("src", { recursive: true })
    await fs.writeFile(filePath, content, { encoding: "utf-8" })
  }
}

async function fileContains(filePath: string, line: string): Promise<boolean> {
  const content = await fs.readFile(filePath, { encoding: "utf-8" })
  return content.includes(line)
}

async function addLineToFile(filePath: string, line: string): Promise<void> {
  if (
    !(await hasSourceFile(filePath)) ||
    !(await fileContains(filePath, line))
  ) {
    await exec(`echo "${line}" >> ${filePath}`)
  }
}

export default function Init({ command }: { command: PheroCommandInit }) {
  const [env, setEnv] = useState<PheroCommandInit["env"]>(command.env)
  const [isDone, setDone] = useState(false)

  const initServer = useCallback(async () => {
    await installPackage("@phero/server")
    await createSourceFile("src/phero.ts", serverPheroFile) // TODO: Get src-directory from tsconfig
    setDone(true)
  }, [])

  const initClient = useCallback(async () => {
    await installPackage("@phero/client")
    await createSourceFile("src/phero.ts", clientPheroFile) // TODO: Get src-directory from tsconfig
    await addLineToFile(".gitignore", "phero.generated.ts")
    setDone(true)
  }, [])

  const onSelect = useCallback(async ({ value }: { value: OptionValue }) => {
    switch (value) {
      case OptionValue.InitServer: {
        setEnv("server")
        await initServer()
        break
      }

      case OptionValue.InitClient: {
        setEnv("client")
        await initClient()
        break
      }

      case OptionValue.ShutDown:
        process.exit(0)
        break
    }
  }, [])

  useEffect(() => {
    if (isDone) {
      process.exit(0)
    }
  }, [])

  useEffect(() => {
    if (command.env === "client") {
      initClient()
    }
    if (command.env === "server") {
      initServer()
    }
  }, [command.env])

  return (
    <Box flexDirection="column">
      {isDone ? (
        <Text>Ready to go! Run `npx phero` again to continue.</Text>
      ) : (
        <>
          {!env && (
            <Box flexDirection="column">
              <Box paddingBottom={1}>
                <Text>
                  Phero is not installed in this directory. What do you want to
                  do?
                </Text>
              </Box>

              <SelectInput
                items={[
                  { value: OptionValue.InitServer, label: "Initialize server" },
                  { value: OptionValue.InitClient, label: "Initialize client" },
                  { value: OptionValue.ShutDown, label: "Exit" },
                ]}
                onSelect={onSelect}
                indicatorComponent={SelectIndicator}
                itemComponent={SelectItem}
              />
            </Box>
          )}

          {env && (
            <>
              {env === "server" && (
                <Text>
                  <ActivityIndicator />
                  <Text dimColor> Initializing </Text>
                  <Text>@phero/server</Text>
                  <Text dimColor>...</Text>
                </Text>
              )}

              {env === "client" && (
                <Text>
                  <ActivityIndicator />
                  <Text dimColor> Initializing </Text>
                  <Text>@phero/client</Text>
                  <Text dimColor>...</Text>
                </Text>
              )}
            </>
          )}
        </>
      )}
    </Box>
  )
}
