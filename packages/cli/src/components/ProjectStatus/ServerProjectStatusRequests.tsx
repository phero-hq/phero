import { ServerDevEventRPC } from "@samen/dev"
import { Box, Text } from "ink"
import { useMemo } from "react"
import maxLength from "../../utils/maxLength"
import ActivityIndicator from "../ActivityIndicator"

interface Props {
  requests: ServerDevEventRPC[]
}

export default function ServerProjectStatusRequests({ requests }: Props) {
  const maxAmount = 5
  const lastRequests = useMemo(() => requests.slice(-maxAmount), [requests])

  const maxRequestIdLength = useMemo(() => {
    return maxLength(lastRequests.map((r) => r.requestId))
  }, [lastRequests])

  const maxUrlLength = useMemo(() => {
    return maxLength(lastRequests.map((r) => r.url))
  }, [lastRequests])

  return (
    <Box flexDirection="column" justifyContent="flex-start">
      {lastRequests.map((request) => (
        <Box key={request.requestId}>
          <Box width={maxRequestIdLength} marginRight={1}>
            <Text dimColor>{request.requestId}</Text>
          </Box>
          <Text dimColor>{`${request.dateTime} `}</Text>

          <Box flexDirection="column">
            {request.type === "RPC_START" && (
              <Box>
                <ActivityIndicator />
                <Box width={maxUrlLength} marginX={1}>
                  <Text>{request.url}</Text>
                </Box>
              </Box>
            )}

            {request.type === "RPC_SUCCESS" && (
              <Box>
                <Text color="green">✓</Text>
                <Box width={maxUrlLength} marginX={1}>
                  <Text>{request.url}</Text>
                </Box>
                <Text dimColor>{request.ms}ms</Text>
              </Box>
            )}

            {request.type === "RPC_FAILED" && (
              <>
                <Box>
                  <Text color="red">✖</Text>
                  <Box width={maxUrlLength} marginX={1}>
                    <Text>{request.url}</Text>
                  </Box>
                  <Text dimColor>{request.ms}ms </Text>
                </Box>
                <Box marginLeft={2}>
                  <Text color="red">
                    {JSON.stringify(request.errorMessage)}
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
