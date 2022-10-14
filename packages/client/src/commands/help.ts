import {
  ClientCommandHelp,
  ClientCommandName,
  clientHelp,
  clientHelpBuild,
  clientHelpWatch,
} from "@phero/dev"

export default function help(command: ClientCommandHelp) {
  switch (command.command) {
    case ClientCommandName.Build:
      console.log(clientHelpBuild)
      break

    case ClientCommandName.Watch:
      console.log(clientHelpWatch)
      break

    default:
      console.log(clientHelp)
      break
  }
  process.exit(0)
}
