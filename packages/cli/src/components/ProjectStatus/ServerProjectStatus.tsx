import {
  addDevEventListener,
  ServerCommandServe,
  ServerDevEvent,
  ServerDevEventRPC,
} from "@samen/dev"
import { Box, Text } from "ink"
import path from "path"
import { useCallback, useEffect, useRef, useState } from "react"
import { spawnChildProcess } from "../../process"
import { ServerProject } from "../../types"
import ProjectStatus from "../ProjectStatus"
import ServerProjectStatusRequests from "./ServerProjectStatusRequests"

export default function ServerProjectStatus({
  project,
  command,
  maxProjectPathLength,
}: {
  project: ServerProject
  command: ServerCommandServe
  maxProjectPathLength: number
}) {
  const [status, setStatus] = useState<string>("Initializing...")
  const [isBuilding, setBuilding] = useState(true)
  const [error, setError] = useState<string>()

  const [requests, setRequests] = useState<ServerDevEventRPC[]>([])
  const oldRequests = useRef<ServerDevEventRPC[]>([])
  const addRequest = useCallback((addedRequest: ServerDevEventRPC) => {
    const newRequests = [...oldRequests.current]
    const index = newRequests.findIndex(
      (r) => r.requestId === addedRequest.requestId,
    )
    if (index === -1) {
      newRequests.push(addedRequest)
    } else {
      newRequests[index] = addedRequest
    }
    setRequests(newRequests)
    oldRequests.current = newRequests
  }, [])

  const onEvent = useCallback((event: ServerDevEvent) => {
    if (command.verbose) {
      console.log("server", event)
    }

    setError(undefined)

    switch (event.type) {
      case "LISTENER_CONNECTED":
      case "SERVE_INIT":
      case "SERVE_READY":
        setStatus("Initializing server...")
        setBuilding(true)
        break

      // TODO
      // case "BUILD_PROJECT_START":
      //   setStatus("Building project...")
      //   setBuilding(true)
      //   break

      case "BUILD_PROJECT_SUCCESS":
        setStatus("Project is built")
        setBuilding(false)
        break

      case "BUILD_PROJECT_FAILED":
        setStatus("Could not build project")
        setError(event.errorMessage)
        setBuilding(false)
        break

      case "BUILD_MANIFEST_START":
        setStatus("Building manifest...")
        setBuilding(true)
        break

      case "BUILD_MANIFEST_SUCCESS":
        setStatus("Manifest is generated")
        setBuilding(false)
        break

      case "BUILD_MANIFEST_FAILED":
        setStatus("Could not build manifest")
        setError(event.errorMessage)
        setBuilding(false)
        break

      case "BUILD_RPCS_START":
        setStatus(`Building RPC's...`)
        setBuilding(true)
        break

      case "BUILD_RPCS_SUCCESS":
        setStatus("Server is ready, waiting for changes.")
        setBuilding(false)
        break

      case "BUILD_RPCS_FAILED":
        setStatus(`Could not build RPC's`)
        setBuilding(false)
        break

      case "RPC_START":
        addRequest(event)
        break

      case "RPC_SUCCESS":
        addRequest(event)
        break

      case "RPC_FAILED":
        addRequest(event)
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
      "samen-server",
      ["serve", "--port", `${command.port}`],
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
        type="server"
        projectPath={project.path}
        status={isBuilding ? "busy" : error ? "error" : "default"}
        message={status}
        maxProjectPathLength={maxProjectPathLength}
      />

      {error ? (
        <Box paddingX={4} paddingTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : requests.length > 0 ? (
        <Box paddingX={4} paddingY={1}>
          <ServerProjectStatusRequests requests={requests} />
        </Box>
      ) : null}
    </Box>
  )
}
