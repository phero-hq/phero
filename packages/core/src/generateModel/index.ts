import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import {
  MemberParserModel,
  ObjectParserModel,
  ParserModel,
  ParserModelType,
} from "../domain/ParserModel"
import { PheroErrorProperty } from "../domain/PheroApp"
import { getNameAsString, hasModifier } from "../lib/tsUtils"
import parseReturnType from "../parsePheroApp/parseReturnType"
import generateFromTypeNode from "./generateFromTypeNode"

export interface ParserModelMap {
  root: ParserModel
  deps: Record<string, ParserModel>
}

export interface InternalParserModelMap {
  root: ParserModel
  deps: DependencyMap
}

export type DependencyMap = Map<string, ParserModel>
export type TypeParamMap = Map<string, { name: string; model: ParserModel }>

export interface FunctionParserModel {
  returnType: ParserModel
  parameters: ObjectParserModel
  deps: DependencyMap
}

export interface ErrorParserModel {
  properties: PheroErrorProperty[]
  errorModel: ObjectParserModel
  deps: DependencyMap
}

export function generateParserModel(
  func:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction
    | ts.MethodSignature,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): FunctionParserModel {
  const returnTypeModel = generateFromReturnType(func, typeChecker, deps)

  const paramsModel = generateFromParameters(
    func,
    typeChecker,
    returnTypeModel.deps,
  )

  return {
    returnType: returnTypeModel.root,
    parameters: paramsModel.root,
    deps: paramsModel.deps,
  }
}

function generateFromReturnType(
  func:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction
    | ts.MethodSignature,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): InternalParserModelMap {
  const funcType = parseReturnType(func)

  const funcTypeType = typeChecker.getTypeAtLocation(funcType)

  return generateFromTypeNode(
    funcType,
    funcTypeType,
    funcType,
    typeChecker,
    deps,
    new Map(),
  )
}

function generateFromParameters(
  func:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction
    | ts.MethodSignature,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): { root: ObjectParserModel; deps: DependencyMap } {
  const { params, deps: paramDeps } = func.parameters.reduce<{
    params: MemberParserModel[]
    deps: DependencyMap
  }>(
    ({ params, deps }, param) => {
      if (!param.type) {
        throw new PheroParseError("Parameter should have a type", param)
      }

      const paramModel = generateFromTypeNode(
        param.type,
        typeChecker.getTypeAtLocation(param.type),
        param.type,
        typeChecker,
        deps,
        new Map(),
      )

      return {
        params: [
          ...params,
          {
            type: ParserModelType.Member,
            name: bindingNameAsString(param.name),
            optional: !!param.questionToken,
            parser: paramModel.root,
          },
        ],
        deps: paramModel.deps,
      }
    },
    { params: [], deps },
  )

  return {
    root: {
      type: ParserModelType.Object,
      members: params,
    },
    deps: paramDeps,
  }
}

export function generateParserModelForError(
  classDeclaration: ts.ClassDeclaration,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): ErrorParserModel {
  const properties: PheroErrorProperty[] = []

  for (const member of classDeclaration.members) {
    if (
      (ts.isPropertyDeclaration(member) ||
        ts.isGetAccessorDeclaration(member)) &&
      (member.modifiers === undefined ||
        hasModifier(member, ts.SyntaxKind.PublicKeyword))
    ) {
      if (!member.type) {
        throw new PheroParseError("Property must have type", member)
      }

      properties.push({
        name: getNameAsString(member.name),
        optional: !!member.questionToken,
        type: member.type,
      })
    }

    if (ts.isConstructorDeclaration(member)) {
      for (const param of member.parameters) {
        if (
          // hasModifier(param, ts.SyntaxKind.PublicKeyword) &&
          !ts.isObjectBindingPattern(param.name) &&
          !ts.isArrayBindingPattern(param.name)
        ) {
          if (!param.type) {
            throw new PheroParseError("Parameter must have type", member)
          }

          properties.push({
            name: getNameAsString(param.name),
            optional: !!param.questionToken,
            type: param.type,
          })
        }
      }
    }
  }

  const memberModels = properties.reduce<{
    models: MemberParserModel[]
    deps: DependencyMap
  }>(
    ({ models, deps }, { name, optional, type }) => {
      const memberParser = generateFromTypeNode(
        type,
        typeChecker.getTypeAtLocation(type),
        type,
        typeChecker,
        deps,
        new Map(),
      )
      return {
        models: [
          ...models,
          {
            type: ParserModelType.Member,
            name,
            optional,
            parser: memberParser.root,
          },
        ],
        deps: memberParser.deps,
      }
    },
    { models: [], deps },
  )

  const errorModel: ObjectParserModel = {
    type: ParserModelType.Object,
    members: memberModels.models,
  }

  return { properties, errorModel, deps: memberModels.deps }
}

function bindingNameAsString(name: ts.BindingName): string {
  if (ts.isIdentifier(name)) {
    return name.text
  }

  throw new PheroParseError("Binding names are not supported", name)
}
