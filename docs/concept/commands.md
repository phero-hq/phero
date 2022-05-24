# CLI commands

In order to build, run and deploy samen servers and clients, the package is also a CLI. The following commands can be run:

## install

`$ npx samen install`

This command will add samen as a dev dep to your package and install it automatically. Besides one script will be added to your package json:

`"samen": "samen"`

Which makes sure the user can then run `npm run samen command`.
It will also create an empty `samen.ts` file in users project and create all necessary config files (if any).

## build

The build command will first compile the TypeScript project. If it's compiling it will look up the `samen.ts` file and generate a file called `samen-manifest.yaml`. This file describes all API endpoints including the parameters but also the return values. It's like a blueprint, or "contract" of the API.

## serve

Serve will internally first call the `build` command. Eventually the serve command will read the generated `samen-manifest.yaml` and will generate all necessary code to run a server based on the described contract.

## serve watch

The serve watch command is like the scribed serve command except that it wil generate and pick up changes to the codebase and manifest instantly.

## deploy

The deploy command will first build all code into separate JavaScript bundles. Next it will deploy the code to the configured deployment target(s).
The deploy command has no knowledge about versions or backwards compatiblity.

## publish (Payed feature)

The publish command is a payed feature. When the user is not logged in it will ask the user to log in.

The publish command will upload the manifest to the samen.cloud business, and make it a version. A version desribes the contracts of a specific moment in time. With making it possilbe to have differente versions of a manifest, one can also deploy versions of the API concurrently next to each other.

When an backwards incompatible change was made to the API since the last version, the user will get a few choices:

1. implement generated mappers (from the new version to the old, and vice versa).
2. be aware of an incompatbible change, revert/fixthe code

## build client

Builds a client based on the manifest of the project. This manifest can be stored on:

- the file system (file://)
- some file storage service (AWS S3 or Google Cloud Object Storage) (s3/some path/dsm/v5.0.31)
- the samen server (http://samen.cloud/dsm/v5.0.31)
