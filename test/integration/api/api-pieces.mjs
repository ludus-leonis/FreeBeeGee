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

import * as Test from 'test/integration/utils/test.mjs'

const expect = Test.expect

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

const NOTE_MAX_LENGTH = 256
const LABEL_MAX_LENGTH = 32

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiInvalidPiece (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return []
  }, body => {
    expect(body._messages[0]).to.match(/ piece is not an array of objects nor an object/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
  }, body => {
    expect(body._messages[0]).to.match(/piece is not valid JSON/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return ''
  }, body => {
    expect(body._messages[0]).to.match(/piece is not valid JSON/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return null
  }, body => {
    expect(body._messages[0]).to.match(/piece is not valid JSON/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return 1234
  }, body => {
    expect(body._messages[0]).to.match(/ piece is not an array of objects nor an object/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return [[], []]
  }, body => {
    expect(body._messages[0]).to.match(/ piece is not an array of objects nor an object/)
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
function testApiMinimalPiece (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {}
  }, body => {
    expect(body._messages[0]).to.match(/ . missing/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 99
    }
  }, body => {
    expect(body._messages[0]).to.match(/ l not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1
    }
  }, body => {
    expect(body._messages[0]).to.match(/ . missing/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678'
    }
  }, body => {
    expect(body._messages[0]).to.match(/ x missing/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678',
      x: 1
    }
  }, body => {
    expect(body._messages[0]).to.match(/ y missing/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678',
      x: 1,
      y: 1
    }
  }, body => {
    expect(body._messages[0]).to.match(/ z missing/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678',
      x: 2,
      y: 3,
      z: 4
    }
  }, body => {
    expect(body).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z')
    expect(body.id).to.match(Test.REGEXP.ID)
    expect(body.l).to.be.eql(1)
    expect(body.a).to.be.eql('12345678')
    expect(body.x).to.be.eql(2)
    expect(body.y).to.be.eql(3)
    expect(body.z).to.be.eql(4)
  }, 201)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceID (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.id).to.be.match(Test.REGEXP.ID)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), id: '87654321' }
  }, body => {
    expect(body.id).to.be.match(Test.REGEXP.ID)
    expect(body.id).not.to.be.eql('87654321')
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), id: '8765432' }
  }, body => {
    expect(body._messages[0]).to.match(/ id does not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), id: '876543210' }
  }, body => {
    expect(body._messages[0]).to.match(/ id does not match/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceL (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 0 }
  }, body => {
    expect(body._messages[0]).to.match(/ l not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 6 }
  }, body => {
    expect(body._messages[0]).to.match(/ l not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 'one' }
  }, body => {
    expect(body._messages[0]).to.match(/ l not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: [1] }
  }, body => {
    expect(body._messages[0]).to.match(/ l not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: '1' }
  }, body => {
    expect(body.l).not.to.be.eq('1')
    expect(body.l).to.be.eq(1)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 1.9 }
  }, body => {
    expect(body._messages[0]).to.match(/ l not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceA (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: '1234567' }
  }, body => {
    expect(body._messages[0]).to.match(/ a does not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: '123456789' }
  }, body => {
    expect(body._messages[0]).to.match(/ a does not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: '1234$678' }
  }, body => {
    expect(body._messages[0]).to.match(/ a does not match/)
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
function testApiPieceX (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), x: -100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ x not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), x: 100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ x not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), x: 'ten' }
  }, body => {
    expect(body._messages[0]).to.match(/ x not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), x: '[8]' }
  }, body => {
    expect(body._messages[0]).to.match(/ x not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), x: '10' }
  }, body => {
    expect(body.x).not.to.be.eq('10')
    expect(body.x).to.be.eq(10)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), x: 10.9 }
  }, body => { // xxx
    expect(body._messages[0]).to.match(/ x not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceY (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), y: -100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ y not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), y: 100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ y not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), y: 'ten' }
  }, body => {
    expect(body._messages[0]).to.match(/ y not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), y: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ y not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), y: '10' }
  }, body => {
    expect(body.y).not.to.be.eq('10')
    expect(body.y).to.be.eq(10)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), y: '10.9' }
  }, body => { // xxx
    expect(body._messages[0]).to.match(/ y not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceZ (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), z: -100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ z not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), z: 100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ z not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), z: 'ten' }
  }, body => {
    expect(body._messages[0]).to.match(/ z not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), z: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ z not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), z: '10' }
  }, body => {
    expect(body.z).not.to.be.eq('10')
    expect(body.z).to.be.eq(10)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), z: 10.9 }
  }, body => { // xxx
    expect(body._messages[0]).to.match(/ z not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceR (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: 0 }
  }, body => {
    expect(body.r).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: 60 }
  }, body => {
    expect(body.r).to.be.eq(60)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: 180.9 }
  }, body => {
    expect(body._messages[0]).to.match(/ r not integer between 0 and 359/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ r not integer between 0 and 359/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: 360 }
  }, body => {
    expect(body._messages[0]).to.match(/ r not integer between 0 and 359/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: 366 }
  }, body => {
    expect(body._messages[0]).to.match(/ r not integer between 0 and 359/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: '120' }
  }, body => {
    expect(body.r).to.be.eq(120)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: 'zero' }
  }, body => {
    expect(body._messages[0]).to.match(/ r not integer between 0 and 359/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), r: [0] }
  }, body => {
    expect(body._messages[0]).to.match(/ r not integer between 0 and 359/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(3)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceW (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: 1 }
  }, body => {
    expect(body.w).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: 2 }
  }, body => {
    expect(body.w).to.be.eql(2)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY', w: -500 }
  }, body => {
    expect(body.w).to.be.eql(-500)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY', w: 500 }
  }, body => {
    expect(body.w).to.be.eql(500)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ w not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: 33 }
  }, body => {
    expect(body._messages[0]).to.match(/ w not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: '8' }
  }, body => {
    expect(body.w).to.be.eq(8)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ w not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ w not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceH (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: 1, h: 1 }
  }, body => {
    expect(body.h).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), w: 2, h: 2 }
  }, body => {
    expect(body.h).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY', h: -500 }
  }, body => {
    expect(body.h).to.be.eql(-500)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY', h: 500 }
  }, body => {
    expect(body.h).to.be.eql(500)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), h: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ h not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), h: 33 }
  }, body => {
    expect(body._messages[0]).to.match(/ h not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), h: '8' }
  }, body => {
    expect(body.h).to.be.eq(8)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), h: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ h not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), h: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ h not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceS (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.s).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: 0 }
  }, body => {
    expect(body.s).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: 2 }
  }, body => {
    expect(body.s).to.be.eql(2)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ s not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: 133 }
  }, body => {
    expect(body._messages[0]).to.match(/ s not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: '8' }
  }, body => {
    expect(body.s).to.be.eq(8)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ s not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), s: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ s not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceN (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.n).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: 0 }
  }, body => {
    expect(body.n).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: 2 }
  }, body => {
    expect(body.n).to.be.eql(2)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ n not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: 36 }
  }, body => {
    expect(body._messages[0]).to.match(/ n not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: '8' }
  }, body => {
    expect(body.n).to.be.eq(8)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ n not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), n: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ n not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceC (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [] }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [0] }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [0, 0] }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [2] }
  }, body => {
    expect(body.c).to.be.eql([2])
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [2, 0] }
  }, body => {
    expect(body.c).to.be.eql([2])
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: 0 }
  }, body => {
    expect(body._messages[0]).to.match(/ c is not an array/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: 8 }
  }, body => {
    expect(body._messages[0]).to.match(/ c is not an array/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [-1] }
  }, body => {
    expect(body._messages[0]).to.match(/some c entries are not/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: [16] }
  }, body => {
    expect(body._messages[0]).to.match(/some c entries are not/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: ['8'] }
  }, body => {
    expect(body.c).to.be.eql([8])
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), c: ['eight'] }
  }, body => {
    expect(body._messages[0]).to.match(/some c entries are not/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(7)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceT (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.t).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: [] }
  }, body => {
    expect(body.t).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: [' '] }
  }, body => {
    expect(body.t).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: [' ', ' '] }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array of length/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: ['text'] }
  }, body => {
    expect(body.t).to.be.eql(['text'])
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: ['text', ' '] }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array of length/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: '' }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: 'text' }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => { // <-
    return { ...Test.data.pieceMinimal(), t: ['f'.repeat(LABEL_MAX_LENGTH + 1)] }
  }, body => {
    expect(body._messages[0]).to.match(/ t entries do not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 3, t: ['y'.repeat(LABEL_MAX_LENGTH + 1)] }
  }, body => {
    expect(body.t).to.be.eql(['y'.repeat(LABEL_MAX_LENGTH + 1)])
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 3, t: ['z'.repeat(NOTE_MAX_LENGTH + 1)] }
  }, body => {
    expect(body._messages[0]).to.match(/ t entries do not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), t: [888] }
  }, body => {
    expect(body.t).to.be.eql(['888'])
  }, 201)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(6)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceB (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.b).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: [] }
  }, body => {
    expect(body.b).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: [' x '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not matc/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: ['  '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not matc/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: [' ', '  '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not matc/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: ['texttext', '  '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not matc/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: [' ', 'texttext'] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not matc/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: ['texttext'] }
  }, body => {
    expect(body.b).to.be.eql(['texttext'])
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: '' }
  }, body => {
    expect(body._messages[0]).to.match(/ b is not an array/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: 'texttext' }
  }, body => {
    expect(body._messages[0]).to.match(/ b is not an array/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: ['x'.repeat(33)] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 3, b: ['x'.repeat(33)] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not match/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), b: [12345678] }
  }, body => {
    expect(body.b).to.be.eql(['12345678'])
  }, 201)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceF (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), f: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ f not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), f: 0b100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ f not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), f: 'three' }
  }, body => {
    expect(body._messages[0]).to.match(/ f not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), f: [3] }
  }, body => {
    expect(body._messages[0]).to.match(/ f not integer between/)
  }, 400)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), f: '3' }
  }, body => {
    expect(body.f).not.to.be.eq('3')
    expect(body.f).to.be.eq(3)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), f: 3.9 }
  }, body => { // xxx
    expect(body._messages[0]).to.match(/ f not integer between/)
  }, 400)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiPieceExpires (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal() }
  }, body => {
    expect(body.expires).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), expires: 1 }
  }, body => {
    expect(body.expires).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), expires: 2641467929 }
  }, body => {
    expect(body.expires).to.be.eql(undefined)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY' }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY', expires: 1 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZY', expires: 2641467929 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZZ' }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZZ', expires: 1 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), a: 'ZZZZZZZZ', expires: 2641467929 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(5)
  })

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCreatePieces (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return [
      { ...Test.data.pieceMinimal(), l: 3 },
      { ...Test.data.pieceMinimal(), l: 4 }
    ]
  }, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(2)
    expect(body[0].l).to.be.eql(3)
    expect(body[1].l).to.be.eql(4)
  }, 201)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  Test.closeTestroom(api, room)
}

