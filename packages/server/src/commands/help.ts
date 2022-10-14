import {
  ServerCommandHelp,
  ServerCommandName,
  serverHelp,
  serverHelpExport,
  serverHelpBuild,
  serverHelpServe,
} from "@phero/dev"

export default function help(command: ServerCommandHelp) {
  switch (command.command) {
    case ServerCommandName.Export:
      console.log(serverHelpExport)
      break

    case ServerCommandName.Build:
      console.log(serverHelpBuild)
      break

    case ServerCommandName.Serve:
      console.log(serverHelpServe)
      break

    default:
      console.log(serverHelp)
      break
  }
  process.exit(0)
}
