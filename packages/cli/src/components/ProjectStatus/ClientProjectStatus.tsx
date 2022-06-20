import { ClientCommandWatch, ClientDevEvent } from "@samen/dev"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import { useCallback, useEffect, useState } from "react"
import { ClientProject } from "../../utils/getProjects"
import { spawnClientWatch } from "../../utils/processes"
import { StyledEvent } from "./ProjectStatusEventList"

export default function ClientProjectStatus({
  project,
  command,
}: {
  project: ClientProject
  command: ClientCommandWatch
}) {
  const [event, setEvent] = useState<StyledEvent>(["busy", "Initializing..."])

  const onEvent = useCallback((event: ClientDevEvent) => {
    if (command.verbose) {
      console.log("client", event)
    }

    switch (event.type) {
      case "LISTENER_CONNECTED":
        setEvent(["default", "Waiting for changes"])
        break

      case "WATCH_INIT":
        setEvent(["default", "Initializing client watch server..."])
        break

      case "WATCH_READY":
        setEvent(["default", "Waiting for changes"])
        break

      case "SERVER_CONNECTED":
        setEvent(["default", "Waiting for changes"])
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
        setEvent(["default", "Waiting for changes"])
        break

      case "BUILD_FAILED":
        setEvent(["error", `Could not build client: ${event.error}`])
        break

      default:
        if (command.verbose) {
          console.log("unhandled client event: ", event)
        }
    }
  }, [])

  useEffect(() => {
    const kill = spawnClientWatch(project.path, onEvent, command)
    return () => kill()
  }, [])

  return (
    <Box flexDirection="column" flexGrow={0} flexShrink={0}>
      <Text>samen-client @ {project.path}</Text>

      <Box marginTop={1} marginBottom={1}>
        {event[0] === "busy" && (
          <Text>
            <Text color="yellow">
              <Spinner type="triangle" />
            </Text>
            {` ${event[1]}`}
          </Text>
        )}

        {event[0] === "default" && (
          <Text>
            <Text color="green">✓</Text>
            {` ${event[1]}`}
          </Text>
        )}

        {event[0] === "error" && (
          <Text>
            <Text color="red">✖</Text>
            {` ${event[1]}`}
          </Text>
        )}
      </Box>
    </Box>
  )
}
