import { ParseResult } from "../../domain/Parser"

export default function BooleanParser(data: unknown): ParseResult<boolean> {
  return typeof data === "boolean"
    ? { ok: true, result: data }
    : { ok: false, errors: [{ message: "Not a boolean" }] }
}
