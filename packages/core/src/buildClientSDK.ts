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
  const params = rpc.parameters.map((p) => `${p.name}: ${genJsValue(p.value)}`);
  const body = `{${rpc.parameters.map((p) => p.name).join(",")}}`;
  const returnType = genJsValue(rpc.returnType);
  const isVoid = rpc.returnType.type === JSType.untyped ? "true" : "false";

  return `
    export async function ${name}(${params}): Promise<${returnType}> {
      return request("${name}", ${body}, ${isVoid});
    }
  `;
};

const genJsValue = (value: JSValue): string => {
  switch (value.type) {
    case JSType.number:
    case JSType.string:
    case JSType.boolean:
    case JSType.null:
    case JSType.undefined:
      return value.type;

    case JSType.untyped:
    case JSType.object:
    case JSType.array:
    case JSType.date:
    case JSType.oneOfTypes:
    case JSType.tuple:
    case JSType.modelRef:
      throw new Error(`Not implemented: ${value.type}`);
  }
};
