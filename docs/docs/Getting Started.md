---
sidebar_position: 2
---

Let's setup an example project of a server and client with the following structure:

```
phero-example-project
├── api
└── app
```

## Step 1: Set up the backend

To initialise a Phero server, do the following:

```
# Go to your backend project directory:
cd ./api
​
# Make sure npm and TypeScript are ready to go:
npm init -y
npm install typescript --save-dev
npx tsc --init
​
# Add Phero to your backend project:
npx phero init server
```

Running the `phero init server` command does a couple of things:

- Install `@phero/server`.
- Create a Phero-file at `src/phero.ts`.

You can do these steps manually as well. The Phero-file is the entry-point for Phero to know what your code is, so it's important to keep it there.

:::caution
At this moment, there is an additional step of configuration needed. Add these lines to the tsconfig.json of your server:

```
{
  "compilerOptions": {
    ...
    "sourceRoot": "src",
    "outDir": "dist"
  }
}
```

We're working on a fix for this, so you won't have to do this.
:::

## Step 2: Set up the frontend

To add Phero to your frontend, do the following:

```
# Go to your frontend project directory:
cd ../app

# Make sure npm and TypeScript are ready to go:
npm init -y
npm install typescript --save-dev
npx tsc --init

# Add Phero to your frontend project:
npx phero init client
```

This does the following:

- Install `@phero/client`.
- Add `phero.generated.ts` to `.gitignore`.
- Create an example file at `src/phero.ts`.

You can do these steps manually as well. It's up to you what you want to do with `src/phero.ts` in this case. It's there to let you know about how to use the client, but that code could be anywhere in your app-project. You're free to check in `phero.generated.ts` into version-control, but we advise not to.

## Step 3: Run the development environment

Now would be a great time to run `npx phero` in the root of your project:

```
cd ../
npx phero
```

This will do the following:

- Run the server in `./api`.
- Watch your Phero-file at `./api/src/phero.ts`.
- Generate a client to `./app/src/phero.generated.ts`.
- Keep everything up-to-date as your Phero-file changes.

:::note
You can also install phero globally if that's your taste:

```
  $ npm i -g phero
  $ phero
```

:::
