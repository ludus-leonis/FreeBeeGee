# Building instructions

This document is part of the [FreeBeeGee documentation](DOCS.md). It covers how to build FreeBeeGee from the source code repo.

## Building

This is not needed for a regular installation. Most users should be fine using the pre-packaged `*.tar.gz`/`*.zip` mentioned in the [installation instructions](INSTALL.md).

However, if you want to build FreeBeeGee yourself, you'll need `git`, `php` v7.3+ and `npm` v8.0+ locally installed. Then do:

```
git clone --depth 1 https://github.com/ludus-leonis/FreeBeeGee
cd FreeBeeGee
npm install
npm run gulp release
```

The archives can now be found in the `dist/` folder.

### Building demo mode

In Demo Mode, FreeBeeGee will not use the PHP backend/API, but store everything in the browser. This disables some features (multiplayer, uploads, downloads), but as most other functions work, this is sufficient for trying out FreeBeeGee. Demo Mode can't be enabled on runtime - the demo version has to be built manually:

```
git clone --depth 1 https://github.com/ludus-leonis/FreeBeeGee
cd FreeBeeGee
npm install
npm run gulp demo
```

Now `dist/FreeBeeGee` contains the demo version. There will be no PHP files in this installation.
