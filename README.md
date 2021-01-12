# Samen

Samen is still in active development.  
Alpha release will come soon, join the waiting list here: https://samen.io

## About Samen

Samen builds and deploys serverless backend services and databases from your code and autogenerates end-to-end type-safe SDK's for your web or mobile client(s).

## Design principles

- Code-first
- Declarative
- End-to-end typesafe

## Example

First, define your models like:

```ts
// server/src/schema.ts
interface User {
  id: string
  name: string
}
```

Then define your RPC's on the server:

```ts
// server/src/index.ts
import { db } from "samen/db"
import { User } from "./schema"

export async function getUsers(): Promise<User[]> {
  // typesafe database client
  // generated from your interface
  return await db.users.find().toArray()
}
```

And then you can use the generated SDK's in the client like:

```ts
// client/src/App.tsx
import { useState, useEffect } from "react"

import { User, getUsers } from "samen/client"

export default function App() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getUsers().then((users) => setUsers(users))
  }, [])

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

Lastly, use the CLI to deploy the backend:

```bash
$ samen deploy
```

And you're ready to go :)

## Credits

Built with ♥️ by [Press Play](https://pressplay.dev)
