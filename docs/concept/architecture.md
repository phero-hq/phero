# The samen package

To keep things simple, there is just one user facing package to install for the user:

`$ npm i samen`

The samen package contains and combines several internal sub packages to make one unified DX.

## samen-cli

The samen CLI package contains all building blocks necessary to expose a command line UI to build, run and deploy a samen project, both for the server as well as the client.

[./commands](All available commands)

## samen-analyzer

The samen-analyzer package's responsibilty is to analyse the TypeScript's AST (of the user's program) and generate all meta information we need in futher steps.
This package will also include a watch interface we will need to use for the development flow.

## samen-codegen

The samen-codegen package's responsibilty is to generate code based on the input of samen-analyzer. This is all code: validators, api's, sdk's, etc. To keep things simple we shall also include platform dependent code in this package. In the future we will asses whether the platform dependent should be moved to their own packages (samen-codegen-aws, samen-codegen-gc, etc.).

## samen-server

The samen-server package will include the building blocks in order to run the samen application. It will run user's code, and setup an http/https server. Dependent on the environent (NODE_ENV) it will run a development build (with more helpful/extensive error messaging) or an highly optimised production build. The development server will also have the ability to track code changes (through samen-analyzer) and generate code on the fly (through samen-codegen) and instanly run the new code (AKA hot code reloading).

## samen-deploy

The samen-deploy package will include code to bundle and deploy user's code effeciently to the supported cloud providers.
