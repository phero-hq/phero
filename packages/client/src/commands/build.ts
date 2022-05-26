import { ClientCommandBuild } from "@samen/dev"
import buildClient from "../utils/buildClient"

export default function build(command: ClientCommandBuild) {
  if ("path" in command.server) {
    console.log(`Building client from server at: ${command.server.path}`)
  } else if ("url" in command.server) {
    console.log(`Building client from server at: ${command.server.url}`)
  } else {
    throw new Error("unexpected server config")
  }

  buildClient(command.server)
    .then(() => console.log("Client is ready"))
    .catch(console.error)
}
