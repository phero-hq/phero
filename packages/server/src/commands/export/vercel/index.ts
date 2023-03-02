import { PheroApp, tsx } from "@phero/core"
import ts from "typescript"
import compileExportToJS from "../compileExportToJS"
import { Export, ExportBundle, ExportFile, MetaExportFiles } from "../domain"
import generateLibFile from "./generateLibFile"
import { generateServiceHandlerFile } from "./generateServiceHandlerFile"
import generateServiceIndexFile from "./generateServiceIndexFile"

export default function generateVercelExport(
  app: PheroApp,
  metaExportFiles: MetaExportFiles,
): Export {
  const bundles: ExportBundle[] = app.services.flatMap((service) => ({
    name: `.vercel/output/functions/${service.name}/[func].func`,
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
      {
        name: ".vc-config.json",
        content: `{
    "runtime": "nodejs16.x",
    "handler": "index.js",
    "maxDuration": 3,
    "launcherType": "Nodejs",
    "shouldAddHelpers": true,
    "shouldAddSourcemapSupport": true
}`,
      },
      ...Object.entries(metaExportFiles).map(
        ([name, content]: [string, string]) => ({ name, content }),
      ),
    ],
  }))

  const otherFiles: ExportFile[] = [
    {
      name: ".vercel/output/config.json",
      content: JSON.stringify({
        version: 3,
        routes: app.services.map((service) => ({
          src: `^/${service.name}/(?<func>[^/]+?)(?:/)?$`,
          dest: `/${service.name}/[func]?func=$func`,
        })),
      }),
    },
  ]

  return { bundles, otherFiles }
}
