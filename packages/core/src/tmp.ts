export type JSValue =
  | JSUntypedValue
  | JSStringValue
  | JSNumberValue
  | JSBooleanValue
  | JSObjectValue
  | JSArrayValue
  | JSDateValue
  | JSNullValue
  | JSUndefinedValue
  | JSOneOfTypesValue
  | JSTupleValue
  | JSModelRef;
export enum JSType {
  untyped = "untyped",
  string = "string",
  number = "number",
  boolean = "boolean",
  object = "object",
  array = "array",
  date = "date",
  null = "null",
  undefined = "undefined",
  oneOfTypes = "oneOfTypes",
  tuple = "tuple",
  modelRef = "modelRef",
}
export interface JSUntypedValue {
  type: JSType.untyped;
}
export interface JSStringValue {
  type: JSType.string;
  oneOf?: string[];
}
export interface JSNumberValue {
  type: JSType.number;
  oneOf?: number[];
}
export interface JSBooleanValue {
  type: JSType.boolean;
  oneOf?: boolean[];
}
export type JSProperty = JSValue & { name: string };
export interface JSObjectValue {
  type: JSType.object;
  properties: JSProperty[];
}
export interface JSArrayValue {
  type: JSType.array;
  elementType: JSValue;
}
export interface JSDateValue {
  type: JSType.date;
}
export interface JSNullValue {
  type: JSType.null;
}
export interface JSUndefinedValue {
  type: JSType.undefined;
}
export interface JSOneOfTypesValue {
  type: JSType.oneOfTypes;
  oneOfTypes: JSValue[];
}
export interface JSTupleValue {
  type: JSType.tuple;
  elementTypes: JSValue[];
}
export interface JSModelRef {
  type: JSType.modelRef;
  id: string;
}

export interface SamenFile {
  rpcFunctions: RPCFunction[];
  models: ModelMap;
}
export interface RPCFunction {
  name: string;
  parameters: RPCFunctionParameter[];
  returnType: JSValue;
  modelIds: string[];
}
export interface RPCFunctionParameter {
  name: string;
  index: number;
  value: JSValue;
}
export type ModelMap = {
  [modelId: string]: Model;
};
export interface Model {
  id: string;
  ts: string;
  value: JSValue;
}
