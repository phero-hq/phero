import path from "path"

export default function getManifestPath(): string {
  const manifestPathIndex = process.argv.indexOf("--manifest")
  if (manifestPathIndex === -1) {
    return path.join(process.cwd(), "samen-manifest.json")
  }
  const manifestPath = process.argv[manifestPathIndex + 1]
  if (!manifestPath) throw new Error(`No manifest found at ${manifestPath}`)
  return path.join(process.cwd(), manifestPath)
}
