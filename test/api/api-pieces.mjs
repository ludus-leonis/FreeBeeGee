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
  REGEXP_ID,
  expect,
  runTests,
  openTestroom,
  closeTestroom,
  testJsonGet,
  testJsonPost
} from './utils/chai.mjs'

import {
  pieceMinimal
} from './utils/data.mjs'

// -----------------------------------------------------------------------------

function testApiInvalidTable (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return []
  }, body => {
    expect(body._messages[0]).to.match(/ piece is not an object/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
  }, body => {
    expect(body._messages[0]).to.match(/piece is not valid JSON/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return ''
  }, body => {
    expect(body._messages[0]).to.match(/piece is not valid JSON/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return null
  }, body => {
    expect(body._messages[0]).to.match(/piece is not valid JSON/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return 1234
  }, body => {
    expect(body._messages[0]).to.match(/ piece is not an object/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return [[], []]
  }, body => {
    expect(body._messages[0]).to.match(/ piece is not an object/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiMinimalPiece (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {}
  }, body => {
    expect(body._messages[0]).to.match(/ . missing/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 99
    }
  }, body => {
    expect(body._messages[0]).to.match(/ l not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1
    }
  }, body => {
    expect(body._messages[0]).to.match(/ . missing/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678'
    }
  }, body => {
    expect(body._messages[0]).to.match(/ x missing/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678',
      x: 1
    }
  }, body => {
    expect(body._messages[0]).to.match(/ y missing/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678',
      x: 1,
      y: 1
    }
  }, body => {
    expect(body._messages[0]).to.match(/ z missing/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return {
      l: 1,
      a: '12345678',
      x: 2,
      y: 3,
      z: 4
    }
  }, body => {
    expect(body).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z')
    expect(body.id).to.match(REGEXP_ID)
    expect(body.l).to.be.eql(1)
    expect(body.a).to.be.eql('12345678')
    expect(body.x).to.be.eql(2)
    expect(body.y).to.be.eql(3)
    expect(body.z).to.be.eql(4)
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceID (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.id).to.be.match(REGEXP_ID)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, id: '87654321' }
  }, body => {
    expect(body.id).to.be.match(REGEXP_ID)
    expect(body.id).not.to.be.eql('87654321')
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, id: '8765432' }
  }, body => {
    expect(body._messages[0]).to.match(/ id does not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, id: '876543210' }
  }, body => {
    expect(body._messages[0]).to.match(/ id does not match/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceL (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 0 }
  }, body => {
    expect(body._messages[0]).to.match(/ l not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 6 }
  }, body => {
    expect(body._messages[0]).to.match(/ l not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 'one' }
  }, body => {
    expect(body._messages[0]).to.match(/ l not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: [1] }
  }, body => {
    expect(body._messages[0]).to.match(/ l not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: '1' }
  }, body => {
    expect(body.l).not.to.be.eq('1')
    expect(body.l).to.be.eq(1)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 1.9 }
  }, body => {
    expect(body.l).not.to.be.eq('1')
    expect(body.l).to.be.eq(1)
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceA (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: '1234567' }
  }, body => {
    expect(body._messages[0]).to.match(/ a does not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: '123456789' }
  }, body => {
    expect(body._messages[0]).to.match(/ a does not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: '1234$678' }
  }, body => {
    expect(body._messages[0]).to.match(/ a does not match/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceX (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, x: -100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ x not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, x: 100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ x not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, x: 'ten' }
  }, body => {
    expect(body._messages[0]).to.match(/ x not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, x: '[8]' }
  }, body => {
    expect(body._messages[0]).to.match(/ x not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, x: '10' }
  }, body => {
    expect(body.x).not.to.be.eq('10')
    expect(body.x).to.be.eq(10)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, x: 10.9 }
  }, body => {
    expect(body.x).not.to.be.eq(10.9)
    expect(body.x).to.be.eq(10)
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceY (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, y: -100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ y not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, y: 100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ y not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, y: 'ten' }
  }, body => {
    expect(body._messages[0]).to.match(/ y not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, y: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ y not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, y: '10' }
  }, body => {
    expect(body.y).not.to.be.eq('10')
    expect(body.y).to.be.eq(10)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, y: '10.9' }
  }, body => {
    expect(body.y).not.to.be.eq(10.9)
    expect(body.y).to.be.eq(10)
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceZ (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, z: -100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ z not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, z: 100000000 }
  }, body => {
    expect(body._messages[0]).to.match(/ z not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, z: 'ten' }
  }, body => {
    expect(body._messages[0]).to.match(/ z not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, z: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ z not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, z: '10' }
  }, body => {
    expect(body.z).not.to.be.eq('10')
    expect(body.z).to.be.eq(10)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, z: 10.9 }
  }, body => {
    expect(body.z).not.to.be.eq(10.9)
    expect(body.z).to.be.eq(10)
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(2)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceR (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: 0 }
  }, body => {
    expect(body.r).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: 60 }
  }, body => {
    expect(body.r).to.be.eq(60)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: 180.9 }
  }, body => {
    expect(body._messages[0]).to.match(/ r invalid/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ r invalid/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: 66 }
  }, body => {
    expect(body._messages[0]).to.match(/ r invalid/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: 360 }
  }, body => {
    expect(body._messages[0]).to.match(/ r invalid/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: '120' }
  }, body => {
    expect(body.r).to.be.eq(120)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: 'zero' }
  }, body => {
    expect(body._messages[0]).to.match(/ r invalid/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, r: [0] }
  }, body => {
    expect(body._messages[0]).to.match(/ r invalid/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(3)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceW (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: 1 }
  }, body => {
    expect(body.w).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: 2 }
  }, body => {
    expect(body.w).to.be.eql(2)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY', w: -500 }
  }, body => {
    expect(body.w).to.be.eql(-500)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY', w: 500 }
  }, body => {
    expect(body.w).to.be.eql(500)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ w not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: 33 }
  }, body => {
    expect(body._messages[0]).to.match(/ w not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: '8' }
  }, body => {
    expect(body.w).to.be.eq(8)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ w not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ w not between/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceH (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: 1, h: 1 }
  }, body => {
    expect(body.h).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, w: 2, h: 2 }
  }, body => {
    expect(body.h).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY', h: -500 }
  }, body => {
    expect(body.h).to.be.eql(-500)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY', h: 500 }
  }, body => {
    expect(body.h).to.be.eql(500)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, h: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ h not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, h: 33 }
  }, body => {
    expect(body._messages[0]).to.match(/ h not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, h: '8' }
  }, body => {
    expect(body.h).to.be.eq(8)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, h: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ h not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, h: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ h not between/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceS (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.s).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: 0 }
  }, body => {
    expect(body.s).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: 2 }
  }, body => {
    expect(body.s).to.be.eql(2)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ s not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: 133 }
  }, body => {
    expect(body._messages[0]).to.match(/ s not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: '8' }
  }, body => {
    expect(body.s).to.be.eq(8)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ s not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, s: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ s not between/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceN (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.n).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: 0 }
  }, body => {
    expect(body.n).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: 2 }
  }, body => {
    expect(body.n).to.be.eql(2)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: -1 }
  }, body => {
    expect(body._messages[0]).to.match(/ n not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: 16 }
  }, body => {
    expect(body._messages[0]).to.match(/ n not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: '8' }
  }, body => {
    expect(body.n).to.be.eq(8)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: 'eight' }
  }, body => {
    expect(body._messages[0]).to.match(/ n not between/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, n: [8] }
  }, body => {
    expect(body._messages[0]).to.match(/ n not between/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(4)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceC (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [] }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [0] }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [0, 0] }
  }, body => {
    expect(body.c).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [2] }
  }, body => {
    expect(body.c).to.be.eql([2])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [2, 0] }
  }, body => {
    expect(body.c).to.be.eql([2])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: 0 }
  }, body => {
    expect(body._messages[0]).to.match(/ c is not an array/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: 8 }
  }, body => {
    expect(body._messages[0]).to.match(/ c is not an array/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [-1] }
  }, body => {
    expect(body._messages[0]).to.match(/some c entries are not/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: [16] }
  }, body => {
    expect(body._messages[0]).to.match(/some c entries are not/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: ['8'] }
  }, body => {
    expect(body.c).to.be.eql([8])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, c: ['eight'] }
  }, body => {
    expect(body._messages[0]).to.match(/some c entries are not/)
  }, 400)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(7)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceT (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.t).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: [] }
  }, body => {
    expect(body.t).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: [' '] }
  }, body => {
    expect(body.t).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: [' ', ' '] }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array of length/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: ['text'] }
  }, body => {
    expect(body.t).to.be.eql(['text'])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: ['text', ' '] }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array of length/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: '' }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: 'text' }
  }, body => {
    expect(body._messages[0]).to.match(/ t is not an array/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: ['x'.repeat(33)] }
  }, body => {
    expect(body._messages[0]).to.match(/ t entries do not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 3, t: ['x'.repeat(33)] }
  }, body => {
    expect(body.t).to.be.eql(['x'.repeat(33)])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 3, t: ['x'.repeat(129)] }
  }, body => {
    expect(body._messages[0]).to.match(/ t entries do not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, t: [888] }
  }, body => {
    expect(body.t).to.be.eql(['888'])
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(6)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceB (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.b).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: [] }
  }, body => {
    expect(body.b).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: [' x '] }
  }, body => {
    expect(body.b).to.be.eql(['x'])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: ['  '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not matc/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: [' ', '  '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b is not an array of length/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: ['text'] }
  }, body => {
    expect(body.b).to.be.eql(['text'])
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: ['text', ' '] }
  }, body => {
    expect(body._messages[0]).to.match(/ b is not an array of length/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: '' }
  }, body => {
    expect(body._messages[0]).to.match(/ b is not an array/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: 'text' }
  }, body => {
    expect(body._messages[0]).to.match(/ b is not an array/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: ['x'.repeat(33)] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, l: 3, b: ['x'.repeat(33)] }
  }, body => {
    expect(body._messages[0]).to.match(/ b entries do not match/)
  }, 400)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, b: [888] }
  }, body => {
    expect(body.b).to.be.eql(['888'])
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(5)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiPieceExpires (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal }
  }, body => {
    expect(body.expires).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, expires: 1 }
  }, body => {
    expect(body.expires).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, expires: 2641467929 }
  }, body => {
    expect(body.expires).to.be.eql(undefined)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY' }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY', expires: 1 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZY', expires: 2641467929 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZZ' }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZZ', expires: 1 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { ...pieceMinimal, a: 'ZZZZZZZZ', expires: 2641467929 }
  }, body => {
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  }, 201)

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(5)
  })

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

describe('API - pieces', function () {
  runTests((api, version, room) => {
    describe('invalid pieces', () => testApiInvalidTable(api, version, room))
    describe('minimal pieces', () => testApiMinimalPiece(api, version, room))
    describe('valid id', () => testApiPieceID(api, version, room))
    describe('valid l', () => testApiPieceL(api, version, room))
    describe('valid a', () => testApiPieceA(api, version, room))
    describe('valid x', () => testApiPieceX(api, version, room))
    describe('valid y', () => testApiPieceY(api, version, room))
    describe('valid z', () => testApiPieceZ(api, version, room))
    describe('valid r', () => testApiPieceR(api, version, room))
    describe('valid w', () => testApiPieceW(api, version, room))
    describe('valid h', () => testApiPieceH(api, version, room))
    describe('valid s', () => testApiPieceS(api, version, room))
    describe('valid n', () => testApiPieceN(api, version, room))
    describe('valid c', () => testApiPieceC(api, version, room))
    describe('valid t', () => testApiPieceT(api, version, room))
    describe('valid b', () => testApiPieceB(api, version, room))
    describe('valid expires', () => testApiPieceExpires(api, version, room))
  })
})
