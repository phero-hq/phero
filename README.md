# Samen

Samen is a new kind of backend framework for building RPC style API's in TypeScript. Our mission is to reduce the amount of (boilerplate) code you need to create a backend for your apps.

**Features**:

✅ code-first, minimal API  
✨ generates a type-safe SDK for your frontends
🚀 easily share your models between server and client  
📋 parses the input and output based on your models  
🔋 comes with a Terminal UI  
🖖 middleware  
🏛️ zero dependencies, just 1 peer dep: TypeScript

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

As you can see our function `sayHello` returns an object with the structure of `HelloMessage`. Samen will analyse the function(s) you've exposed with the `createService` API. It will gather all models (interfaces, enums and type aliases) your client will need.

Now, when you hit `npx samen` in your project directory, Samen will generate an SDK for your client(s) in a file called `samen.generated.ts`. It will include a generated `SamenClient` class which just wraps all your exposed services in to one API. Of course you can then also import all the models you need, `HelloMessage` in this case.

Her's an example of how that looks on your frontend:

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

On your client you can now just catch this error:

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

## Quickstart

Let's setup an example project of a server and client with the following structure:

```
samen-example-project
├── api
└── app
```

### Step 1: Set up the server

To initialise a Samen server, run `npx samen init server` in `./api`:

```
cd ./api

npm init -y
npm install typescript --save-dev
npx tsc --init

npx samen init server
```

> You can leave out the npm and TypeScript setup if your project already has it installed.

This does a couple of things:

- Install `@samen/server`.
- Create a Samen-file at `src/samen.ts`.

You can do these steps manually as well. The Samen-file is the entry-point for Samen to know what your code is, so it's important to keep it there.

### Step 2: Set up the client

To install the client, run `npx samen init client` in `./app`:

```
cd ../app

npm init -y
npm install typescript --save-dev
npx tsc --init

npx samen init client
```

> You can leave out the npm and TypeScript setup if your project already has it installed.

This does the following:

- Install `@samen/client`.
- Add `samen.generated.ts` to `.gitignore`.
- Create an example file at `src/samen.ts`.

You can do these steps manually as well. It's up to you what you want to do with `src/samen.ts` in this case. It's there to let you know about how to use the client, but that code could be anywhere in your app-project. You're free to check in `samen.generated.ts` into version-control, but we advise not to.

### Step 3: Run the development environment

Now would be a great time to run npx samen in the root of your project:

```
cd ../
npx samen
```

This will do the following:

- Run the server in `./api`.
- Watch your Samen-file at `./api/src/samen.ts`.
- Generate a client to `./app/src/samen.generated.ts`.
- Keep everything up-to-date as your Samen-file changes.

## Real-world example

In our hello world example we had the function inside the `samen.ts` file. In most cases it's wise to move them out to their own files:

```ts
import { createService } from "@samen/server"

import * as userFunctions from "./user"
import * as articleFunctions from "./article"

export const userService = createService({
  login: userFunctions.login,
  register: userFunctions.register,
})

export const articleService = createService({
  getArticle: articleFunctions.get,
})
```

After the Samen client has been regenerated, these functions could be called based on the names of the services and functions:

```ts
await client.userService.login()
await client.userService.register()
await client.articleService.getArticle()
```

How you organise your functions is totally up to you! As long as Samen can find your exported services in your `samen.ts` file, it'll be all good.

## Using the client

The `SamenClient` class is generated by running Samen. It could be used in any TypeScript based frontend project, or even on different servers or in node-executables. Go nuts! As long as there's TypeScript, you can use the Samen client. It's defenitely not tied to React or any other frontend framework.

You can initialise the client like so:

```ts
import unfetch from "isomorphic-unfetch"

import { SamenClient } from "./samen.generated"

const client = new SamenClient(unfetch, "http://localhost:3030")
```

The Samen client is a class that takes a couple of arguments:

- `fetch`: Doing network requests can work differently, depending on the environment of your app. Provide the Samen client with any implementation of fetch in order to do requests to the server.
- `url`: The full url where your server is running at. We would recommend putting this in a configurable variable, because it would probably be different between local development and going to production.
- `options`: An object that contains additional configuration:
  - `context`: An object to provide the context for each service.

Once you've got an initialised client, you can call functions on the server like there're regular, local functions:

```ts
await client.exampleService.helloWorld()
```

## Documentation

A complete set of documentation could be found at: [docs.samen.io](https://docs.samen.io/). For the basics, keep scrolling!

## License

Samen is [licensed as Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Credits

Built with ♥️ by [Press Play](https://pressplay.dev)
