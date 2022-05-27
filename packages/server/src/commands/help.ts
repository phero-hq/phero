import {
  ServerCommandHelp,
  ServerCommandName,
  serverHelp,
  serverHelpBuild,
  serverHelpServe,
} from "@samen/dev"

export default function help(command: ServerCommandHelp) {
  switch (command.command) {
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
