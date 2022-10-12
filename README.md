<div align="center">
  <img src="./doc-assets/logo.png" width="260" />
  <p>Pronounced like "hero", with the f of function.</p>
  <p>
    Short for <a href="https://en.wikipedia.org/wiki/Pheromone">pheromone</a> (that stuff some animals use to act as one).
  </p>
</div>

---

Phero is the no-hassle and type-safe glue between your backend and frontend. TypeScript is at the core of it all. Development with Phero goes in these steps:

1. **Build your backend.** Define your domain models and functions in regular, plain TypeScript.
2. **Run the CLI.** This runs the server and generates an SDK for your frontend, or multiple frontends at the same time.
3. **Call your backend-functions from the frontend, as if they were local.** This includes type-safety and error-handling.

This boosts your frontend development, because:

- No more guessing about how the backend works. You can no longer make mistakes with the URL, method, headers or status-codes. Call the function, handle the Promise and get compile errors when things don't line up.
- Stop assuming data is of the type you’re expecting. You know it is, period.
- Use the domain models on the frontend, defined on the backend.
- Handle custom errors on the frontend, that are thrown by the backend.

Backend development is a breeze as well:

- Use the full power of TypeScript to define your domain models. No need for an additional language to learn and maintain, like with GraphQL or tRPC.
- Know when you break compatability with the frontend, before even running it: TypeScript has your back.
- You can stop generating specs or write documentation about the endpoints you expose, and what method and arguments they expect.
- The server can be deployed anywhere, either on one of the cloud platforms or a regular Node server.

Check out this introduction video to see how the basics work:

[![Introduction video](./doc-assets/thumbnail.png)](https://www.youtube.com/watch?v=I13TKes7ylg)

**Features**:

✅ Code-first, minimal API  
✨ Generates a type-safe SDK for your frontends  
🚀 Share your models between server and client  
🧨 Mind-blowing error-handling  
📋 Parses the input and output, based on your models  
🔋 Comes with a CLI  
🖖 Middleware  
🏛️ Only a single dependency: TypeScript

## Example: Hello World!

It all starts with a file called `src/phero.ts` on your backend. Here's an example:

```ts
import { createService } from "@phero/server"

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

As you can see our function `sayHello` returns an object with the structure of `HelloMessage`. Phero will analyse the functions you've exposed with `createService()`. It will gather all models (interfaces, enums and type aliases) your frontend could need.

Now, when you run `npx phero` in your project directory, Phero will generate an SDK for your client(s) in a file called `phero.generated.ts`. This includes a `PheroClient` class which you can use to call the functions on your backend. From the generated file you can import your models (coming from your server) as well, which could come in very handy in some cases.

Here's an example of how that looks on your frontend:

```ts
import { useCallback, useState } from "react"
import unfetch from "isomorphic-unfetch"

// Phero will generate a file 'phero.generated.ts` on your client with a
// PheroClient and the models you're using in your RPC functions
import { PheroClient, HelloMessage } from "../phero.generated"

// instantiate the generated PheroClient with your favorite fetch lib
const phero = new PheroClient(unfetch)

export function HelloMessage() {
  const [message, setMessage] = useState<string | null>(null)

  const onPress = useCallback(async () => {
    // call your RPC function on your service
    const helloMessage: HelloMessage = await phero.exampleService.sayHello(
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
import { HelloMessage, NameTooShortError } from "../phero.generated"
try {
  const helloMessage: HelloMessage = await phero.exampleService.sayHello(
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

A complete set of documentation could be found at: [docs.phero.dev](https://docs.phero.dev/).

## Status

- [x] Alpha: We are developing and using Phero in projects for our own clients. The toolkit is used in production (in a couple of high-profile apps), but the developer experience may not be optimal.
- [x] Public Alpha: Developer experience is stable and most common TypeScript-types should be supported.
- [x] Public Beta: Advanced TypeScript-types are supported, but some platform-specific features may be missing.
- [ ] Public: Feature-complete and running everywhere!

We are currently in Public Beta. Watch "releases" of this repo to get notified of major updates!

## Community & Support

- [GitHub Issues](https://github.com/phero-hq/phero/issues): Bugs, errors or feature-requests can be posted here.
- [GitHub Discussions]() or [Discord](https://discord.gg/t97n6wQfkh): You are very welcome to hang out, ask questions, show what you've build, or whatever!
- [Twitter](https://twitter.com/PheroHQ): Another place to keep up to date with announcements and news.
- [YouTube](https://www.youtube.com/channel/UCgHc6KiLud3FAL_Pecb3pnQ): Here we'll be posting our guides in video-form.
- [Email](mailto:hi@phero.dev): If you want to talk business.

## License

Phero is [licensed as Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).
