import { PheroApp, tsx } from "@phero/core"
import ts from "typescript"
import compileExportToJS from "../compileExportToJS"
import { Export, ExportBundle, ExportFile, MetaExportFiles } from "../domain"
import generateLibFile from "./generateLibFile"
import { generateServiceHandlerFile } from "./generateServiceHandlerFile"
import generateServiceIndexFile from "./generateServiceIndexFile"

const vercelExportPath = 'dist/.phero-vercel';

export default function generateVercelExport(
  app: PheroApp,
  metaExportFiles: MetaExportFiles,
): Export {
  const bundles: ExportBundle[] = app.services.flatMap((service) => ({
    name: `${vercelExportPath}/${service.name}`,
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
          nodes: generateServiceIndexFile(),
          isRoot: true,
        },
      ]),
      ...Object.entries(metaExportFiles).map(
        ([name, content]: [string, string]) => ({ name, content }),
      ),
    ],
  }))

  const otherFiles: ExportFile[] = [
    {
      name: `${vercelExportPath}/vercel.json`,
      content: JSON.stringify({
        // version: 3,
        routes: app.services.map((service) => ({
          src: `^/${service.name}/(?<func>[^/]+?)(?:/)?$`,
          dest: `/${vercelExportPath}/${service.name}/index.js?func=$func`,
        })),
        builds: app.services.map((service) => ({
          src: `/${vercelExportPath}/${service.name}/index.js`,
          use: '@vercel/node'
        })),
      }),
    },
  ]

  return { bundles, otherFiles }
}
