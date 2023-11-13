/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 *
 * @license AGPL-3.0-or-later
 *
 * This file is part of FreeBeeGee.
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

/* global it */
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai helpers for integration tests.

import chai from 'chai'
import http from 'chai-http'
import match from 'chai-match'
import * as fs from 'fs'
import AdmZip from 'adm-zip'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

import Api from '../../../src/js/api/index.mjs'
import Content from '../../../src/js/view/room/tabletop/content.mjs'
import State from '../../../src/js/state/index.mjs'
import Selection from '../../../src/js/view/room/tabletop/selection.mjs'
import Testdata from './data.mjs'

// -----------------------------------------------------------------------------

const REGEXP = {
  ID: /^[a-zA-Z0-9_-]{8}$/,
  DIGEST: /^crc32:-?[0-9]+$/
}

const TEST_STATE = 5

export default {
  ACCESS_ANY: '00000000-0000-0000-0000-000000000000',
  p: JSON.parse(fs.readFileSync('package.json')),
  TEST_STATE,
  REGEXP,

  snapshot: {
    _: { // asset count in system snapshot
      badge: 2,
      material: 5,
      other: 16,
      sticker: 17,
      tile: 2,
      token: 8
    },
    classic: { // asset count in classic snapshot
      badge: 3,
      material: 0,
      other: 0,
      sticker: 0,
      tile: 10,
      token: 6
    }
  },

  setupTestData,
  mock,

  expect: chai.expect,
  data: Testdata,

  openTestroom,
  closeTestroom,
  getBuffer,
  getBufferQuery,
  jsonDelete,
  jsonGet,
  jsonPatch,
  jsonPost,
  jsonPut,
  jsonDeleteBatch,
  httpGet,
  fetchAndTest,
  zipCreate,
  zipToc,
  zipUpload
}

// --- test setup --------------------------------------------------------------

/**
 * Initialize table+room data for tests.
 *
 * Will set all tables to empty, except table 5.
 *
 * @param {object[]} table (Optional) pieces for table 5.
 * @param {object} room (Optional) Initial room data.
 * @param {object} server (Optional) Initial server data.
 */
function setupTestData (table = Testdata.table(), room = Testdata.room(), server = Testdata.server()) {
  Api.setMock(1) // disable server calls, enable request-mirroring
  State.setServerInfo(server)
  State._private.setRoom(room)
  Selection._private.selectionReset()

  for (let i = 1; i <= 9; i++) {
    // table 1 is for empty-tests
    // table 9 is for pre-selected tests
    if (i === TEST_STATE) {
      State._private.setTable(i, Content.populatePiecesDefaults(table))
    } else if (i === 1) {
      State._private.setTable(i, [])
    } else {
      State._private.setTable(i, Content.populatePiecesDefaults([{ ...Testdata.pieceFull(), id: Testdata.pieceFull().id + i }]))
    }
  }
  State.setTableNo(TEST_STATE, false)

  // token id Ta3RTTni (piecefull = _number, table = token)
  // asset id U0kg8300
}

// --- request helpers ---------------------------------------------------------

export const expect = chai.expect
chai
  .use(http)
  .use(match)

/**
 * Split mock server reply for easier testing.
 *
 * @param {object} request Request object from API.
 * @returns {object} Split properties path, method, body, headers and expectedStatus.
 */
function mock (request) {
  return request
    ? {
        path: request.path,
        method: request.data?.method,
        body: request.data?.body ? JSON.parse(request.data.body) : undefined,
        headers: request.data?.headers,
        expectedStatus: request.expectedStatus
      }
    : {}
}

/**
 * GET a regular web page, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} server Server URL/root without trailing slash.
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 */
function httpGet (server, path, payloadTests, status = 200) {
  it(`GET ${server}${typeof path === 'string' ? path : path()}`, function () {
    return fetch(`${server}${path}`)
      .then(res => {
        expect(res.status).to.be.eql(status)
        return res.text()
      })
      .then(body => {
        payloadTests(body)
      })
  })
}

/**
 * GET an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {string} token Optional API token method.
 */
