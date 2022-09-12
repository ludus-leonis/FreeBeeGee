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
  REGEXP_DIGEST,
  expect,
  runTests,
  openTestroom,
  closeTestroom,
  testGetBuffer,
  testJsonGet,
  testJsonPatch,
  testJsonPut
} from './utils/chai.mjs'

import {
  pieceMinimal
} from './utils/data.mjs'

let digest = null
let data = null

function gencrctable () {
  let c
  const crcTable = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
    }
    crcTable[n] = c
  }
  return crcTable
}

const crcTable = gencrctable()

function crc32 (str) {
  let crc = 0 ^ (-1)

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
  }

  return 'crc32:' + ((crc ^ (-1)) >>> 0)
}

// -----------------------------------------------------------------------------

function testApiRoomDigest (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
    expect(body.template.gridWidth).to.be.eql(64)
    expect(body.template.gridHeight).to.be.eql(64)
    data = body
  }, 200)

  // fetch digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body).to.be.an('object')
    expect(body['room.json']).to.match(REGEXP_DIGEST)
    digest = body['room.json']
  })

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
  }, 200)

  // get didn't change digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // change of template should change room digest
  testJsonPatch(api, () => `/rooms/${room}/template/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).not.to.be.eql(digest)
  })

  // change it back and digest should revert
  testJsonPatch(api, () => `/rooms/${room}/template/`, () => {
    return {
      gridWidth: 64,
      gridHeight: 64
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(64)
    expect(body.gridHeight).to.be.eql(64)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // change of table should not change room digest
  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
    data = body[0].id
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // change of piece should not change room digest
  testJsonPatch(api, () => `/rooms/${room}/tables/9/pieces/${data}/`, () => {
    return { w: 8 }
  }, body => {
    expect(body.w).to.be.eql(8)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiTableDigest (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(1)
  }, 200)

  // fetch digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP_DIGEST)
    digest = body['tables/9.json']
  })

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  }, 200)

  // get didn't change digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP_DIGEST)
    expect(body['tables/9.json']).to.be.eql(digest)
  })

  // change of template should not change table digest
  testJsonPatch(api, () => `/rooms/${room}/template/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP_DIGEST)
    expect(body['tables/9.json']).to.be.eql(digest)
  })

  // change of table should change table digest
  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
    data = body[0].id
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP_DIGEST)
    expect(body['tables/9.json']).not.to.be.eql(digest)
    digest = body['tables/9.json']
  })

  // change of piece should change digest again
  testJsonPatch(api, () => `/rooms/${room}/tables/9/pieces/${data}/`, () => {
    return { w: 8 }
  }, body => {
    expect(body.w).to.be.eql(8)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP_DIGEST)
    expect(body['tables/9.json']).not.to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiTemplateDigest (api, version, room) {
  openTestroom(api, room, 'Classic')

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
    expect(body.template.gridWidth).to.be.eql(64)
    expect(body.template.gridHeight).to.be.eql(64)
    data = body
  }, 200)

  // fetch digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body).to.be.an('object')
    expect(body['template.json']).to.match(REGEXP_DIGEST)
    digest = body['template.json']
  })

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
  }, 200)

  // get didn't change digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['template.json']).to.be.eql(digest)
  })

  // change of template should change template digest
  testJsonPatch(api, () => `/rooms/${room}/template/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['template.json']).not.to.be.eql(digest)
  })

  // change it back and digest should revert
  testJsonPatch(api, () => `/rooms/${room}/template/`, () => {
    return {
      gridWidth: 64,
      gridHeight: 64
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(64)
    expect(body.gridHeight).to.be.eql(64)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['template.json']).to.be.eql(digest)
  })

  // change of table should not change template digest
  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
    data = body[0].id
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['template.json']).to.be.eql(digest)
  })

  // change of piece should not change room digest
  testJsonPatch(api, () => `/rooms/${room}/tables/9/pieces/${data}/`, () => {
    return { w: 8 }
  }, body => {
    expect(body.w).to.be.eql(8)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['template.json']).to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiDigestHeader (api, version, room) {
  openTestroom(api, room, 'Classic')

  // room digest
  testGetBuffer(api, () => `/rooms/${room}/`, headers => {
    expect(headers.digest).to.match(REGEXP_DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // table digest
  testGetBuffer(api, () => `/rooms/${room}/tables/1/`, headers => {
    expect(headers.digest).to.match(REGEXP_DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/1.json']).to.be.eql(digest)
  })

  // change room/template
  testJsonPatch(api, () => `/rooms/${room}/template/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })

  // room digest
  testGetBuffer(api, () => `/rooms/${room}/`, headers => {
    expect(headers.digest).to.match(REGEXP_DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // table digest
  testGetBuffer(api, () => `/rooms/${room}/tables/1/`, headers => {
    expect(headers.digest).to.match(REGEXP_DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/1.json']).to.be.eql(digest)
  })

  // change table
  testJsonPut(api, () => `/rooms/${room}/tables/1/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
  }, 200)

  // room digest
  testGetBuffer(api, () => `/rooms/${room}/`, headers => {
    expect(headers.digest).to.match(REGEXP_DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // table digest
  testGetBuffer(api, () => `/rooms/${room}/tables/1/`, headers => {
    expect(headers.digest).to.match(REGEXP_DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/1.json']).to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

describe('API - digests', function () {
  runTests((api, version, room) => {
    describe('room digest', () => testApiRoomDigest(api, version, room))
    describe('table digest', () => testApiTableDigest(api, version, room))
    describe('template digest', () => testApiTemplateDigest(api, version, room))
    describe('digest header', () => testApiDigestHeader(api, version, room))
  })
})
