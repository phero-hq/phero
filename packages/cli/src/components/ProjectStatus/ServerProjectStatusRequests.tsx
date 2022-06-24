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
      {lastRequests.map((request) => {
        const url = request.url.replace(/^\//, "").replace(/\//g, ".")

        return (
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
                    <Text>{url}</Text>
                  </Box>
                </Box>
              )}

              {request.type === "RPC_SUCCESS" && (
                <Box>
                  <Text color="green">✓</Text>
                  <Box width={maxUrlLength} marginX={1}>
                    <Text>{url}</Text>
                  </Box>
                  <Text dimColor>{request.ms}ms</Text>
                </Box>
              )}

              {request.type === "RPC_FAILED_NOT_FOUND_ERROR" && (
                <>
                  <Box>
                    <Text color="red">✖</Text>
                    <Box width={maxUrlLength} marginX={1}>
                      <Text>{url}</Text>
                    </Box>
                    <Text dimColor>{request.ms}ms </Text>
                  </Box>
                  <Box marginTop={1} marginLeft={2} marginBottom={1}>
                    <Text color="red">Function not found</Text>
                  </Box>
                </>
              )}

              {request.type === "RPC_FAILED_VALIDATION_ERROR" && (
                <>
                  <Box>
                    <Text color="red">✖</Text>
                    <Box width={maxUrlLength} marginX={1}>
                      <Text>{url}</Text>
                    </Box>
                    <Text dimColor>{request.ms}ms</Text>
                  </Box>

                  <Box marginTop={1} marginLeft={2} flexDirection="column">
                    <Box marginBottom={1}>
                      <Text color="red">
                        {request.errors.length === 1
                          ? "Validation error"
                          : "Validation errors"}
                      </Text>
                    </Box>

                    <KeyValueTable
                      content={request.errors.reduce(
                        (result, error) => ({
                          ...result,
                          [error.path]: error.message,
                        }),
                        {},
                      )}
                    />
                  </Box>
                </>
              )}

              {request.type === "RPC_FAILED_FUNCTION_ERROR" && (
                <>
                  <Box>
                    <Text color="red">✖</Text>
                    <Box width={maxUrlLength} marginX={1}>
                      <Text>{url}</Text>
                    </Box>
                    <Text dimColor>{request.ms}ms</Text>
                  </Box>

                  <Box marginTop={1} marginLeft={2} flexDirection="column">
                    <Box marginBottom={1}>
                      <Text color="red">{request.error.name}</Text>
                    </Box>

                    <Box marginBottom={1}>
                      <KeyValueTable content={request.error.props} />
                    </Box>

                    <Box marginBottom={1}>
                      <Text>{request.error.stack}</Text>
                    </Box>
                  </Box>
                </>
              )}

              {request.type === "RPC_FAILED_SERVER_ERROR" && (
                <>
                  <Box>
                    <Text color="red">✖</Text>
                    <Box width={maxUrlLength} marginX={1}>
                      <Text>{url}</Text>
                    </Box>
                    <Text dimColor>{request.ms}ms</Text>
                  </Box>

                  <Box marginTop={1} marginLeft={2} marginBottom={1}>
                    <Text>{request.error.stack}</Text>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

function KeyValueTable({ content }: { content: Record<string, any> }) {
  const entries = Object.entries(content)
  const maxLabelLength = maxLength(entries.map(([k]) => k))
  const format = (value: any) => {
    switch (typeof value) {
      case "undefined":
        return "undefined"

      case "string":
        return value

      case "number":
        return `${value}`

      default:
        return JSON.stringify(value)
    }
  }

  return (
    <Box flexDirection="column">
      {entries.map(([key, value], index) => (
        <Box key={index}>
          <Box width={maxLabelLength} marginRight={2}>
            <Text dimColor>{format(key)}</Text>
          </Box>
          <Text>{format(value)}</Text>
        </Box>
      ))}
    </Box>
  )
}
