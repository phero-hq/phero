import ts from "typescript"
import generateParserModel, {
  ObjectParserModel,
  ParserModelType,
} from "./code-gen/parsers/generateParserModel"
import { ParseError } from "./errors"
import {
  ParsedSamenFunctionDefinition,
  ParsedSamenServiceConfig,
} from "./parseSamenApp"
import { getNameAsString } from "./tsUtils"

export function parseContext(
  func: ParsedSamenFunctionDefinition,
  serviceConfig: ParsedSamenServiceConfig,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition {
  const ctxIndex = func.parameters.findIndex(
    (p) =>
      p.type &&
      ts.isTypeReferenceNode(p.type) &&
      getNameAsString(p.type.typeName) === "SamenContext",
  )

  if (ctxIndex === -1) {
    return func
  }

  const ctxParam = func.parameters[ctxIndex]

  if (ctxIndex !== func.parameters.length - 1) {
    throw new ParseError(
      `SamenContext parameter should be the last parameter`,
      ctxParam,
    )
  }

  const ctxParamType = ctxParam.type

  if (!ctxParamType) {
    throw new ParseError(
      `SamenContext parameter should have a type declared`,
      ctxParam,
    )
  }

  if (
    !ts.isTypeReferenceNode(ctxParamType) ||
    ctxParamType.typeArguments?.length !== 1
  ) {
    throw new ParseError(
      `SamenContext parameter's type argument has an incorrect type`,
      ctxParam,
    )
  }

  const funcCtx = ctxParamType.typeArguments[0]

  const ctxIO = getContextIO(
    [
      ...(serviceConfig.middleware ?? []),
      { contextType: funcCtx, nextType: undefined },
    ],
    typeChecker,
  )

  const genCtx = ts.factory.createTypeReferenceNode(ctxParamType.typeName, [
    ts.factory.createTypeLiteralNode(ctxIO.inputContextProps),
  ])

  return {
    ...func,
    parameters: func.parameters.slice(0, ctxIndex),
    context: {
      type: genCtx,
      name: getNameAsString(ctxParam.name),
    },
  }
}

type ContextIO = {
  inputContext: ObjectParserModel
  inputContextProps: ts.PropertySignature[]
  accumulatedContext: ObjectParserModel
}

type MiddlewareContext = {
  nextType: ts.TypeNode | undefined
  contextType: ts.TypeNode | undefined
}

function getContextIO(
  middleware: Array<MiddlewareContext>,
  typeChecker: ts.TypeChecker,
): ContextIO {
  return middleware.reduce(
    (
      { inputContext, inputContextProps, accumulatedContext },
      { contextType: ctxType, nextType },
    ) => {
      if (ctxType) {
        const ctxParserModel = getRootObjectParserModel(ctxType, typeChecker)
        const ctxProps = getPropertySignatures(ctxType)
        for (const ctxMem of ctxParserModel.members) {
          if (ctxMem.type == ParserModelType.Member) {
            const accMemIndex = accumulatedContext.members.findIndex(
              (accMem) =>
                accMem.type == ParserModelType.Member &&
                accMem.name === ctxMem.name,
            )

            // TODO check for ctx with same name but different parser
            // then trhow error like "you already have context with same name but different parser"

            if (accMemIndex === -1) {
              // NOTE we need the context from the client
              inputContext.members.push(ctxMem)
              const ctxProp = ctxProps.find(
                (p) => getNameAsString(p.name) === ctxMem.name,
              )

              if (!ctxProp) {
                throw new ParseError(
                  `Can't find prope with name ${ctxMem.name}`,
                  ctxType,
                )
              }

              inputContextProps.push(ctxProp)
              // we also accumlate it for use in other middleware or rpc
              accumulatedContext.members.push(ctxMem)
            }
          }
        }
      }

      if (nextType) {
        const nextParserModel = getRootObjectParserModel(nextType, typeChecker)

        for (const nxtMem of nextParserModel.members) {
          if (nxtMem.type == ParserModelType.Member) {
            const accMemIndex = accumulatedContext.members.findIndex(
              (accMem) =>
                accMem.type == ParserModelType.Member &&
                accMem.name === nxtMem.name,
            )

            if (accMemIndex === -1) {
              accumulatedContext.members.push(nxtMem)
            } else {
              // NOTE overwrite with the new parser
              accumulatedContext.members[accMemIndex] = nxtMem
            }
          }
        }
      }

      return {
        inputContext,
        inputContextProps,
        accumulatedContext,
      }
    },
    {
      inputContext: {
        type: ParserModelType.Object,
        members: [],
      },
      inputContextProps: [],
      accumulatedContext: {
        type: ParserModelType.Object,
        members: [],
      },
    } as ContextIO,
  )
}

function getRootObjectParserModel(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
): ObjectParserModel {
  const nextParserModel = generateParserModel(
    typeChecker,
    getDeclaredNode(typeNode, typeChecker),
    "root",
  )

  if (nextParserModel.parser.type !== ParserModelType.Object) {
    throw new ParseError("Should be an object type", typeNode)
  }

  return nextParserModel.parser
}

function getDeclaredNode(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
): ts.Node {
  if (ts.isTypeReferenceNode(typeNode)) {
    const type = typeChecker.getTypeFromTypeNode(typeNode)
    const symbol = type.aliasSymbol ?? type.symbol
    if (symbol.declarations?.length) {
      return symbol.declarations[0]
    }
  }

  return typeNode
}

function getPropertySignatures(typeNode: ts.TypeNode): ts.PropertySignature[] {
  if (ts.isInterfaceDeclaration(typeNode)) {
    return typeNode.members.filter(ts.isPropertySignature)
  }
  if (ts.isTypeAliasDeclaration(typeNode)) {
    return getPropertySignatures(typeNode.type)
  }
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members.filter(ts.isPropertySignature)
  }

  return []
}
