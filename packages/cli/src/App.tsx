import { ClientDevEvent, ServerDevEvent } from "@samen/core"
import { Box, Spacer, Text } from "ink"
import { useCallback, useEffect, useMemo, useState } from "react"
import FullScreen, { useScreenSize } from "./FullScreen"
import getProjects, {
  ClientProject,
  Project,
  ServerProject,
} from "./utils/getProjects"
import { spawnClientWatch, spawnServerWatch } from "./utils/processes"

export default function App() {
  return (
    <FullScreen>
      <AppContent />
    </FullScreen>
  )
}

function ClientProjectStatus({ project }: { project: ClientProject }) {
  const [lastEvent, setLastEvent] = useState<ClientDevEvent>()

  useEffect(() => {
    const kill = spawnClientWatch(project.path, setLastEvent)
    return () => kill()
  }, [])

  const eventContent = useMemo(() => {
    switch (lastEvent?.type) {
      case "BUILD_START":
        return <Text>Building client...</Text>

      case "BUILD_SUCCESS":
        return <Text>Client is ready.</Text>

      case "BUILD_FAILED":
        return <Text color="red">Build failed!</Text>

      case "SERVER_CONNECTED":
        return <Text>Connected to server, watching for changes...</Text>

      case "SERVER_DISCONNECTED":
        return <Text color="red">Disconnected from server!</Text>

      case "SERVER_NOT_FOUND":
        return <Text color="red">Could not find server!</Text>

      case "WATCH_INIT":
        return <Text>Initializing watch process...</Text>

      case "WATCH_READY":
        return <Text>Watch process ready, watching for changes...</Text>

      case undefined:
        return null

      default:
        return <Text dimColor>{JSON.stringify(lastEvent)}</Text>
    }
  }, [lastEvent])

  return (
    <Box flexDirection="column">
      <Text>samen-client @ {project.path}</Text>
      {eventContent}
    </Box>
  )
}

function ServerProjectStatus({ project }: { project: ServerProject }) {
  const [lastEvent, setLastEvent] = useState<ServerDevEvent>()

  useEffect(() => {
    const kill = spawnServerWatch(project.path, setLastEvent)
    return () => kill()
  }, [])

  const eventContent = useMemo(() => {
    switch (lastEvent?.type) {
      case "SERVE_INIT":
        return <Text>Initializing server...</Text>

      case "SERVE_READY":
        return <Text>Server intialized.</Text>

      case "LISTENER_CONNECTED":
        return <Text>Listener connected.</Text>

      case "BUILD_MANIFEST_START":
        return <Text>Building manifest...</Text>

      case "BUILD_MANIFEST_SUCCESS":
        return <Text>Manifest is ready.</Text>

      case "BUILD_MANIFEST_FAILED":
        return <Text color="red">Could not build manifest!</Text>

      case "BUILD_RPCS_START":
        return <Text>Building RPC's...</Text>

      case "BUILD_RPCS_SUCCESS":
        return <Text>Server is ready.</Text>

      case "BUILD_RPCS_FAILED":
        return <Text color="red">Could not build RPC's!</Text>

      case "RPC_START":
        return <Text>Handling call to RPC: {lastEvent.url}...</Text>

      case "RPC_SUCCESS":
        return (
          <Text>
            Handled call to RPC: {lastEvent.url}: {lastEvent.status}
          </Text>
        )

      case "RPC_FAILED":
        return (
          <Text>
            Failed to handle call to RPC: {lastEvent.url}: {lastEvent.status}
          </Text>
        )

      case undefined:
        return null

      default:
        return <Text dimColor>{JSON.stringify(lastEvent)}</Text>
    }
  }, [lastEvent])

  return (
    <Box flexDirection="column">
      <Text>samen-server @ {project.path}</Text>
      {eventContent}
    </Box>
  )
}

function AppContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const { orientation, columns, rows } = useScreenSize()

  const updateProjects = useCallback(async () => {
    setProjects(await getProjects())
  }, [])

  useEffect(() => {
    const interval = setInterval(updateProjects, 10000)
    updateProjects()
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {projects.length === 0 ? (
        <Text>No projects found</Text>
      ) : (
        <Box
          width={columns}
          height={rows}
          flexDirection={orientation === "portrait" ? "column" : "row"}
        >
          {projects.map((project) => (
            <Box
              key={project.path}
              flexGrow={1}
              flexBasis="100%"
              alignItems="center"
              padding={2}
              borderStyle="round"
              borderColor="blue"
            >
              {project.type === "client" && (
                <ClientProjectStatus project={project} />
              )}
              {project.type === "server" && (
                <ServerProjectStatus project={project} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  )
}
