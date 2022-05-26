import { addDevEventListener, ServerCommandServe } from "@samen/dev"
import DevServer from "./DevServer"

export default function serve(command: ServerCommandServe) {
  if (command.verbose) {
    addDevEventListener(
      `http://localhost:${command.port}`,
      console.log,
      console.log,
    )
  }
  const devServer = new DevServer(command, process.cwd())
}
