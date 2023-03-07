import { addDevEventListener, ServerCommandServe } from "lib"
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
        console.log("Listener to phero-server process connected")
      },
      (error) => {
        console.error(`Could not connect to event emitter at ${eventUrl}`)
        console.error(error)
      },
    )
  }
  new DevServer(command, process.cwd()).start()
}
