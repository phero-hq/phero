import EnumParser from "../../static/EnumParser"

enum StringEnum {
  Aap = "aap",
  Noot = "noot",
  Mies = "mies",
}

enum NumberEnum {
  First = 0,
  Second,
  Third,
}

describe("EnumParser", () => {
  test("StringEnum", () => {
    expect(
      EnumParser(StringEnum.Aap, StringEnum.Noot, StringEnum.Mies)("aap"),
    ).toEqual({
      ok: true,
      result: StringEnum.Aap,
    })
    expect(
      EnumParser(StringEnum.Aap, StringEnum.Noot, StringEnum.Mies)("noot"),
    ).toEqual({
      ok: true,
      result: StringEnum.Noot,
    })
    expect(
      EnumParser(StringEnum.Aap, StringEnum.Noot, StringEnum.Mies)("mies"),
    ).toEqual({
      ok: true,
      result: StringEnum.Mies,
    })
    expect(
      EnumParser(StringEnum.Aap, StringEnum.Noot, StringEnum.Mies)("abc").ok,
    ).toEqual(false)
  })
  test("NumberEnum", () => {
    expect(
      EnumParser(NumberEnum.First, NumberEnum.Second, NumberEnum.Third)(0),
    ).toEqual({
      ok: true,
      result: NumberEnum.First,
    })
    expect(
      EnumParser(NumberEnum.First, NumberEnum.Second, NumberEnum.Third)(1),
    ).toEqual({
      ok: true,
      result: NumberEnum.Second,
    })
    expect(
      EnumParser(NumberEnum.First, NumberEnum.Second, NumberEnum.Third)(2),
    ).toEqual({
      ok: true,
      result: NumberEnum.Third,
    })
    expect(
      EnumParser(NumberEnum.First, NumberEnum.Second, NumberEnum.Third)(3).ok,
    ).toEqual(false)
  })
})
