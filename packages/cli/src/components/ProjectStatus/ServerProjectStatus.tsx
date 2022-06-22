import {
  addDevEventListener,
  ServerCommandServe,
  ServerDevEvent,
} from "@samen/dev"
import { Box, Text } from "ink"
import path from "path"
import { useCallback, useEffect, useState } from "react"
import { spawnChildProcess } from "../../process"
import { ServerProject } from "../../utils/getProjects"
import ActivityIndicator from "../ActivityIndicator"
import ProjectStatusEventList, { StyledEvent } from "./ProjectStatusEventList"

export default function ServerProjectStatus({
  project,
  command,
}: {
  project: ServerProject
  command: ServerCommandServe
}) {
  const [status, setStatus] = useState<string>("Initializing...")
  const [isBuilding, setBuilding] = useState(true)
  const [error, setError] = useState<string>()

  const [events, setEvents] = useState<StyledEvent[]>([])
  const addEvent = useCallback((addedEvent: StyledEvent) => {
    setEvents((oldEvents) => [...oldEvents, addedEvent])
  }, [])

  const onEvent = useCallback((event: ServerDevEvent) => {
    if (command.verbose) {
      console.log("server", event)
    }

    switch (event.type) {
      case "LISTENER_CONNECTED":
        setStatus("Waiting for changes")
        setBuilding(false)
        break

      case "SERVE_INIT":
        setStatus("Initializing server...")
        setBuilding(true)
        break

      case "SERVE_READY":
        setStatus("Waiting for changes")
        setBuilding(false)
        break

      case "BUILD_PROJECT_START":
        setStatus("Building project...")
        setBuilding(true)
        break

      case "BUILD_PROJECT_SUCCESS":
        setStatus("Waiting for changes")
        setBuilding(false)
        break

      case "BUILD_PROJECT_FAILED":
        setStatus("Could not build project")
        setError(event.error)
        setBuilding(false)
        break

      case "BUILD_MANIFEST_START":
        setStatus("Building manifest...")
        setBuilding(true)
        break

      case "BUILD_MANIFEST_SUCCESS":
        setStatus("Waiting for changes")
        setBuilding(false)
        break

      case "BUILD_MANIFEST_FAILED":
        setStatus("Could not build manifest")
        setError(event.error)
        setBuilding(false)
        break

      case "BUILD_RPCS_START":
        setStatus(`Building RPC's...`)
        setBuilding(true)
        break

      case "BUILD_RPCS_SUCCESS":
        setStatus("Waiting for changes")
        setBuilding(false)
        break

      case "BUILD_RPCS_FAILED":
        setStatus(`Could not build RPC's`)
        setError(event.error)
        setBuilding(false)
        break

      case "RPC_START":
        addEvent(["default", `${event.url}...`])
        break

      case "RPC_SUCCESS":
        addEvent(["default", `${event.url} (${event.ms}ms)`])
        break

      case "RPC_FAILED":
        addEvent([
          "error",
          `${event.url} (${event.ms}ms)\n  ${event.status}: ${event.message}`,
        ])
        break

      default:
        if (command.verbose) {
          console.log("unhandled server event: ", event)
        }
    }
  }, [])

  useEffect(() => {
    const removeEventListener = addDevEventListener(
      `http://localhost:${command.port}`,
      onEvent,
      (status) => {
        if (command.verbose) {
          console.log({ status })
        }
      },
    )

    const childProcess = spawnChildProcess(
      "./node_modules/.bin/samen-server",
      ["serve", "--port", `${command.port}`],
      path.resolve(project.path),
    )

    return () => {
      removeEventListener()
      childProcess.kill("SIGINT")
    }
  }, [])

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text>samen-server @ {project.path}</Text>

      <Box marginTop={1} marginBottom={1}>
        {isBuilding ? (
          <Text>
            <Text color="yellow">
              <ActivityIndicator />
            </Text>
            {` ${status}`}
          </Text>
        ) : (
          <Text>
            <Text color="green">✓</Text>
            {` ${status}`}
          </Text>
        )}
      </Box>

      <ProjectStatusEventList events={events} />
    </Box>
  )
}
