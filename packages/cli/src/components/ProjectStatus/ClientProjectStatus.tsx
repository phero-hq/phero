import {
  addDevEventListener,
  ClientCommandWatch,
  ClientDevEvent,
} from "@samen/dev"
import { Box, Text } from "ink"
import path from "path"
import { useCallback, useEffect, useState } from "react"
import { spawnChildProcess } from "../../process"
import { ClientProject, StyledEvent } from "../../types"
import ProjectStatus from "../ProjectStatus"

export default function ClientProjectStatus({
  project,
  command,
  maxProjectPathLength,
}: {
  project: ClientProject
  command: ClientCommandWatch
  maxProjectPathLength: number
}) {
  const [event, setEvent] = useState<StyledEvent>(["busy", "Initializing..."])
  const [error, setError] = useState<string>()

  const onEvent = useCallback((event: ClientDevEvent) => {
    if (command.verbose) {
      console.log("client", event)
    }

    setError(undefined)

    switch (event.type) {
      case "LISTENER_CONNECTED":
      case "WATCH_INIT":
      case "WATCH_READY":
      case "SERVER_CONNECTED":
        setEvent(["default", "Initializing..."])
        break

      case "SERVER_DISCONNECTED":
        setEvent(["error", "Disconnected from server. Is it still running?"])
        break

      case "SERVER_NOT_FOUND":
        setEvent(["error", "Could not find any samen server to connect too."])
        break

      case "BUILD_START":
        setEvent(["busy", "Building client..."])
        break

      case "BUILD_SUCCESS":
        setEvent(["default", "Client is ready, waiting for changes."])
        break

      case "BUILD_FAILED":
        setEvent(["error", "Could not build client"])
        setError(event.errorMessage)
        break

      default:
        if (command.verbose) {
          console.log("unhandled client event: ", event)
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
      "samen-client",
      ["watch", "--port", `${command.port}`],
      path.resolve(project.path),
    )

    return () => {
      removeEventListener()
      childProcess.kill("SIGINT")
    }
  }, [])

  return (
    <Box flexDirection="column">
      <ProjectStatus
        type="client"
        projectPath={project.path}
        status={event[0]}
        message={event[1]}
        maxProjectPathLength={maxProjectPathLength}
      />

      {error && (
        <Box paddingX={4} paddingY={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  )
}
