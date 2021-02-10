/**
 * @copyright 2021 Markus Leupold-Löwenthal
 *
 * @license This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

/* global describe, it */
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. To run them, you have to serve
// dist/FreeBeeGee/ using a local webserver first. Then run `npm test`.
// Danger: the tests make destructive calls, so don't run against a live version.

const API_URL = 'http://play.local/api'

// --- helpers -----------------------------------------------------------------

const chai = require('chai')
const expect = chai.expect
chai
  .use(require('chai-http'))
  .use(require('chai-match'))

/**
 * GET an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Server within the api/ folder.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 */
function testJsonGet (path, payloadTests, status = 200) {
  it('GET ' + path, function (done) {
    chai.request(API_URL)
      .get(path)
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

// --- the actual tests --------------------------------------------------------

describe('API Server-Info', function () {
  testJsonGet('/', body => {
    expect(body).to.be.an('object')
    expect(body.createPassword).to.be.eql(true)
    expect(body.openSlots).to.be.eql(128)
    expect(body.ttl).to.be.eql(48)
    expect(body.version).to.match(/^[0-9]+\.[0-9]+\.[0-9]+/)
  })
})

describe('API Templates', function () {
  testJsonGet('/templates/', body => {
    expect(body).to.be.an('array')
    expect(body).to.include('RPG')
    expect(body).to.include('Classic')
  })
})

describe('get game', function () {
  testJsonGet('/games/crudGame/', body => {
    expect(body).to.be.an('object')
    expect(body._errors).to.include('not found: crudGame')
  }, 404)
})

// more tests to arrive soon!
