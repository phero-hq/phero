import { addDevEventListener, ClientCommandWatch } from "lib"
import ClientWatchServer from "../ClientWatchServer"

export default function watch(command: ClientCommandWatch) {
  if (command.verbose) {
    const eventUrl = `http://localhost:${command.port}`

    addDevEventListener(
      eventUrl,
      (event) => {
        console.log(event)
      },
      () => {
        console.log("Listener to phero-client process connected")
      },
      (error) => {
        console.error(`Could not connect to event emitter at ${eventUrl}`)
        console.error(error)
      },
    )
  }
  const watchServer = new ClientWatchServer(command)
}
