import {
  SamenCommandHelp,
  SamenCommandName,
  samenHelp,
  samenHelpInit,
} from "@samen/dev"

export default function help(command: SamenCommandHelp) {
  switch (command.command) {
    case SamenCommandName.Init:
      console.log(samenHelpInit)
      break

    default:
      console.log(samenHelp)
      break
  }

  process.exit(0)
}
