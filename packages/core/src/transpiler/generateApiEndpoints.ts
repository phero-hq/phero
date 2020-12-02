import { FunctionDeclaration, Project, SourceFile, SymbolFlags } from "ts-morph"
import { RPCFunction, SamenManifest } from "../domain/manifest"
import { formatCode, generateParameters, generateType } from "./utils"

export default async function generateApiEndpoints(
  manifest: SamenManifest,
  samenFile: SourceFile,
  targetPath: string,
): Promise<void> {
  const project = new Project({
    compilerOptions: { outDir: targetPath, declaration: true },
  })

  for (const rpc of manifest.rpcFunctions) {
    const fileName = `${rpc.name}.ts`
    const code = generateCode(manifest, samenFile, rpc)
    project.createSourceFile(fileName, code)
  }

  await project.emit()
}

function generateCode(
  manifest: SamenManifest,
  samenFile: SourceFile,
  rpc: RPCFunction,
): string {
  const params = generateParameters(rpc.parameters)
  const returnType = `Promise<${generateType(rpc.returnType)}>`

  return formatCode(`
    ${rpc.modelIds.map((modelId) => manifest.models[modelId].ts).join("\n")}

    export default async function(${params}): ${returnType} {
      // TODO: Validate parameters

      const result = await ${rpc.name}(...arguments)

      // TODO: Validate result

      return result
    }

    ${getFunctionText(samenFile, rpc.name)}
  `)
}

function getFunctionText(samenFile: SourceFile, functionName: string): string {
  const foundFunction = samenFile
    .getExportSymbols()
    .reduce((result, exportSymbol) => {
      if (result) return result

      const symbol = exportSymbol.isAlias()
        ? exportSymbol.getAliasedSymbolOrThrow()
        : exportSymbol

      if (
        symbol.getFlags() & SymbolFlags.Function &&
        symbol.getName() === functionName
      ) {
        return symbol.getValueDeclarationOrThrow() as FunctionDeclaration
      }
    }, undefined as FunctionDeclaration | undefined)

  if (!foundFunction) {
    throw new Error(`Function not found by name: ${functionName}`)
  }

  return foundFunction.getText()
}
