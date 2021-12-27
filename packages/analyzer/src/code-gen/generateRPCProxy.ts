import { ServerSource } from "../generateClient"
import generateParser from "./parsers/generateParser"
import generateModelParser from "./parsers/generateParser"

export default function generateRPCProxy(serverSource: ServerSource): string {
  // const funcProxies = serverSource.services.flatMap(service => service.functions.map(func => generateFunctionProxy(service.name, func)))

  // serverSource.domainModels.map((model) => generateParser(model))
  // generateModelParser()

  return ""
}
