/**
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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

// Mocha / Chai helpers for integration tests.

import chai from 'chai'
import http from 'chai-http'
import match from 'chai-match'
import * as fs from 'fs'
import AdmZip from 'adm-zip'

export const REGEXP_ID = /^[a-zA-Z0-9_-]{8}$/
export const REGEXP_DIGEST = /^crc32:-?[0-9]+$/
export const p = JSON.parse(fs.readFileSync('package.json'))

// --- request helpers ---------------------------------------------------------

export const expect = chai.expect
chai
  .use(http)
  .use(match)

/**
 * GET an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {object} forward Data to forward to the payload callback.
 */
export function testJsonGet (api, path, payloadTests, status = 200, forward = null) {
  it(`GET ${api}${path()}`, function (done) {
    chai.request(api)
      .get(path())
      .set('content-type', 'application/json')
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res, res.text).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body, forward)
        done()
      })
  })
}

const binaryParser = function (res, cb) {
  res.setEncoding('binary')
  res.data = ''
  res.on('data', function (chunk) {
    res.data += chunk
  })
  res.on('end', function () {
    cb(null, Buffer.from(res.data, 'binary'))
  })
}

/**
 * GET an any endpoint, do common HTTP tests on it, and then run payload-
 * specific tests. Used for non-JSON endpoints e.g. data blobs.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {function} headerTests Callback function. Will recieve the headers for further checking.
 * @param {function} payloadTests Callback function. Will recieve raw payload.
 * @param {number} status Expected HTTP status.
 */
export function testGetBuffer (api, path, headerTests, payloadTests, status = 200) {
  it(`GET ${api}${path()}`, function (done) {
    chai.request(api)
      .get(path())
      .set('content-type', 'application/octet-stream')
      .buffer()
      .parse(binaryParser)
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res.body).to.be.not.null
        headerTests(res.headers)
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * Upload a file to an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {function} name Function to return (possibly dynamic) room name.
 * @param {function} auth Function to return (possibly dynamic) password.
 * @param {function} upload Function to return (possibly dynamic) filename of file to upload.
 * @param {function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {boolean} json If true (default), tests expects a json reply from PHP.
 */
export function testZIPUpload (api, path, name, auth, upload, payloadTests, status = 200, json = true) {
  it(`POST ${api}${path()}`, function (done) {
    chai.request(api)
      .post(path())
      .field('name', name())
      .field('auth', auth())
      .attach('snapshot', upload(), 'file.name')
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        if (json) expect(res, res.text).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  }).timeout(10000)
}

/**
 * POST an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {function} payload Function to return (possibly dynamic) payload to send.
 * @param {function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 */
export function testJsonPost (api, path, payload, payloadTests, status = 200) {
  it(`POST ${api}${path()}`, function (done) {
    chai.request(api)
      .post(path())
      .set('content-type', 'application/json')
      .send(payload())
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res, res.text).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * POST an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {function} payload Function to return (possibly dynamic) payload to send.
 * @param {function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
*/
export function testJsonPut (api, path, payload, payloadTests, status = 200) {
  it(`PUT ${api}${path()}`, function (done) {
    chai.request(api)
      .put(path())
      .set('content-type', 'application/json')
      .send(payload())
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res, res.text).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * PATCH an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {function} payload Function to return (possibly dynamic) payload to send.
 * @param {function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 */
export function testJsonPatch (api, path, payload, payloadTests, status = 200) {
  it(`PATCH ${api}${path()}`, function (done) {
    chai.request(api)
      .patch(path())
      .set('content-type', 'application/json')
      .send(payload())
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res, res.text).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * DELETE an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {number} status Expected HTTP status. Defaults to 204 = gone.
*/
export function testJsonDelete (api, path, status = 204) {
  it(`DELETE ${api}${path()}`, function (done) {
    chai.request(api)
      .delete(path())
      .set('content-type', 'application/json')
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res.body).to.be.not.null
        expect(res.body).to.be.eql({}) // API returns empty json objects as "no content"
        done()
      })
  })
}

/**
 * Create a room.
 *
 * Convenient when creating the room itself is not being tested.
 *
 * @param {string} api Server URL to API root.
 * @param {string} room Room name to create.
 * @param {string} template Template to use for room.
 */
export function openTestroom (api, room, template) {
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      template: template,
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
  }, 201)
}

/**
 * Remove a room.
 *
 * Convenient when deleting the room itself is not being tested.
 *
 * @param {string} api Server URL to API root.
 * @param {string} room Room name to create.
 */
export function closeTestroom (api, room) {
  testJsonDelete(api, () => `/rooms/${room}/`)
}

/**
 * Prepare a zip.
 *
 * @param {function} add Called with a zip object to add stuff.
 * @return {Buffer} Zipped files as buffer for uploads.
 */
export function zipCreate (add) {
  const zip = new AdmZip()
  add(zip)
  return zip.toBuffer()
}

/**
 * Extract table of contents from a zip.
 *
 * @param {Buffer} buffer Buffer of ZIP sent by server.
 * @return {Array} Array of strings of all files in zip.
 */
export function zipToc (buffer) {
  const zip = new AdmZip(buffer)
  const zipEntries = zip.getEntries()
  const entries = []

  zipEntries.forEach(zipEntry => {
    entries.push(zipEntry.entryName)
  })

  return entries
}

// -----------------------------------------------------------------------------

/**
 * Run thests against one or more servers, runnding differet PHP version.
 *
 * @param {function} what Function to call to run the tests. Will recieve the API
 *                        URL, the PHP version and a suggested room name.
 */
export function runTests (what) {
  const api = 'http://playPHP.local/api'
  // const api = 'http://localhost:8765/api'

  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

  describe('PHP 7.2', function () { what(api.replace(/PHP/, '72'), '72', `${room}72`) })
  describe('PHP 7.3', function () { what(api.replace(/PHP/, '73'), '73', `${room}73`) })
  describe('PHP 7.4', function () { what(api.replace(/PHP/, '74'), '74', `${room}74`) })
  describe('PHP 8.0', function () { what(api.replace(/PHP/, '80'), '80', `${room}80`) })
  describe('PHP 8.1', function () { what(api.replace(/PHP/, '81'), '81', `${room}81`) })
}