const deleteIDs = []

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiDeletePieces (api, room) {
  Test.openTestroom(api, room, 'Classic')

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 1 }
  }, body => {
    deleteIDs.length = 0
    deleteIDs.push(body.id)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 2 }
  }, body => {
    deleteIDs.push(body.id)
  }, 201)

  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...Test.data.pieceMinimal(), l: 3 }
  }, body => {
    deleteIDs.push(body.id)
  }, 201)

  Test.jsonDeleteBatch(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return [deleteIDs[0], deleteIDs[2]]
  }, body => {
  }, 204)

  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql(deleteIDs[1])
  })

  Test.closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - pieces', function () {
    runner((api, version, room) => {
      describe('invalid pieces', () => testApiInvalidPiece(api, room))
      describe('minimal pieces', () => testApiMinimalPiece(api, room))
      describe('valid id', () => testApiPieceID(api, room))
      describe('valid l', () => testApiPieceL(api, room))
      describe('valid a', () => testApiPieceA(api, room))
      describe('valid x', () => testApiPieceX(api, room))
      describe('valid y', () => testApiPieceY(api, room))
      describe('valid z', () => testApiPieceZ(api, room))
      describe('valid r', () => testApiPieceR(api, room))
      describe('valid w', () => testApiPieceW(api, room))
      describe('valid h', () => testApiPieceH(api, room))
      describe('valid s', () => testApiPieceS(api, room))
      describe('valid n', () => testApiPieceN(api, room))
      describe('valid c', () => testApiPieceC(api, room))
      describe('valid t', () => testApiPieceT(api, room))
      describe('valid b', () => testApiPieceB(api, room))
      describe('valid f', () => testApiPieceF(api, room))
      describe('valid expires', () => testApiPieceExpires(api, room))
      describe('multi-create', () => testApiCreatePieces(api, room))
      describe('multi-delete', () => testApiDeletePieces(api, room))
    })
  })
}
