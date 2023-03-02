import TemplateLiteralParser from "../../static/TemplateLiteralParser"

describe("TemplateLiteralParser", () => {
  test("/^email:d+@.+.com$/", () => {
    expect(
      TemplateLiteralParser(/^email:\d+@.+\.com$/)("email:123@aap.com"),
    ).toEqual({
      ok: true,
      result: "email:123@aap.com",
    })
  })
})
