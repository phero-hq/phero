import { addDevEventListener, ClientCommandWatch } from "@samen/dev"
import ClientWatchServer from "../ClientWatchServer"

export default function watch(command: ClientCommandWatch) {
  if (command.verbose) {
    addDevEventListener(
      `http://localhost:${command.port}`,
      console.log,
      console.log,
    )
  }
  const watchServer = new ClientWatchServer(command)
}
