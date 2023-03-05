import { type ParseResult } from "../../domain/Parser"

export default function BigIntParser(data: unknown): ParseResult<bigint> {
  // BigInt's are serialized as string (obviously it wouldn't fit into a number)
  if (typeof data === "string") {
    try {
      return { ok: true, result: BigInt(data) }
    } catch {
      // ignore
    }
  }

  return { ok: false, errors: [{ message: "Not a BigInt" }] }
}
