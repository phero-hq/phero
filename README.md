# Samen

A backend framework for API's based on RPC. Minimal, fast and with autogenerated clients for your front-ends.

## Introduction

Samen is a backend framework for typescript developers to build API's.

The name **samen** means **together** in Dutch and it's how we envision building apps. The frontend and backend not as isolated containers but as two parts working together.

By using Samen, building API's and sharing models between the client and API, is only a matter of writing functions and importing these in the frontend.

- API's as functions
- Live autogenerated Samen Client
- Domain models sharing between API and frontend
- Using API's as functions in the client
- Middleware
- Error handling
- Typescript
- Build for your own infra

## Quick Example

`api/samen.ts`

```ts
import { createService, createFunction } from "@samen/server"
import { myDBClient } from "./db.ts"

interface User {
  id: string
  name: string
}

class UserNotFoundError extends Error {}

async function getUser(id: string): Promise<User> {
  const user = await myDBClient.getUser(id)
  if (!user) {
    throw new UserNotFoundError()
  }
  return user
}

export const userService = createService({
  getUser: createFunction(getUser),
})
```

`web/User.tsx`

```ts
import { useState } from "react"
import { SamenClient, userService } from "@samen/client"

const samen = new SamenClient()

export default function User(props: { userId: string }) {
  const [user, setUser] = useState<userService.User>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    samen.userService
      .getUser(userId)
      .then(setUser)
      .catch((error) => {
        if (error instanceof UserNotFoundError) {
          setError(`User could not be found by id: ${userId}`)
        } else {
          setError(error.message)
        }
      })
  }, [getData])

  if (error) {
    return <p>{error}</p>
  }

  if (!user) {
    return <div>Loading user...</div>
  }

  return <div>Welcome {user.name}!</div>
}
```

In this example we expose a `User` interface and a `getUser` function from our API. From our frontend we can use those as if it's regular, local TypeScript!

### Documentation

For more information, guides and docs, visit: https://docs.samen.io/.

## Features

- Code-first
- Declarative
- End-to-end typesafe
- Middleware
- Error handling
- Autoupdate

## Credits

Built with ♥️ by [Press Play](https://pressplay.dev)
