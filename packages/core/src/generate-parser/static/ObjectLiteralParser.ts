import { ParseError, Parser, ParseResult } from "../Parser"

export default function ObjectLiteralParser<T>(
  ...shape: Array<
    | [name: string, optional: boolean, parser: Parser<any>]
    | [key: Parser<any>, optional: boolean, parser: Parser<any>]
  >
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    const result: any = {}
    const errors: ParseError[] = []

    if (typeof data === "object" && data !== null) {
      // TODO implement optional
      for (const [nameOrKey, optional, propParser] of shape) {
        if (typeof nameOrKey === "string") {
          const propParseResult = propParser((data as any)[nameOrKey])
          if (errors.length === 0 && propParseResult.ok) {
            result[nameOrKey] = propParseResult.result
          } else if (!propParseResult.ok) {
            errors.push({
              path: nameOrKey,
              message: "Property incorrect",
              errors: propParseResult.errors,
            })
          }
        } else {
          throw new Error("TODO implement keyparser")
        }
      }
    } else {
      errors.push({
        message: "Not an object",
      })
    }

    return errors.length === 0 ? { ok: true, result } : { ok: false, errors }
  }
}
