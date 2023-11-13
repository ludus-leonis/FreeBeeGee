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

/* global describe */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import Test, { expect } from '../utils/test.mjs'

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

let data = null
let i

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiMinimalTable (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return []
  }, body => {
    expect(body.length).to.be.eql(0)
  }, 200)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [Test.data.pieceMinimal()]
  }, body => {
    expect(body.length).to.be.eql(1)
  }, 200)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [Test.data.pieceMinimal(), Test.data.pieceMinimal()]
  }, body => {
    expect(body.length).to.be.eql(2)
  }, 200)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return []
  }, body => {
    expect(body.length).to.be.eql(0)
  }, 200)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiInvalidTable (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return {}
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of length/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
  }, body => {
    expect(body._messages[0]).to.match(/table is not valid JSON/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return ''
  }, body => {
    expect(body._messages[0]).to.match(/table is not valid JSON/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return null
  }, body => {
    expect(body._messages[0]).to.match(/table is not valid JSON/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return 1234
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of length/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [[], []]
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [Test.data.pieceMinimal(), [], Test.data.pieceMinimal()]
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [Test.data.pieceMinimal(), 1234, Test.data.pieceMinimal()]
  }, body => {
    expect(body._messages[0]).to.match(/ table is not an array of/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiInvalidPieces (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [{}]
  }, body => {
    expect(body._messages[0]).to.match(/ l missing/)
  }, 400)

  Test.jsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [Test.data.pieceMinimal(), {}, Test.data.pieceMinimal()]
  }, body => {
    expect(body._messages[0]).to.match(/ l missing/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

const LEVELS = 15
let level

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUndo (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // create piece
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: '73740cdf', x: 0, y: 64 }
  }, body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(0)
    data = body
  }, 201)

  // get & compare piece
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(0)
  })

  // do more changes than 0..9 history
  level = 1 // note: loop counter is not available during actual test runs.
  for (i = 0; i <= LEVELS; i++) {
    Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
      return { x: level }
    }, body => {
      expect(body.a).to.be.eql('73740cdf')
      expect(body.x).to.be.eql(level++)
    })
  }

  // get & compare piece (and revert level for first undo test)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(--level)
  })

  // undo changes
  for (i = LEVELS; i >= 1; i--) {
    Test.jsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => ({}), body => {
    }, 204)
    Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
      expect(body.a).to.be.eql('73740cdf')
      expect(body.x).to.be.eql(--level)
    })
  }

  // no more undos to initial '0' available
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => ({}), body => {}, 204)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(1)
  })
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => ({}), body => {}, 204)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - tables', function () {
    runner((api, version, room) => {
      describe('minimal tables', () => testApiMinimalTable(api, room))
      describe('invalid tables', () => testApiInvalidTable(api, room))
      describe('invalid pieces', () => testApiInvalidPieces(api, room))
      describe('undo', () => testApiUndo(api, room))
    })
  })
}
