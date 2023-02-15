import { ParseError, Parser, ParseResult } from "../Parser"

type PropParser = [name: string, optional: boolean, parser: Parser<any>]
type KeyParser = [key: Parser<any>, optional: boolean, parser: Parser<any>]

export default function ObjectLiteralParser<T>(
  ...shape: Array<PropParser | KeyParser>
): Parser<T> {
  const { props, keys } = shape.reduce<{
    props: PropParser[]
    keys: KeyParser[]
  }>(
    ({ props, keys }, [propOrKey, optional, parser]) =>
      typeof propOrKey === "string"
        ? { keys, props: [...props, [propOrKey, optional, parser]] }
        : { props, keys: [...keys, [propOrKey, optional, parser]] },
    { props: [], keys: [] },
  )

  return (data: unknown): ParseResult<T> => {
    const result: any = {}
    const errors: ParseError[] = []

    if (typeof data === "object" && data !== null) {
      if (keys.length) {
        const propNames = props.map((p) => p[0])
        for (const propName of Object.getOwnPropertyNames(data)) {
          if (propNames.includes(propName)) {
            continue
          }
          const isValidKey = keys.some(
            ([keyParser, optional, parser]) =>
              keyParser(propName).ok &&
              ((optional && (data as any)[propName] === undefined) ||
                parser((data as any)[propName]).ok),
          )
          if (isValidKey) {
            result[propName] = (data as any)[propName]
          } else {
            errors.push({
              path: propName,
              message: "Property incorrect",
            })
          }
        }
      }
      if (props.length) {
        for (const [propName, optional, parser] of props) {
          if (optional && (data as any)[propName] === undefined) {
            continue
          }
          const propParseResult = parser((data as any)[propName])
          if (errors.length === 0 && propParseResult.ok) {
            result[propName] = propParseResult.result
          } else if (!propParseResult.ok) {
            errors.push({
              path: propName,
              message: "Property incorrect",
              errors: propParseResult.errors,
            })
          }
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
