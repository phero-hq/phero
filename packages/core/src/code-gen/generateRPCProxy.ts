import ts from "typescript"
import { ParsedAppDeclarationVersion } from ".."
import generateParser, { generateRPCParser } from "./parsers/generateParser"
import generateModelParser from "./parsers/generateParser"

export default function generateRPCProxy(
  appDeclrationVersion: ParsedAppDeclarationVersion,
  typeChecker: ts.TypeChecker,
): string {
  // generateRPCParser(serverSource.services[0].functions[0], typeChecker)
  // generateRPCParser(serverSource.services[0].functions[1], typeChecker)
  const modelParsers = appDeclrationVersion.services[0].models.map((m) => {
    return generateModelParser(m, typeChecker)
  })
  // serverSource.domainModels.forEach(m => {
  //   console.log("domain model", m.name)
  // })
  const rpcParsers = generateRPCParser(
    appDeclrationVersion.services[0].functions[2],
    typeChecker,
  )

  // console.log("modelParsers", modelParsers)
  // console.log("rpcParsers", rpcParsers)

  // generateRPCParser(
  //   serverSource.services[0].functions[2],
  //   typeChecker,
  // )
  // const parsers = func.parameters.forEach((p) => {
  //   if (p.type) {
  //     /// Generate a proxy here
  //     const x = generateModelParser(p.type, typeChecker)
  //     console.log(`parameter`, printCode(p))
  //     console.log(`parser`, printCode(x))
  //   }
  // })

  // const funcProxies = serverSource.services.flatMap(service => service.functions.map(func => generateFunctionProxy(service.name, func)))

  // serverSource.domainModels.map((model) => generateParser(model))
  // generateModelParser()
  // console.log("XX")
  return ""
}
