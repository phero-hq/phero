import { ParseResult } from "../Parser"

export default function DateParser(data: unknown): ParseResult<Date> {
  return data instanceof Date ||
    (typeof data === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data))
    ? { ok: true, result: new Date(data) }
    : {
        ok: false,
        errors: [{ message: `Not a Date` }],
      }
}
