import {
  ServerCommandHelp,
  ServerCommandName,
  serverHelp,
  serverHelpExport,
  serverHelpServe,
} from "@samen/dev"

export default function help(command: ServerCommandHelp) {
  switch (command.command) {
    case ServerCommandName.Export:
      console.log(serverHelpExport)
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
