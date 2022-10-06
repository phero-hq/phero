<div align="center">
  <img src="./logo.png" width="260" />
  <h1>Samen</h1>
</div>

Samen is the no-hassle and type-safe glue between your backend and frontend(s). Our mission is to reduce the amount of boilerplate to create a backend for your apps, and give you end-to-end type-safety in the process. Check out this introduction video to see how the basics work:

[![Introduction video](https://img.youtube.com/vi/I13TKes7ylg/0.jpg)](https://www.youtube.com/watch?v=I13TKes7ylg)

**Features**:

✅ code-first, minimal API
✨ generates a type-safe SDK for your frontends
🚀 easily share your models between server and client
📋 parses the input and output based on your models
🔋 comes with a Terminal UI
🖖 middleware
🏛️ only a single dependency: TypeScript

## Example: Hello World!

All you need is a file called `src/samen.ts` on your backend. Here's an example:

```ts
import { createService } from "@samen/server"

interface HelloMessage {
  text: string
}

async function sayHello(name: string): Promise<HelloMessage> {
  return {
    text: `Hello, ${name}`,
  }
}

export const exampleService = createService({
  sayHello,
})
```

As you can see our function `sayHello` returns an object with the structure of `HelloMessage`. Samen will analyse the function(s) you've exposed with `createService()`. It will gather all models (interfaces, enums and type aliases) your client will need.

Now, when you hit `npx samen` in your project directory, Samen will generate an SDK for your client(s) in a file called `samen.generated.ts`. This includes a `SamenClient` class which you can use to call the functions on your backend.From the generated file you can import your models (coming from your server) as well, which could come in very handy in some cases.

Here's an example of how that looks on your frontend:

```ts
import { useCallback, useState } from "react"
import unfetch from "isomorphic-unfetch"

// Samen will generate a file 'samen.generated.ts` on your client with a
// SamenClient and the models you're using in your RPC functions
import { SamenClient, HelloMessage } from "../samen.generated"

// instantiate the generated SamenClient with your favorite fetch lib
const samen = new SamenClient(unfetch)

export function HelloMessage() {
  const [message, setMessage] = useState<string | null>(null)

  const onPress = useCallback(async () => {
    // call your RPC function on your service
    const helloMessage: HelloMessage = await samen.exampleService.sayHello(
      "Steve Jobs",
    )
    setMessage(helloMessage.text)
  }, [])

  if (!message) {
    return <button onClick={onPress}>Press to get message</button>
  }

  return <div>{message}</div>
}
```

### Error handling

Now, let's say we want to check for a minimum of 3 characters for the person we want to greet. Like this:

```ts
class NameTooShortError extends Error {
  constructor(public readonly minimumLength: number) {
    super()
  }
}

async function sayHello(name: string): Promise<HelloMessage> {
  if (name.length < 3) {
    throw new NameTooShortError(3)
  }
  return {
    text: `Hello, ${name}`,
  }
}
```

On your client you can now catch this error:

```ts
import { HelloMessage, NameTooShortError } from "../samen.generated"
try {
  const helloMessage: HelloMessage = await samen.exampleService.sayHello(
    "", // oops!
  )
  // TODO insert logic here
} catch (e) {
  if (e instanceof NameTooShortError) {
    alert(`Name too short, should be at least ${e.minimumLength} characters`)
  } else {
    throw e
  }
}
```

## Documentation

A complete set of documentation could be found at: [docs.samen.io](https://docs.samen.io/).

## Status

- [x] Alpha: We are developing and using Samen in projects for our own clients. The toolkit is used in production (in a couple of high-profile apps), but the developer experience may not be optimal.
- [x] Public Alpha: Developer experience is stable and most common TypeScript-types should be supported.
- [x] Public Beta: Advanced TypeScript-types are supported, but some platform-specific features may be missing.
- [ ] Public: Feature-complete and running everywhere!

We are currently in Public Beta. Watch "releases" of this repo to get notified of major updates!

## Community & Support

- [GitHub Issues](https://github.com/samen-io/samen/issues): Bugs, errors or feature-requests can be posted here.
- [GitHub Discussions]() or [Discord](https://discord.gg/t97n6wQfkh): You are very welcome to hang out, ask questions, show what you've build, or whatever!
- [Twitter](https://twitter.com/SamenHQ): Another place to keep up to date with announcements and news.
- [YouTube](https://www.youtube.com/channel/UCgHc6KiLud3FAL_Pecb3pnQ): Here we'll be posting our guides in video-form.
- [Email](mailto:hi@samen.io): If you want to talk business.

## License

Samen is [licensed as Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).
