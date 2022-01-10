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

/* global describe */
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  expect,
  runTests,
  openTestroom,
  closeTestroom,
  testJsonGet,
  testJsonPut
} from './utils/chai.mjs'

import {
  pieceMinimal
} from './utils/data.mjs'

// -----------------------------------------------------------------------------

function testApiMinimalTable (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return []
  }, body => {
    expect(body.length).to.be.eql(0)
  }, 200)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(1)
  }, 200)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
  }, 200)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return []
  }, body => {
    expect(body.length).to.be.eql(0)
  }, 200)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiInvalidTable (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return {}
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of length/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
  }, body => {
    expect(body._messages[0]).to.match(/table is not valid JSON/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return ''
  }, body => {
    expect(body._messages[0]).to.match(/table is not valid JSON/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return null
  }, body => {
    expect(body._messages[0]).to.match(/table is not valid JSON/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return 1234
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of length/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [[], []]
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, [], pieceMinimal]
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, 1234, pieceMinimal]
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiInvalidPieces (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [{}]
  }, body => {
    expect(body._messages[0]).to.match(/ l missing/)
  }, 400)

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, {}, pieceMinimal]
  }, body => {
    expect(body._messages[0]).to.match(/ l missing/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

describe('API - tables', function () {
  runTests((api, version, room) => {
    describe('minimal tables', () => testApiMinimalTable(api, version, room))
    describe('invalid tables', () => testApiInvalidTable(api, version, room))
    describe('invalid pieces', () => testApiInvalidPieces(api, version, room))
  })
})
