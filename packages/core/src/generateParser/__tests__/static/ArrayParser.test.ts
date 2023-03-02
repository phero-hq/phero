import ArrayParser from "../../static/ArrayParser"
import StringParser from "../../static/StringParser"

describe("ArrayParser", () => {
  test("string[]", () => {
    expect(ArrayParser(StringParser)(["a", "b"])).toEqual({
      ok: true,
      result: ["a", "b"],
    })
  })
  test("string[][]", () => {
    expect(
      ArrayParser(ArrayParser(StringParser))([
        ["a", "b"],
        ["c", "d"],
      ]),
    ).toEqual({
      ok: true,
      result: [
        ["a", "b"],
        ["c", "d"],
      ],
    })
  })
  test("string[][]", () => {
    expect(ArrayParser(ArrayParser(StringParser))([])).toEqual({
      ok: true,
      result: [],
    })
  })
  test("string[][]", () => {
    expect(ArrayParser(ArrayParser(StringParser))([[], []])).toEqual({
      ok: true,
      result: [[], []],
    })
  })
  test("string[][]", () => {
    expect(
      ArrayParser(ArrayParser(StringParser))([
        ["a", "b", 1],
        ["c", "d"],
      ]),
    ).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: "0",
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: "2",
            }),
          ]),
        }),
      ]),
    })
  })
})
