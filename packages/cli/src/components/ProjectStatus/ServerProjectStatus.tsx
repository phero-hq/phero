import { ServerDevEvent } from "@samen/core"
import { Box, Text } from "ink"
import { useCallback, useEffect, useState } from "react"
import { useCommand } from "../../context/CommandContext"
import { ServerProject } from "../../utils/getProjects"
import { spawnServerWatch } from "../../utils/processes"
import ProjectStatusEventList, { StyledEvent } from "./ProjectStatusEventList"

export default function ServerProjectStatus({
  project,
}: {
  project: ServerProject
}) {
  const [events, setEvents] = useState<StyledEvent[]>([
    ["default", "Initializing..."],
  ])
  const command = useCommand()

  const addEvent = useCallback((addedEvent: StyledEvent) => {
    setEvents((oldEvents) => [...oldEvents, addedEvent])
  }, [])

  const onEvent = useCallback((event: ServerDevEvent) => {
    if (command.debug) {
      console.log("server", event)
    }

    switch (event.type) {
      case "SERVE_INIT":
        addEvent(["default", "Initializing server..."])
        break

      case "SERVE_READY":
        addEvent(["default", "Server intialized."])
        break

      case "BUILD_PROJECT_START":
        addEvent(["default", "Building project..."])
        break

      case "BUILD_PROJECT_SUCCESS":
        addEvent(["default", "Project is ready."])
        break

      case "BUILD_PROJECT_FAILED":
        addEvent(["error", "Could not build project!"])
        break

      case "BUILD_MANIFEST_START":
        addEvent(["default", "Building manifest..."])
        break

      case "BUILD_MANIFEST_SUCCESS":
        addEvent(["default", "Manifest is ready."])
        break

      case "BUILD_MANIFEST_FAILED":
        addEvent(["error", "Could not build manifest!"])
        break

      case "BUILD_RPCS_START":
        addEvent(["default", `Building RPC's...`])
        break

      case "BUILD_RPCS_SUCCESS":
        addEvent(["default", "Server is ready."])
        break

      case "BUILD_RPCS_FAILED":
        addEvent(["error", `Could not build RPC's!`])
        break

      case "RPC_START":
        addEvent(["default", `Handling call to RPC: ${event.url}...`])
        break

      case "RPC_SUCCESS":
        addEvent([
          "default",
          `Handled call to RPC: {lastEvent.url}: {lastEvent.status}`,
        ])
        break

      case "RPC_FAILED":
        addEvent([
          "error",
          `Failed to handle call to RPC: {lastEvent.url}: {lastEvent.status}`,
        ])
        break

      default:
        if (command.debug) {
          console.log("unhandled server event: ", event)
        }
    }
  }, [])

  useEffect(() => {
    const kill = spawnServerWatch(project.path, onEvent, command.debug)
    return () => kill()
  }, [])

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text>samen-server @ {project.path}</Text>
      <ProjectStatusEventList events={events} />
    </Box>
  )
}
