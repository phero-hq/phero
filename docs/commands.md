# Commands

You control `samen` by a couple of commands. In most cases, you'd use `npx samen` which passes the command down to either `samen-server` or `samen-client`, while giving it a nice UI in your CLI. You'd almost never use `samen-server`/`samen-client` directly, but it will help to know the workings in order to use them.

## `samen-server`

### `samen-server init` (not implemented yet)

This does a couple of things, to make your server-project ready to go:

- Installs the `@samen/server` package, including the `./node_modules/.bin/samen-server` executable.
- Creates an example of a samen-file at `src/samen.ts`

### `samen-server build`

Takes a samen-file, parses it and generates a manifest and the RPC's for it. Assumes the a samen-file at `src/samen.ts`.

### `samen-server serve [options]`

Watches changes in the samen-file and runs `build` when it changes. Also connects to client-watch processes and last but not leasts: serves incoming requests from clients and runs the generated RPC's for that.

#### Options

```
-p, --port    3030     Specify a custom port for the server to be running on
```

## `samen-client`

### `samen-client init` (not implemented yet)

This does a couple of things, to make your client-project ready to go:

- Installs the `@samen/client` package, including the `./node_modules/.bin/samen-client` executable.
- Creates an example of a client at `src/samen.ts`.

### `samen-client build [server-location] [options]`

Takes a manifest and generates a client with it. You can get a manifest from a samen-server, which can be located by a couple of ways:

- By the location of a server: `samen-client ../api`
- By the URL of a server: `samen-client build http://localhost:3030`.
- By leaving out the location of the server, assuming a server is running at `http://localhost:3030`.

> Make sure you're not targeting the manifest-file itself, but the server instead. This way the location of the manifest-file could be modified by the server, without affecting configuration in the client.

#### Options

```
-p, --port    4040    Specify a custom port for the client-watch-server to be running on. When you've got multiple clients watching a server, give each client its own port.
```

### `samen-client watch [server-location] [options]`

Connects to a dev-server and runs `build` as soon as the manifest changes.

## `npx samen`

The primary way to run `samen`. It will inspect the current directory and do the most appropriate thing possible:

- When in a server-directory it will run `samen-server serve`.
- When in a client-directory it will run `samen-client watch`.
- When in a directory with multiple samen-projects, it will run either `samen-serve serve` or `samen-client watch` for each project.
- When there's samen-project found in the current directory, or in one of the direct child directories in it, it will prompt to initiate one for you (not implemented yet).

When you're in need of any custom options, you cannot use this shortcut. Use one of the commands following commands instead:

- `npx samen server init`
- `npx samen server build`
- `npx samen server serve [options]`
- `npx samen client init`
- `npx samen client build [server-location] [options]`
- `npx samen client watch [server-location] [options]`
