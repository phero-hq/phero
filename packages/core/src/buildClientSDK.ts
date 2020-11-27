import { promises as fs } from "fs";
import { Project } from "ts-morph";
import { JSType, JSValue, RPCFunction, SamenFile } from "./tmp";
import { formatCode } from "./utils";

export default async function buildClientSDK(
  manifestPath: string,
  targetPath: string
): Promise<void> {
  const project = new Project({
    compilerOptions: { declaration: true, outDir: targetPath },
  });
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
  const source = formatCode(genSource(manifest));
  console.log(source);
  project.createSourceFile("index.ts", source);
  await project.emit();
}

const genSource = (manifest: SamenFile): string => `
  import request from './request';

  ${Object.keys(manifest.models).map(
    (modelId) => `export ${manifest.models[modelId].ts}`
  )}

  ${manifest.rpcFunctions.map(genRPC)}
`;

const genRPC = (rpc: RPCFunction): string => {
  const { name } = rpc;
  const params = rpc.parameters.map((p) => `${p.name}: ${genType(p.value)}`);
  const body = `{${rpc.parameters.map((p) => p.name).join(",")}}`;
  const returnType = genType(rpc.returnType);
  const isVoid = rpc.returnType.type === JSType.untyped ? "true" : "false";

  return `
    export async function ${name}(${params}): Promise<${returnType}> {
      return request("${name}", ${body}, ${isVoid});
    }
  `;
};

const genType = (value: JSValue): string => {
  switch (value.type) {
    case JSType.number:
    case JSType.string:
    case JSType.boolean:
    case JSType.null:
    case JSType.undefined:
      return value.type;

    case JSType.modelRef:
      return value.id;

    case JSType.array:
      return `${value.elementType}[]`;

    case JSType.tuple:
      return `[${value.elementTypes.map(genType).join(", ")}]`;

    case JSType.date:
      return "Date";

    case JSType.oneOfTypes:
      return `${value.oneOfTypes.map(genType).join(" | ")}`;

    case JSType.object:
      return `{${value.properties
        .map((p) => `${p.name}: ${genType(p)}`)
        .join(";")}}`;

    case JSType.untyped: // TODO: any? unknown?
      throw new Error(`Not implemented: ${value.type}`);
  }
};
