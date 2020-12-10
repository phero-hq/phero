import { JSType } from "../../../domain"
import { type } from "./types"

test("Untyped", () => {
  expect(type({ type: JSType.untyped })).toMatchSnapshot()
})

test("String", () => {
  expect(type({ type: JSType.string })).toMatchSnapshot()
})

test("Number", () => {
  expect(type({ type: JSType.number })).toMatchSnapshot()
})

test("Boolean", () => {
  expect(type({ type: JSType.boolean })).toMatchSnapshot()
})

test("Object", () => {
  expect(
    type({
      type: JSType.object,
      properties: [
        { name: "a", type: JSType.number },
        { name: "b", type: JSType.string },
        { name: "c", type: JSType.ref, id: "Something" },
      ],
    }),
  ).toMatchSnapshot()
})

describe("Array", () => {
  test("Number", () => {
    expect(
      type({ type: JSType.array, elementType: { type: JSType.number } }),
    ).toMatchSnapshot()
  })

  test("Ref", () => {
    expect(
      type({
        type: JSType.array,
        elementType: { type: JSType.ref, id: "Something" },
      }),
    ).toMatchSnapshot()
  })
})

test("Date", () => {
  expect(type({ type: JSType.date })).toMatchSnapshot()
})

test("Null", () => {
  expect(type({ type: JSType.null })).toMatchSnapshot()
})

test("Undefined", () => {
  expect(type({ type: JSType.undefined })).toMatchSnapshot()
})

test("OneOfTypes", () => {
  expect(
    type({
      type: JSType.oneOfTypes,
      oneOfTypes: [
        { type: JSType.number },
        { type: JSType.ref, id: "Something" },
      ],
    }),
  ).toMatchSnapshot()
})

test("Tuple", () => {
  expect(
    type({
      type: JSType.tuple,
      elementTypes: [
        { type: JSType.string },
        { type: JSType.ref, id: "Something" },
      ],
    }),
  ).toMatchSnapshot()
})

test("ModelRef", () => {
  expect(type({ type: JSType.ref, id: "Something" })).toMatchSnapshot()
})
