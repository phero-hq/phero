import { ClientDevEvent } from "@samen/dev"
import { Box, Text } from "ink"
import { useCallback, useEffect, useState } from "react"
import { useCommand } from "../../context/CommandContext"
import { ClientProject } from "../../utils/getProjects"
import { spawnClientWatch } from "../../utils/processes"
import ProjectStatusEventList, { StyledEvent } from "./ProjectStatusEventList"

export default function ClientProjectStatus({
  project,
}: {
  project: ClientProject
}) {
  const [events, setEvents] = useState<StyledEvent[]>([
    ["default", "Initializing..."],
  ])
  const command = useCommand()

  const addEvent = useCallback((addedEvent: StyledEvent) => {
    setEvents((oldEvents) => [...oldEvents, addedEvent])
  }, [])

  const onEvent = useCallback((event: ClientDevEvent) => {
    if (command.debug) {
      console.log("client", event)
    }

    switch (event.type) {
      case "LISTENER_CONNECTED":
        addEvent(["default", "Listening for events..."])
        break

      case "WATCH_INIT":
        addEvent(["default", "Initializing client watch server..."])
        break

      case "WATCH_READY":
        // addEvent(["default", "Client watch server ready."])
        break

      case "SERVER_CONNECTED":
        // addEvent(["default", "Connected to server, watching for changes..."])
        break

      case "SERVER_DISCONNECTED":
        addEvent(["error", "Disconnected from server!"])
        break

      case "SERVER_NOT_FOUND":
        addEvent(["error", "Could not find server!"])
        break

      case "BUILD_START":
        addEvent(["default", "Building client..."])
        break

      case "BUILD_SUCCESS":
        addEvent(["default", "Client is ready."])
        break

      case "BUILD_FAILED":
        addEvent(["error", "Build failed!"])
        break

      default:
        if (command.debug) {
          console.log("unhandled client event: ", event)
        }
    }
  }, [])

  useEffect(() => {
    const kill = spawnClientWatch(project.path, onEvent, command.debug)
    return () => kill()
  }, [])

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text>samen-client @ {project.path}</Text>
      <ProjectStatusEventList events={events} />
    </Box>
  )
}
