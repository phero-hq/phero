import { ClientDevEvent, DevEventListenerConnectionStatus } from "@samen/core"
import { Box, Text } from "ink"
import { useCallback, useEffect, useRef, useState } from "react"
import { useCommand } from "../../context/CommandContext"
import { ClientProject } from "../../utils/getProjects"
import { spawnClientWatch } from "../../utils/processes"

type StyledEvent = ["default" | "error" | "dimmed", string]

export default function ClientProjectStatus({
  project,
}: {
  project: ClientProject
}) {
  const [event, setEvent] = useState<StyledEvent>()
  const isReady = useRef(false)
  const command = useCommand()

  const onEvent = useCallback((event: ClientDevEvent) => {
    if (command.debug) {
      console.log({ event })
    }

    switch (event.type) {
      case "WATCH_INIT":
        setEvent(["default", "Initializing client watch server..."])
        break

      case "WATCH_READY":
        setEvent(["default", "Client watch server ready."])
        isReady.current = true
        break

      case "SERVER_CONNECTED":
        setEvent(["default", "Connected to server, watching for changes..."])
        break

      case "SERVER_DISCONNECTED":
        setEvent(["error", "Disconnected from server!"])
        break

      case "SERVER_NOT_FOUND":
        setEvent(["error", "Could not find server!"])
        break

      case "BUILD_START":
        setEvent(["default", "Building client..."])
        break

      case "BUILD_SUCCESS":
        setEvent(["default", "Client is ready."])
        break

      case "BUILD_FAILED":
        setEvent(["error", "Build failed!"])
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
          setEvent(["error", "Disconnected from client process!"])
          process.exit(-1) // TODO: Kill child processes

        case "EMITTER_NOT_FOUND":
          setEvent(["error", "Could not find client process!"])
          process.exit(-1) // TODO: Kill child processes
      }
    },
    [],
  )

  useEffect(() => {
    const kill = spawnClientWatch(
      project.path,
      onEvent,
      onChangeConnectionStatus,
    )
    return () => kill()
  }, [])

  return (
    <Box flexDirection="column">
      <Text>samen-client @ {project.path}</Text>
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
