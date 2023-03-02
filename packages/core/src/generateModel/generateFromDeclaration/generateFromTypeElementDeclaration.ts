import ts from "typescript"
import { DependencyMap, TypeParamMap } from ".."
import { PheroParseError } from "../../domain/errors"
import {
  MemberParserModel,
  IndexMemberParserModel,
  ParserModelType,
  ParserModel,
} from "../../domain/ParserModel"
import generateFromTypeNode from "../generateFromTypeNode"
import propertyNameAsString from "../lib/propertyNameAsString"

export default function generateFromTypeElementDeclaration(
  member: ts.TypeElement,
  type: ts.Type,
  location: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
  typeParams: TypeParamMap,
): {
  root: MemberParserModel | IndexMemberParserModel
  deps: DependencyMap
} {
  if (ts.isPropertySignature(member)) {
    if (!member.type) {
      throw new PheroParseError("Member must have a type", member)
    }

    const memberName = getMemberNameAsString(member)
    // console.group("g>" + memberName, printCode(member))

    const prop = getNonOptionalType(type).getProperty(memberName)

    if (!prop) {
      throw new PheroParseError("Member not found", member)
    }

    const propType = typeChecker.getTypeOfSymbolAtLocation(prop, location)
    const optional = !!member.questionToken
    const actualOptionalType = optional
      ? getNonOptionalType(propType)
      : propType

    const memberParser = generateFromTypeNode(
      member.type,
      actualOptionalType,
      location,
      typeChecker,
      deps,
      typeParams,
    )
    // console.groupEnd()

    return {
      root: {
        type: ParserModelType.Member,
        name: memberName,
        optional,
        parser: memberParser.root,
      },
      deps: memberParser.deps,
    }
  } else if (ts.isIndexSignatureDeclaration(member)) {
    if (!member.type) {
      throw new PheroParseError("Member must have a type", member)
    }

    // is either string or numberIndex type
    // if both are present, they refer to the same type
    const indexType = type.getStringIndexType() ?? type.getNumberIndexType()

    if (!indexType) {
      throw new PheroParseError(
        "No index type found for index signature",
        member,
      )
    }

    const memberParser = generateFromTypeNode(
      member.type,
      indexType,
      location,
      typeChecker,
      deps,
      typeParams,
    )

    const keyParsers = member.parameters.reduce<{
      models: ParserModel[]
      deps: DependencyMap
    }>(
      ({ models, deps }, param) => {
        if (!param.type) {
          throw new PheroParseError("Index parameter should have type", param)
        }
        const paramType = typeChecker.getTypeAtLocation(param)
        // reduce dit
        const paramTypeModel = generateFromTypeNode(
          param.type,
          paramType,
          location,
          typeChecker,
          deps,
          typeParams,
        )
        return {
          models: [...models, paramTypeModel.root],
          deps: paramTypeModel.deps,
        }
      },
      { models: [], deps },
    )

    if (keyParsers.models.length !== 1) {
      throw new PheroParseError(
        "Index member should only have one parameter",
        member,
      )
    }

    const keyParser = keyParsers.models[0]

    return {
      root: {
        type: ParserModelType.IndexMember,
        keyParser,
        optional: false,
        parser: memberParser.root,
      },
      deps: memberParser.deps,
    }
  }

  if (ts.isMethodSignature(member)) {
    throw new PheroParseError(`Type with methods are not supported`, member)
  }

  if (ts.isCallSignatureDeclaration(member)) {
    throw new PheroParseError(`Type with methods are not supported`, member)
  }

  throw new PheroParseError(
    `Member type ${member.kind} is not supported`,
    member,
  )
}

function getMemberNameAsString(member: ts.TypeElement): string {
  const memberName = member.name

  if (!memberName) {
    throw new PheroParseError("Member has no name", member)
  }

  return propertyNameAsString(memberName)
}

function getNonOptionalType(propType: ts.Type): ts.Type {
  if (!propType.isUnion() || propType.types.length !== 2) {
    return propType
  }

  const nonUndefinedType = propType.types.find(
    (t) => (t.flags & ts.TypeFlags.Undefined) === 0,
  )

  if (!nonUndefinedType) {
    return propType
  }

  return nonUndefinedType
}
