import { ClientEvent, startSpinner } from "@samen/core"
import EventSource from "eventsource"

export default async function watch(
  build: () => Promise<void>,
  watchUrl?: string,
) {
  const url = watchUrl ?? "http://localhost:4000/watch"

  if (!url.startsWith("http")) {
    throw new Error("Watching based on file location is not supported")
  }

  const spinner = startSpinner(`Connecting to server`)
  const eventSource = new EventSource(url)

  let didConnect = false
  eventSource.onopen = () => {
    didConnect = true
  }

  eventSource.onmessage = async (message) => {
    switch (message.data) {
      case ClientEvent.ClientDidRegister:
        spinner.succeed(`Connected to server`)
        break
      case ClientEvent.ManifestDidCHange:
        await build()
        break
    }
  }

  eventSource.onerror = (error) => {
    if (didConnect) {
      spinner.warn("Server disconnected, reconnecting...")
    } else {
      spinner.warn(`Could not connect to server at ${url}, retrying...`)
    }
  }
}
