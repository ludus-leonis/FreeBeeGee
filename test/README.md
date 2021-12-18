# FreeBeeGee automated tests

This folder contains the FreeBeeGee test suite.

## PHP unit tests

These are standalone tests of individual PHP functions. Only (helper) functions that can be executed without a running web server are covered by those tests.

Requirements:

* [PHPUnit 9](https://phpunit.de/) to be installed on your system

Run the tests via:

```sh
cd /path/to/gitroot
phpunit test/
```

## JavaScript unit tests

These are standalone tests of individual JavaScript functions that don't need a browser/DOM to run. Requirements:

* installed via `npm install`

Run the tests via:

```sh
cd /path/to/gitroot
npm install
npm run test:unit
```

## Integration tests

These will test the PHP API by calling it via HTTP like a real client does. They are a bit more complex to setup, as they need a running webserver.

* `cd /path/to/gitroot`
* `npm install`
* `npm run gulp dist-test`
* Now start a local Apache-PHP server, DOCROOT: `dist/FreeBeeGee`.
* Edit `test/api.php`:
  * In `runTests()` at the end of the file, replace the `const api` with the correct url of your testserver, e.g. `http:localhost:8080/api`.
  * From the `describe(...)` lines at the bottom, disable all but the one that matches your PHP version. Comment out those you don't need.
* `npm run test`
