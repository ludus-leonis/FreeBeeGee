# FreeBeeGee automated tests

This folder contains the FreeBeeGee test suite.

## PHP unit tests

These are standalone tests of individual PHP functions. Only (helper) functions that can be executed without a running web server are covered by those tests.

Additional requirements:

* [PHPUnit 9](https://phpunit.de/) to be installed on your system

Execute the tests via:

```sh
cd /path/to/gitroot
npm install
npm run gulp test-zips
phpunit test/unit/php
```

## JavaScript unit tests

These are standalone tests of individual JavaScript functions that don't need a browser/DOM to run.

Additional requirements:

* none

Execute the tests via:

```sh
cd /path/to/gitroot
npm install
npm run test:unit
```

## Integration tests

These will test the PHP API by calling it via HTTP like a real client does. They are a bit more complex to setup, you need a running webserver.

Requirements:

* [Docker](https://docs.docker.com/engine/install/) to be installed on your system

Execute the tests via:

```sh
cd /path/to/gitroot
npm install
npm run gulp release-docker
npm run gulp test-zips
FBGPASS=apitests docker run -d -p 8765:80 --name freebeegee -e FBGPASS ghcr.io/ludus-leonis/freebeegee:latest
npm run test:api:docker
docker rm -f freebeegee
```

This will try to start a local PHP 8.1 server on port 8765. If you change the port, don't forget to change it at the bottom of `test/api/runner-docker.mjs`, too.

Hint: You have to rerun container (rm + run) if you run the tests multiple times, as failed tests might leave the server in an invalid state.
