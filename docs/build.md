# Building instructions

This document is part of the [FreeBeeGee documentation](DOCS.md). It covers how to build FreeBeeGee from the source code repo.

## Building

This is not needed for a regular installation. Most users should be fine using the pre-packaged `*.tar.gz`/`*.zip` mentioned in the [installation instructions](INSTALL.md).

However, if you want to build FreeBeeGee yourself, you'll need `git`, `npm` and `php-cli` (for static linter tests) locally installed. Then do:

```
git clone --depth 1 https://github.com/ludus-leonis/FreeBeeGee
cd FreeBeeGee
npm install
npm run release:build
```

The archives can now be found in the `dist/` folder.

Not needed for the build, but to run the unit tests you will also need `php-tokenizer`, `phpunit`, `php-zip` and `libzip-dev`.

### Building Demo Mode

In Demo Mode, FreeBeeGee will not use the PHP backend/API, but store everything in the browser's HTML storage. This disables some features (multiplayer, uploads, downloads). But as most other functions work, this is sufficient for trying out FreeBeeGee. Demo Mode can't be enabled during runtime - the demo version has to be built statically:

```
git clone --depth 1 https://github.com/ludus-leonis/FreeBeeGee
cd FreeBeeGee
npm install
npm run release:demo
```

Now `dist/demo` contains the demo version. There will be no PHP files in this directory.

### Building a FreeBeeGee Docker container

To create the FreeBeeGee Docker container(s), do:

```
git clone --depth 1 https://github.com/ludus-leonis/FreeBeeGee
cd FreeBeeGee
npm install
npm run release
```

There will now be a `ghcr.io/ludus-leonis/freebeegee:<version>` and `ghcr.io/ludus-leonis/freebeegee:latest` docker image in your local registry.
