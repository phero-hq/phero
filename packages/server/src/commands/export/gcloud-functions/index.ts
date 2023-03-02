import { PheroApp } from "@phero/core"
import compileExportToJS from "../compileExportToJS"
import { Export, ExportBundle, MetaExportFiles } from "../domain"
import generateLibFile from "./generateLibFile"
import { generateServiceHandlerFile } from "./generateServiceHandlerFile"
import generateServiceIndexFile from "./generateServiceIndexFile"

export default function generateGCloudFunctionsExport(
  app: PheroApp,
  metaExportFiles: MetaExportFiles,
): Export {
  const packageJson = JSON.parse(metaExportFiles["package.json"])

  if (
    !packageJson?.dependencies?.["@google-cloud/functions-framework"] &&
    !packageJson?.devDependencies?.["@google-cloud/functions-framework"]
  ) {
    throw new Error(
      `You should install the dependency "@google-cloud/functions-framework" in your project.`,
    )
  }

  const bundles: ExportBundle[] = app.services.map((service) => ({
    name: service.name,
    files: [
      ...compileExportToJS([
        {
          name: "lib.ts",
          nodes: generateLibFile(),
          isRoot: true,
        },
        {
          name: "handler.ts",
          nodes: generateServiceHandlerFile(service),
          isRoot: true,
        },
        {
          name: "index.ts",
          nodes: generateServiceIndexFile(service),
          isRoot: true,
        },
      ]),
      ...Object.entries(metaExportFiles).map(
        ([name, content]: [string, string]) => ({ name, content }),
      ),
    ],
  }))

  return { bundles }
}
