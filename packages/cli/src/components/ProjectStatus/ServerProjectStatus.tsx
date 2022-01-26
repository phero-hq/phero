import { DevEventListenerConnectionStatus, ServerDevEvent } from "@samen/core"
import { Box, Text } from "ink"
import { useCallback, useEffect, useRef, useState } from "react"
import { useCommand } from "../../context/CommandContext"
import { ServerProject } from "../../utils/getProjects"
import { spawnServerWatch } from "../../utils/processes"

type StyledEvent = ["default" | "error" | "dimmed", string]

export default function ServerProjectStatus({
  project,
}: {
  project: ServerProject
}) {
  const [event, setEvent] = useState<StyledEvent>()
  const isReady = useRef(false)
  const command = useCommand()

  const onEvent = useCallback((event: ServerDevEvent) => {
    if (command.debug) {
      console.log({ event })
    }

    switch (event.type) {
      case "SERVE_INIT":
        setEvent(["default", "Initializing server..."])
        break

      case "SERVE_READY":
        setEvent(["default", "Server intialized."])
        isReady.current = true
        break

      case "BUILD_PROJECT_START":
        setEvent(["default", "Building project..."])
        break

      case "BUILD_PROJECT_SUCCESS":
        setEvent(["default", "Project is ready."])
        break

      case "BUILD_PROJECT_FAILED":
        setEvent(["error", "Could not build project!"])
        break

      case "BUILD_MANIFEST_START":
        setEvent(["default", "Building manifest..."])
        break

      case "BUILD_MANIFEST_SUCCESS":
        setEvent(["default", "Manifest is ready."])
        break

      case "BUILD_MANIFEST_FAILED":
        setEvent(["error", "Could not build manifest!"])
        break

      case "BUILD_RPCS_START":
        setEvent(["default", `Building RPC's...`])
        break

      case "BUILD_RPCS_SUCCESS":
        setEvent(["default", "Server is ready."])
        break

      case "BUILD_RPCS_FAILED":
        setEvent(["error", `Could not build RPC's!`])
        break

      case "RPC_START":
        setEvent(["default", `Handling call to RPC: ${event.url}...`])
        break

      case "RPC_SUCCESS":
        setEvent([
          "default",
          `Handled call to RPC: {lastEvent.url}: {lastEvent.status}`,
        ])
        break

      case "RPC_FAILED":
        setEvent([
          "error",
          `Failed to handle call to RPC: {lastEvent.url}: {lastEvent.status}`,
        ])
        break

      default:
        if (command.debug) {
          console.log("unhandled event: ", event)
        }
    }
  }, [])

  const onChangeConnectionStatus = useCallback(
    (status: DevEventListenerConnectionStatus) => {
      if (command.debug) {
        console.log({ status })
      }

      if (!isReady.current) {
        return
      }

      switch (status) {
        case "CONNECTED":
          // we can safely ignore this
          break

        case "DISCONNECTED":
          setEvent(["error", "Disconnected from server process!"])
          process.exit(-1) // TODO: Kill child processes

        case "EMITTER_NOT_FOUND":
          setEvent(["error", "Could not find server process!"])
          process.exit(-1) // TODO: Kill child processes
      }
    },
    [],
  )

  useEffect(() => {
    const kill = spawnServerWatch(
      project.path,
      onEvent,
      onChangeConnectionStatus,
    )
    return () => kill()
  }, [])

  return (
    <Box flexDirection="column">
      <Text>samen-server @ {project.path}</Text>
      {event ? (
        <Text
          dimColor={event[0] === "dimmed"}
          color={event[0] === "error" ? "red" : undefined}
        >
          {event[1]}
        </Text>
      ) : (
        <Text dimColor>Initializing...</Text>
      )}
    </Box>
  )
}
