import { addDevEventListener, ServerCommandServe } from "@samen/dev"
import DevServer from "./DevServer"

export default function serve(command: ServerCommandServe) {
  if (command.verbose) {
    const eventUrl = `http://localhost:${command.port}`

    addDevEventListener(
      eventUrl,
      (event) => {
        console.log(event)
      },
      () => {
        console.log("Listener to samen-server process connected")
      },
      (error) => {
        console.error(`Could not connect to event emitter at ${eventUrl}`)
        console.error(error)
      },
    )
  }
  new DevServer(command, process.cwd()).start()
}
