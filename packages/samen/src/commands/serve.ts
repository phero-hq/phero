import http from "http"
import path from "path"
import { promises as fs } from "fs"
import { RPCFunction, SamenManifest } from "@samen/core/build/domain/manifest"

const PORT = parseInt(process.env.PORT || "") || 4000

type Routes = Record<string, RPCFunction>
let routes: Routes = {}

export default async function serve() {
  const server = http.createServer()
  const manifest = await getManifest()

  routes = manifest.rpcFunctions.reduce(
    (result, rpc) => ({ ...result, [`/${rpc.name}`]: rpc }),
    {},
  )

  server.on("request", requestListener())
  server.on("listening", () => {
    console.log(`SamenRPC listening on port ${PORT}`)
    console.log({ routes })
  })

  server.listen(PORT)
}

async function getManifest(): Promise<SamenManifest> {
  const manifestPath = path.join(__dirname, "../build/samen-manifest.json")
  const manifestFile = await fs.readFile(manifestPath)

  if (!manifestFile) {
    throw new Error(`Manifest file not found at ${manifestPath}`)
  }

  return (manifestFile as unknown) as SamenManifest
}

function requestListener() {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST")
    res.setHeader("Access-Control-Allow-Headers", "content-type")

    console.log("REQUEST", req.method, req.url)
    if (req.method === "OPTIONS") {
      res.statusCode = 200
      res.end()
      return
    }

    if (req.method === "POST") {
      res.setHeader("Content-Type", "application/json")

      if (req.url) {
        const rpcDef = routes[req.url]
        if (rpcDef) {
          try {
            const body = await readBody(req)
            console.log({ body })
            // delete require.cache[require.resolve(rpcDef.buildPath)]
            // const rpc = require(rpcDef.buildPath)[rpcDef.name]
            // const responseData = await rpc(body && JSON.parse(body))
            // console.log("responseData", responseData)
            // if (responseData) {
            //   res.statusCode = 200
            //   res.write(JSON.stringify(responseData))
            // } else {
            res.statusCode = 204
            // }
          } catch (e) {
            res.statusCode = 500
            console.error(e)
            res.write(JSON.stringify({ error: e.message }))
          } finally {
            res.end()
            return
          }
        }
      }
    }

    res.statusCode = 404
    res.write(`{ "error": "RPC not found" }`)
    res.end()
  }
}
function readBody(request: http.IncomingMessage): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    request
      .on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      .on("end", () => {
        resolve(Buffer.concat(chunks).toString())
      })
      .on("error", (err: Error) => {
        reject(err)
      })
  })
}
