import { ServerDevEventRPC } from "@samen/dev"
import { Box, Text } from "ink"
import ActivityIndicator from "../ActivityIndicator"

interface Props {
  requests: ServerDevEventRPC[]
}

export default function ServerProjectStatusRequests({ requests }: Props) {
  const maxAmount = 5
  const lastRequests = requests.slice(-maxAmount)

  return (
    <Box flexDirection="column" justifyContent="flex-start">
      {lastRequests.map((request) => (
        <Box key={request.requestId}>
          <Text dimColor>{`${request.requestId} `}</Text>

          {request.type === "RPC_START" && (
            <Text>
              <ActivityIndicator />
              {` ${request.url}`}
            </Text>
          )}

          {request.type === "RPC_SUCCESS" && (
            <Text>
              <Text color="green">✓</Text>
              {` ${request.url}`}
            </Text>
          )}

          {request.type === "RPC_FAILED" && (
            <Text>
              <Text color="red">✖</Text>
              {` ${request.url} `}
              <Text color="red">{JSON.stringify(request.errorMessage)}</Text>
            </Text>
          )}
        </Box>
      ))}
    </Box>
  )
}
