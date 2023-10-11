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
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  expect,
  openTestroom,
  closeTestroom,
  testJsonGet,
  testJsonPut,
  testJsonPost,
  testJsonPatch
} from '../utils/chai.mjs'

import {
  pieceMinimal
} from '../utils/data.mjs'

// -----------------------------------------------------------------------------

let data = null
let i

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

// -----------------------------------------------------------------------------

const LEVELS = 15
let level

function testApiUndo (api, version, room) {
  openTestroom(api, room, 'Classic')

  // create piece
  testJsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {
    return { ...pieceMinimal, a: '73740cdf', x: 0, y: 64 }
  }, body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(0)
    data = body
  }, 201)

  // get & compare piece
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(0)
  })

  // do more changes than 0..9 history
  level = 1 // note: loop counter is not available during actual test runs.
  for (i = 0; i <= LEVELS; i++) {
    testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
      return { x: level }
    }, body => {
      expect(body.a).to.be.eql('73740cdf')
      expect(body.x).to.be.eql(level++)
    })
  }

  // get & compare piece (and revert level for first undo test)
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(--level)
  })

  // undo changes
  for (i = LEVELS; i >= 1; i--) {
    testJsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => ({}), body => {
    }, 204)
    testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
      expect(body.a).to.be.eql('73740cdf')
      expect(body.x).to.be.eql(--level)
    })
  }

  // no more undos to initial '0' available
  testJsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => ({}), body => {}, 204)
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(1)
  })
  testJsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => ({}), body => {}, 204)
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(1)
  })

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

export function run (runner) {
  describe('API - tables', function () {
    runner((api, version, room) => {
      describe('minimal tables', () => testApiMinimalTable(api, version, room))
      describe('invalid tables', () => testApiInvalidTable(api, version, room))
      describe('invalid pieces', () => testApiInvalidPieces(api, version, room))
      describe('undo', () => testApiUndo(api, version, room))
    })
  })
}
