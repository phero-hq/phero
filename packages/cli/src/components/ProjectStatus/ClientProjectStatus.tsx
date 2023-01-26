import {
  addDevEventListener,
  ClientCommandWatch,
  ClientDevEvent,
} from "@phero/dev"
import { Box, Text } from "ink"
import path from "path"
import { useCallback, useEffect, useRef, useState } from "react"
import { spawnClientDevEnv } from "../../process"
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
  const [event, setEvent] = useState<StyledEvent>(["busy", "Loading..."])
  const [error, setError] = useState<string>()
  const [isErrorVisible, setErrorVisible] = useState(false)

  const onEvent = useCallback((event: ClientDevEvent) => {
    if (command.verbose) {
      console.log("client", event)
    }

    switch (event.type) {
      case "LISTENER_CONNECTED":
      case "WATCH_INIT":
      case "WATCH_READY":
      case "SERVER_CONNECTED":
        setEvent(["default", "Loading..."])
        setError(undefined)
        break

      case "SERVER_DISCONNECTED":
        setEvent(["error", "Disconnected from server. Is it still running?"])
        setError(event.errorMessage)
        break

      case "SERVER_NOT_FOUND":
        setEvent(["error", "Could not find any phero server to connect too."])
        setError(event.errorMessage)
        break

      case "BUILD_START":
        setEvent(["busy", "Building client..."])
        setError(undefined)
        break

      case "BUILD_SUCCESS":
        setEvent(["default", "Client is ready, waiting for changes."])
        setError(undefined)
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
    // It's not possible to instantly connect to the
    // event-emitter. Hide the error for a short while,
    // to make it easier on the experience:
    const timeout = setTimeout(() => setErrorVisible(true), 5000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const eventUrl = `http://localhost:${command.port}`
    const removeEventListener = addDevEventListener(
      eventUrl,
      onEvent,
      () => {
        if (command.verbose) {
          console.log("Listener to phero-client process connected")
        }
      },
      (error) => {
        setError(`Could not connect to event emitter at ${eventUrl} (${error})`)
      },
    )

    const childProcess = spawnClientDevEnv(command, path.resolve(project.path))

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

      {error && isErrorVisible && (
        <Box paddingX={4} paddingY={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  )
}