function jsonGet (api, path, payloadTests, status = 200, token = undefined) {
  it(`GET ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .get(path())
      .set('content-type', 'application/json')
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
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
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} headerTests Callback function. Will recieve the headers for further checking.
 * @param {Function} payloadTests Callback function. Will recieve raw payload.
 * @param {number} status Expected HTTP status.
 * @param {string} token Optional API token method.
 */
function getBuffer (api, path, headerTests, payloadTests, status = 200, token = undefined) {
  it(`GET ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .get(path())
      .set('content-type', 'application/octet-stream')
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
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
 * GET an any endpoint, do common HTTP tests on it, and then run payload-
 * specific tests. Used for non-JSON endpoints e.g. data blobs.
 *
 * @param {string} api Server URL to API root.
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} headerTests Callback function. Will recieve the headers for further checking.
 * @param {Function} payloadTests Callback function. Will recieve raw payload.
 * @param {number} status Expected HTTP status.
 * @param {string} token Optional API token method. Passed in query string, not in header, as if clicking links.
 */
function getBufferQuery (api, path, headerTests, payloadTests, status = 200, token = undefined) {
  it(`GET ${api}${path()}?token=...`, function (done) {
    const request = chai.request(api)
      .get(path())
      .set('content-type', 'application/octet-stream')
    if (token) request.query({ token: token() })
    request
      .buffer()
      .parse(binaryParser)
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
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
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} name Function to return (possibly dynamic) room name.
 * @param {Function} auth Function to return (possibly dynamic) password.
 * @param {Function} upload Function to return (possibly dynamic) filename of file to upload.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {boolean} json If true (default), tests expects a json reply from PHP.
 */
function zipUpload (api, path, name, auth, upload, payloadTests, status = 200, json = true) {
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
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} payload Function to return (possibly dynamic) payload to send.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {string} token Optional API token method.
 */
function jsonPost (api, path, payload, payloadTests, status = 200, token = undefined) {
  it(`POST ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .post(path())
      .set('content-type', 'application/json')
      .send(payload())
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        if (![204].includes(status)) {
          expect(res, res.text).to.be.json
          expect(res.body).to.be.not.null
          payloadTests(res.body)
        }
        done()
      })
  })
}

/**
 * POST an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} payload Function to return (possibly dynamic) payload to send.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {string} token Optional API token method.
 */
function jsonPut (api, path, payload, payloadTests, status = 200, token = undefined) {
  it(`PUT ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .put(path())
      .set('content-type', 'application/json')
      .send(payload())
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
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
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} payload Function to return (possibly dynamic) payload to send.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status.
 * @param {string} token Optional API token method.
 */
function jsonPatch (api, path, payload, payloadTests, status = 200, token = undefined) {
  it(`PATCH ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .patch(path())
      .set('content-type', 'application/json')
      .send(payload())
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
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
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {number} status Expected HTTP status. Defaults to 204 = gone.
 * @param {string} token Optional API token method.
 */
function jsonDelete (api, path, status = 204, token = undefined) {
  it(`DELETE ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .delete(path())
      .set('content-type', 'application/json')
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res.body).to.be.not.null
        if (![400, 401, 403, 404].includes(status)) {
          expect(res.body).to.be.eql({}) // API returns empty json objects as "no content"
        }
        done()
      })
  })
}

/**
 * DELETE an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param {string} api Server URL to API root.
 * @param {Function} path Function to return a path (possibly with dynamic ID) during runtime.
 * @param {Function} payload Function to return (possibly dynamic) payload to send.
 * @param {Function} payloadTests Callback function. Will recieve the parsed payload for
 *                                further checking.
 * @param {number} status Expected HTTP status. Defaults to 204 = gone.
 * @param {string} token Optional API token method.
 */
function jsonDeleteBatch (api, path, payload, payloadTests, status = 204, token = undefined) {
  it(`DELETE ${api}${path()}`, function (done) {
    const request = chai.request(api)
      .delete(path())
      .set('content-type', 'application/json')
      .send(payload())
    if (token) request.set('aUtHoRiZaTiOn', token())
    request
      .end(function (err, res) {
        expect(err, err && err.rawResponse).to.be.null
        expect(res, res.text).to.have.status(status)
        expect(res.body).to.be.not.null
        if (![400, 401, 403, 404].includes(status)) {
          expect(res.body).to.be.eql({}) // API returns empty json objects as "no content"
        }
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * Fetch a website page and run tests on it via JSDOM.
 *
 * @param {string} url (Docker) Url to fetch.
 * @param {Function} tests Test to run: (dom) => tests.
 * @param {number} status Expected HTTP status, defaults to 200.
 * @param {boolean} js If enabled (default), execute JS in JSDOM.
 * @returns {Promise} Promise of execution.
 */
function fetchAndTest (url, tests = () => Promise.resolve(), status = 200, js = true) {
  const JSDOM_DELAY = 250

  return fetch(url)
    .then(res => {
      expect(res.status).to.be.eql(status)
      return res.text()
    })
    .then(async body => {
      return new Promise(function (resolve) {
        const options = {
          url,
          contentType: 'text/html',
          includeNodeLocations: true,
          storageQuota: 1000000,
          resources: 'usable'
        }
        if (js) options.runScripts = 'dangerously'
        const dom = new JSDOM(body, options)
        dom.window.fetch = (path, data) => fetch(`${url}${path}`, data)
        setTimeout(() => resolve(dom), JSDOM_DELAY)
      })
    })
    .then(dom => tests(dom.window.document.body.innerHTML))
}

/**
 * Create a room.
 *
 * Convenient when creating the room itself is not being tested.
 *
 * @param {string} api Server URL to API root.
 * @param {string} room Room name to create.
 * @param {string} snapshot Snapshot to use for room.
 * @param {string} password Optional password for the room.
 */
function openTestroom (api, room, snapshot, password = undefined) {
  jsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      snapshot,
      auth: 'apitests',
      password
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
function closeTestroom (api, room) {
  jsonDelete(api, () => `/rooms/${room}/`)
}

/**
 * Prepare a zip.
 *
 * @param {Function} add Called with a zip object to add stuff.
 * @returns {Buffer} Zipped files as buffer for uploads.
 */
function zipCreate (add) {
  const zip = new AdmZip()
  add(zip)
  return zip.toBuffer()
}

/**
 * Extract table of contents from a zip.
 *
 * @param {Buffer} buffer Buffer of ZIP sent by server.
 * @returns {Array} Array of strings of all files in zip.
 */
function zipToc (buffer) {
  const zip = new AdmZip(buffer)
  const zipEntries = zip.getEntries()
  const entries = []

  zipEntries.forEach(zipEntry => {
    entries.push(zipEntry.entryName)
  })

  return entries
}
