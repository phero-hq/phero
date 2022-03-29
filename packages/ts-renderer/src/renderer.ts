import ReactReconciler from "react-reconciler"
import ts from "typescript"
import { generateAST, TSElements } from "./ts-elements"
import { TSBundleElement } from "./ts-elements/ts-bundle"

type Type = TSElements["type"]
type ContextItem = any
type HydratableInstance = any
type PublicInstance = Instance | TextInstance
type HostContext = Context
type UpdatePayload = any
type ChildSet = any
type TimeoutHandle = any
type NoTimeout = any
type SuspenseInstance = any
interface Container extends Instance {}
interface TextInstance extends Instance {}

type Props = TSElements["props"]

interface Instance {
  type: Type
  props: Props
  children: Instance[]
  appendChild(child: Instance | TextInstance): void
  commitUpdate(newProps: Props): void
  removeChild(child: Instance | TextInstance): void
}

class TSElementInstance<TSElement extends TSElements> implements Instance {
  children: Instance[] = []

  constructor(
    public readonly type: TSElement["type"],
    public props: TSElement["props"],
  ) {}

  appendChild(child: Instance | TextInstance): void {
    this.children.push(child)
  }

  commitUpdate(newProps: TSElement["props"]): void {
    this.props = {
      ...this.props,
      ...newProps,
    }
  }

  removeChild(child: Instance | TextInstance): void {
    this.children.splice(this.children.indexOf(child), 1)
  }
}

interface Context {
  [key: string]: ContextItem
}

function createElement<TSElement extends TSElements>(
  type: TSElement["type"],
  props: TSElement["props"],
): TSElementInstance<TSElement> {
  return new TSElementInstance<TSElement>(type, props)
}

const TSRenderer = ReactReconciler<
  Type,
  Props,
  Container,
  Instance,
  TextInstance,
  SuspenseInstance,
  HydratableInstance,
  PublicInstance,
  HostContext,
  UpdatePayload,
  ChildSet,
  TimeoutHandle,
  NoTimeout
>({
  createInstance(
    type: Type,
    props: Props,
    _rootContainerInstance: Container,
    _hostContext: HostContext,
  ): Instance {
    // console.debug("createInstance")
    return createElement(type, props)
  },

  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    // console.debug("appendInitialChild")
    parentInstance.appendChild(child)
  },

  finalizeInitialChildren(
    _parentInstance: Instance,
    _type: Type,
    _props: Props,
    _rootContainerInstance: Container,
    _hostContext: HostContext,
  ): boolean {
    // console.debug("finalizeInitialChildren")
    return true
  },

  createTextInstance(
    text: string,
    _rootContainerInstance: Container,
    _hostContext: HostContext,
  ): TextInstance {
    // console.debug("createTextInstance")
    // const label = new SmartElement({ code: text }, {})
    // label.commitMount() // prob should run at a later point
    // return label
    throw new Error("TextInstance not supported")
  },

  getPublicInstance(instance: Instance | TextInstance): PublicInstance {
    // console.debug("getPublicInstance")
    return instance
  },

  prepareForCommit(_containerInfo: Container): Record<string, any> | null {
    // console.debug("prepareForCommit")
    return null
  },

  prepareUpdate(
    _instance: Instance,
    _type: Type,
    _oldProps: Props,
    _newProps: Props,
    _rootContainerInstance: Container,
    _hostContext: HostContext,
  ): null | UpdatePayload {
    // console.debug("prepareUpdate")
    // No support for updates
    return null
  },

  resetAfterCommit(_containerInfo: Container): void {
    // console.debug("resetAfterCommit")
  },

  resetTextContent(_instance: Instance): void {
    // console.debug("resetTextContent")
    // noop
  },

  commitTextUpdate(
    _textInstance: TextInstance,
    _oldText: string,
    _newText: string,
  ): void {
    // console.debug("commitTextUpdate")
    throw new Error("commitTextUpdate should not be called")
  },

  removeChild(parentInstance: Instance, child: Instance | TextInstance): void {
    // console.debug("removeChild")
    parentInstance.removeChild(child)
  },

  removeChildFromContainer(
    _container: Container,
    _child: Instance | TextInstance,
  ): void {
    // console.debug("removeChildFromContainer")
    console.warn("'removeChildFromContainer' not supported")
  },

  insertBefore(
    _parentInstance: Instance,
    _child: Instance | TextInstance,
    _beforeChild: Instance | TextInstance,
  ): void {
    // console.debug("insertBefore")
    console.warn("'insertBefore' not supported")
  },

  appendChildToContainer(
    container: Container,
    child: Instance | TextInstance,
  ): void {
    // console.debug("appendChildToContainer")
    container.appendChild(child)
  },

  appendChild(parentInstance: Instance, child: Instance | TextInstance): void {
    // console.debug("appendChild")
    parentInstance.appendChild(child)
  },

  shouldSetTextContent(_type: Type, props: Props): boolean {
    // console.debug("shouldSetTextContent")
    return false
  },

  getRootHostContext(_rootContainerInstance: Container): HostContext | null {
    // console.debug("getRootHostContext")
    // console.warn("'getRootHostContext' not supported")
    return null
  },

  getChildHostContext(
    parentHostContext: HostContext,
    type: Type,
    rootContainerInstance: Container,
  ): HostContext {
    return parentHostContext
  },

  now: Date.now,

  commitUpdate(
    instance: Instance,
    _updatePayload: any,
    _type: string,
    _oldProps: Props,
    newProps: Props,
  ): void {
    // console.debug("commitUpdate")
    return instance.commitUpdate(newProps)
  },

  commitMount(instance: Instance, _type: Type, _newProps: Props): void {
    // console.debug("commitMount")
  },

  scheduleTimeout(
    handler: (...args: any[]) => void,
    timeout: number,
  ): TimeoutHandle | NoTimeout {
    // console.debug("setTimeout")
    return setTimeout(handler, timeout)
  },

  cancelTimeout(handle: TimeoutHandle | NoTimeout): void {
    // console.debug("clearTimeout")
    return clearTimeout(handle)
  },

  preparePortalMount() {
    // console.debug("preparePortalMount")
  },

  clearContainer(_container: Container) {
    // console.debug("clearContainer")
  },

  noTimeout: -1 as NoTimeout,

  isPrimaryRenderer: true,

  supportsMutation: true,

  supportsPersistence: false,

  supportsHydration: false,
})

export function renderAST(element: TSElements): ts.Node {
  const rootElement = new TSElementInstance<TSBundleElement>("ts-bundle", {
    children: [],
  })

  const root = TSRenderer.createContainer(rootElement, 0, false, null)
  TSRenderer.updateContainer(element, root, null, () => {
    // noop
  })

  // TSRenderer.injectIntoDevTools({
  //   bundleType: 0, // prod
  //   rendererPackageName: "ts-renderer",
  //   version: "0.0.1",
  // })

  return generateAST(toJSON(rootElement))
}

function toJSON<T extends TSElements>(inst: TSElementInstance<T>): any {
  const { children, ...props } = inst.props
  let renderedChildren = undefined
  if (inst.children && inst.children.length) {
    for (let i = 0; i < inst.children.length; i++) {
      const renderedChild = toJSON(inst.children[i])
      if (renderedChild !== undefined) {
        if (renderedChildren === undefined) {
          renderedChildren = [renderedChild]
        } else {
          renderedChildren.push(renderedChild)
        }
      }
    }
  }
  const json = {
    type: inst.type,
    props: { ...props, children: renderedChildren },
  }

  return json
}
