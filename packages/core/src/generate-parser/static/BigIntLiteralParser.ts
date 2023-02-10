import { Parser, ParseResult } from "../Parser"

export default function BigIntLiteralParser<T extends bigint>(
  values: bigint[],
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    // BigInt's are serialized as string (obviously it wouldn't fit into a number)
    if (typeof data === "string") {
      try {
        const result = BigInt(data)

        if (values.includes(result)) {
          return { ok: true, result: result as T }
        }
      } catch {
        // ignore
      }
    }

    return {
      ok: false,
      errors: [{ message: `Not one of (${values.join("n, ") + "n"})` }],
    }
  }
}
