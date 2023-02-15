import { ParseResult } from "../../domain/Parser"

export default function DateParser(data: unknown): ParseResult<Date> {
  if (
    typeof data === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data)
  ) {
    return { ok: true, result: new Date(data) }
  }

  return {
    ok: false,
    errors: [{ message: `Not a Date` }],
  }
}
