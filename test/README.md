# FreeBeeGee automated tests

This folder contains the FreeBeeGee test suite.

## PHP unit tests

These are standalone tests of individual PHP functions. Only (helper) functions that can be executed without a running web server are covered by those tests.

Additional requirements:

* [PHPUnit 9](https://phpunit.de/) to be installed on your system

Execute the tests via:

```sh
cd /path/to/gitroot
phpunit test/
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
npm run gulp dist-test
docker build -t fbg:apache-rewrite-php8 test/Docker/
docker run -d -v "$PWD/dist/FreeBeeGee":/var/www/html -p 8765:80 -u $(id -u) --name freebeegee fbg:apache-rewrite-php8
npm run test:api
docker rm -f freebeegee
```

This will try to start a local PHP 8.0 server on port 8765. If you change the port or use a different PHP version, don't forget to change it at the bottom of `test/utils/chai.js`, too.

Hint: You don't have to receate the container (run + rm) if you run the tests multiple times. But you have to run `npm run gulp dist-test` every time, as failed tests might leave the server in an invalid state.

Hint: You can try other PHP versions by tweaking the `Dockerfile` and adapting the last lines of `test/utils/chai.js` accordingly.
