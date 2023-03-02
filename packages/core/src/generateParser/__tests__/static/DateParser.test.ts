import DateParser from "../../static/DateParser"

describe("DateParser", () => {
  test("Date", () => {
    const date = new Date()
    expect(DateParser(date.toJSON())).toEqual({
      ok: true,
      result: date,
    })
  })
  test("number", () => {
    expect(DateParser(123).ok).toEqual(false)
  })
  test("string", () => {
    expect(DateParser("abc").ok).toEqual(false)
  })
  test("incomplete date", () => {
    expect(DateParser("2023-02-13T11:35:01.26Z").ok).toEqual(false)
  })
})
