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

import * as fs from 'fs'

import * as Content from '../../../src/js/view/room/tabletop/content.mjs'

import * as Test from '../utils/test.mjs'
const expect = Test.expect

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

let data = null

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCreateAsset (api, room) {
  Test.openTestroom(api, room, 'RPG')

  // get library size
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    data = body.library
  }, 200)

  // upload asset
  const image = fs.readFileSync('test/data/tile.jpg', { encoding: 'utf8', flag: 'r' })
  Test.jsonPost(api, () => `/rooms/${room}/assets/`, () => {
    return {
      base64: Buffer.from(image).toString('base64'),
      bg: '#808080',
      format: 'jpg',
      h: 2,
      w: 3,
      d: 4,
      type: Content.LAYER.TILE,
      tx: 'wood',
      name: 'upload.test'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.bg).to.be.eql('#808080')
    expect(body.format).to.be.eql(undefined)
    expect(body.base64).to.be.eql(undefined)
    expect(body.h).to.be.eql(2)
    expect(body.w).to.be.eql(3)
    expect(body.d).to.be.eql(4)
    expect(body.type).to.be.eql(Content.LAYER.TILE)
    expect(body.name).to.be.eql('upload.test')
    expect(body.tx).to.be.eql('wood')
  }, 201)

  // library must contain asset now
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    expect(body.library.tile.length).to.be.eql(data.tile.length + 1)

    const index = body.library.tile.length - 1

    expect(body.library.tile[index].id).to.be.an('string')
    expect(body.library.tile[index].media).to.be.an('array')
    expect(body.library.tile[index].media[0]).to.be.eql('upload.test.3x2x1x4.808080.wood.jpg')
    expect(body.library.tile[index].bg).to.be.eql('#808080')
    expect(body.library.tile[index].h).to.be.eql(2)
    expect(body.library.tile[index].w).to.be.eql(3)
    expect(body.library.tile[index].d).to.be.eql(4)
    expect(body.library.tile[index].type).to.be.eql(Content.LAYER.TILE)
    expect(body.library.tile[index].name).to.be.eql('upload.test')
    expect(body.library.tile[index].tx).to.be.eql('wood')
  }, 200)

  // upload another asset
  Test.jsonPost(api, () => `/rooms/${room}/assets/`, () => {
    return {
      base64: Buffer.from(image).toString('base64'),
      bg: '#808080',
      format: 'jpg',
      h: 2,
      w: 3,
      d: 2, // default depth for tiles
      type: Content.LAYER.TILE,
      tx: 'wood',
      name: 'upload.test2'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.bg).to.be.eql('#808080')
    expect(body.h).to.be.eql(2)
    expect(body.w).to.be.eql(3)
    expect(body.d).to.be.eql(undefined)
    expect(body.type).to.be.eql(Content.LAYER.TILE)
    expect(body.name).to.be.eql('upload.test2')
    expect(body.tx).to.be.eql('wood')
  }, 201)

  // library must contain asset now
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    expect(body.library.tile.length).to.be.eql(data.tile.length + 2)

    const index = body.library.tile.length - 1

    expect(body.library.tile[index].id).to.be.an('string')
    expect(body.library.tile[index].media).to.be.an('array')
    expect(body.library.tile[index].media[0]).to.be.eql('upload.test2.3x2x1.808080.wood.jpg')
    expect(body.library.tile[index].bg).to.be.eql('#808080')
    expect(body.library.tile[index].h).to.be.eql(2)
    expect(body.library.tile[index].w).to.be.eql(3)
    expect(body.library.tile[index].d).to.be.eql(undefined)
    expect(body.library.tile[index].type).to.be.eql(Content.LAYER.TILE)
    expect(body.library.tile[index].name).to.be.eql('upload.test2')
    expect(body.library.tile[index].tx).to.be.eql('wood')
  }, 200)

  // check asset blob
  Test.getBuffer(api, () => `/data/rooms/${room}/assets/tile/upload.test2.3x2x1.808080.wood.jpg`, () => {}, (buffer) => {
    expect(buffer.toString('utf-8')).to.be.eql(image)
  }, 200)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUpdateAssetOtherBaseMask (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // check library
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
  }, 200)

  // patch name < 10 sides - _.d4Light
  Test.jsonPatch(api, () => `/rooms/${room}/assets/j8hqf000/`, () => {
    return {
      id: 'j8hqf000',
      name: 'barFoo.fooBar',
      tx: 'paper'
    }
  }, body => {
    expect(body.name).to.be.eql('barFoo.fooBar')
    expect(body.id).to.be.eql('EJwm7300')
    expect(body.type).to.be.eql('other')
    expect(body.w).to.be.eql(undefined)
    expect(body.h).to.be.eql(undefined)
    expect(body.bg).to.be.eql('2')
    expect(body.tx).to.be.eql('paper')
    expect(body.base).to.be.eql('barFoo.fooBar.1x1x0x5.2.paper.png')
    expect(body.mask).to.be.eql('barFoo.fooBar.1x1xXx5.2.paper.svg')
    for (const media of body.media) {
      expect(media.match(/barFoo.fooBar\.1x1x[0-9]x5\.2\.paper\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch name >= 10 sides - _.d12Dark
  Test.jsonPatch(api, () => `/rooms/${room}/assets/v8Vvg200/`, () => {
    return {
      id: 'v8Vvg200',
      name: 'fooBar.fooBar',
      tx: 'paper'
    }
  }, body => {
    expect(body.name).to.be.eql('fooBar.fooBar')
    expect(body.id).to.be.eql('uwlgt100')
    expect(body.type).to.be.eql('other')
    expect(body.w).to.be.eql(undefined)
    expect(body.h).to.be.eql(undefined)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('paper')
    expect(body.base).to.be.eql('fooBar.fooBar.1x1x00x5.1.paper.png')
    expect(body.mask).to.be.eql('fooBar.fooBar.1x1xXXx5.1.paper.svg')
    expect(body.media).to.be.eql([
      'fooBar.fooBar.1x1x01x5.1.paper.svg',
      'fooBar.fooBar.1x1x02x5.1.paper.svg',
      'fooBar.fooBar.1x1x03x5.1.paper.svg',
      'fooBar.fooBar.1x1x04x5.1.paper.svg',
      'fooBar.fooBar.1x1x05x5.1.paper.svg',
      'fooBar.fooBar.1x1x06x5.1.paper.svg',
      'fooBar.fooBar.1x1x07x5.1.paper.svg',
      'fooBar.fooBar.1x1x08x5.1.paper.svg',
      'fooBar.fooBar.1x1x09x5.1.paper.svg',
      'fooBar.fooBar.1x1x10x5.1.paper.svg',
      'fooBar.fooBar.1x1x11x5.1.paper.svg',
      'fooBar.fooBar.1x1x12x5.1.paper.svg'
    ])
  }, 200)

  // final full get
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUpdateAssetIDs (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // put 2 pieces on table
  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { // add letter-token
      l: 4,
      a: '73740cdf',
      x: 18,
      y: 8,
      z: 10
    }
  }, body => {}, 201)
  Test.jsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { // add die
      l: 4,
      a: 'j8hqf000',
      x: 22,
      y: 21,
      z: 11
    }
  }, body => {}, 201)

  // get & compare pieces before change
  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body[0].a).to.be.eql('j8hqf000')
    expect(body[1].a).to.be.eql('73740cdf')
  })

  // rename die asset
  Test.jsonPatch(api, () => `/rooms/${room}/assets/j8hqf000/`, () => {
    return {
      id: 'j8hqf000',
      name: 'barFoo.fooBar',
      tx: 'paper'
    }
  }, body => {
    expect(body.id).to.be.eql('EJwm7300') // new ID
  }, 200)

  // get & compare pieces after change - one piece changed
  Test.jsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body[0].a).to.be.eql('EJwm7300') // new
    expect(body[1].a).to.be.eql('73740cdf') // old
  })

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUpdateAssetConflict (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // patching first d4 asset works
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pJtgf000/`, () => {
    return {
      id: 'pJtgf000',
      name: 'patch.conflict',
      w: 8,
      h: 10
    }
  }, body => { //
    expect(body.name).to.be.eql('patch.conflict')
    expect(body.id).to.be.eql('S8aOf000')
    expect(body.w).to.be.eql(8)
    expect(body.h).to.be.eql(10)
  }, 200)

  // patching second d4 asset fails
  Test.jsonPatch(api, () => `/rooms/${room}/assets/j8hqf000/`, () => {
    return {
      id: 'j8hqf000',
      name: 'patch.conflict',
      w: 8,
      h: 10
    }
  }, body => {
    expect(body._messages[0]).to.match(/asset S8aOf000 already exists/)
  }, 409)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUpdateAssetStickerMaterial (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // check library
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
  }, 200)

  // patch name (_.zone.3x3)
  Test.jsonPatch(api, () => `/rooms/${room}/assets/GxcxR300/`, () => {
    return {
      id: 'GxcxR300',
      name: '_.fooBar',
      bg: '2'
    }
  }, body => {
    expect(body.name).to.be.eql('_.fooBar')
    expect(body.id).to.be.eql('pDGII000')
    expect(body.type).to.be.eql('sticker')
    expect(body.w).to.be.eql(3)
    expect(body.h).to.be.eql(undefined)
    expect(body.bg).to.be.eql('2')
    expect(body.tx).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch d - non-default
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      d: 2
    }
  }, body => {
    expect(body.d).to.be.eql(2)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xXx2.2.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch d - default
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      d: 0
    }
  }, body => {
    expect(body.d).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch known material
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      tx: 'wood'
    }
  }, body => {
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.wood.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch unknown material
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      tx: 'foobar'
    }
  }, body => {
    expect(body._messages[0]).to.match(/material foobar not found/)
  }, 400)

  // patch unknown material
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      tx: 'null'
    }
  }, body => {
    expect(body._messages[0]).to.match(/material null not found/)
  }, 400)

  // patch no material
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      tx: 'none'
    }
  }, body => {
    expect(body.tx).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch with bg
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      tx: 'linen',
      bg: null
    }
  }, body => {
    expect(body.tx).to.be.eql('linen')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.0.linen.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch no material
  Test.jsonPatch(api, () => `/rooms/${room}/assets/pDGII000/`, () => {
    return {
      id: 'kVTKu200',
      tx: null
    }
  }, body => {
    expect(body.tx).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // final full get
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUpdateAssetTileColor (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // check library
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
  }, 200)

  // patch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      bg: '3'
    }
  }, body => {
    expect(body.bg).to.be.eql('3')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.3.jpg'])
  }, 200)

  // unpatch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      bg: null
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.jpg'])
  }, 200)

  // patch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      bg: '#aabbcc'
    }
  }, body => {
    expect(body.bg).to.be.eql('#AABBCC')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.AABBCC.jpg'])
  }, 200)

  // patch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      bg: '#808080'
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.jpg'])
  }, 200)

  // patch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      bg: 'transparent'
    }
  }, body => {
    expect(body.bg).to.be.eql('transparent')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.transparent.jpg'])
  }, 200)

  // patch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      bg: '0'
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.jpg'])
  }, 200)

  // patch color
  Test.jsonPatch(api, () => `/rooms/${room}/assets/r67iL000/`, () => {
    return {
      id: 'r67iL000',
      tx: 'linen'
    }
  }, body => {
    expect(body.bg).to.be.eql('0')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.0.linen.jpg'])
  }, 200)

  // final full get
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiUpdateAssetToken (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // check library
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
  }, 200)

  // can't patch ID
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'foobar'
    }
  }, body => {
    expect(body._messages[0]).to.match(/invalid ID: foobar/)
  }, 400)

  // can't patch type
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'G8QAJ200',
      type: 'tile'
    }
  }, body => {
    expect(body.type).to.be.eql('token')
  }, 200)

  // can't patch media directly
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'G8QAJ200',
      media: []
    }
  }, body => {
    expect(body.media.length).to.be.eql(26)
  }, 200)

  // can't patch mask
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'G8QAJ200',
      mask: 'nope.png'
    }
  }, body => {
    expect(body.mask).to.be.eql(undefined)
  }, 200)

  // can't patch base
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'G8QAJ200',
      base: 'nope.png'
    }
  }, body => {
    expect(body.base).to.be.eql(undefined)
  }, 200)

  // can't patch unkown field
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'G8QAJ200',
      foobar: 'nope.png'
    }
  }, body => {
    expect(body._messages[0]).to.match(/ foobar unkown/)
  }, 400)

  // patch name
  Test.jsonPatch(api, () => `/rooms/${room}/assets/G8QAJ200/`, () => {
    return {
      id: 'G8QAJ200',
      name: 'blah'
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('rh0-6200')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(undefined) // default
    expect(body.h).to.be.eql(undefined) // default
    expect(body.d).to.be.eql(undefined) // default
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.1x1x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch w
  Test.jsonPatch(api, () => `/rooms/${room}/assets/rh0-6200/`, () => {
    return {
      id: 'rh0-6200',
      w: 5
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('rNqB1200')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(1)
    expect(body.d).to.be.eql(undefined) // default
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x1x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch h
  Test.jsonPatch(api, () => `/rooms/${room}/assets/rNqB1200/`, () => {
    return {
      id: 'rNqB1200',
      h: 3
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('HRXAK100')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.d).to.be.eql(undefined) // default
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch d - default
  Test.jsonPatch(api, () => `/rooms/${room}/assets/HRXAK100/`, () => {
    return {
      id: 'HRXAK100',
      d: 2
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('HRXAK100')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.d).to.be.eql(undefined)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch d - non-default
  Test.jsonPatch(api, () => `/rooms/${room}/assets/HRXAK100/`, () => {
    return {
      id: 'HRXAK100',
      d: 8
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('HRXAK100')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.d).to.be.eql(8)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]x8\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch tx
  Test.jsonPatch(api, () => `/rooms/${room}/assets/HRXAK100/`, () => {
    return {
      id: 'HRXAK100',
      tx: 'linen'
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('HRXAK100')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.d).to.be.eql(8)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('linen')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]x8\.1\.linen\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch bg
  Test.jsonPatch(api, () => `/rooms/${room}/assets/HRXAK100/`, () => {
    return {
      id: 'HRXAK100',
      bg: '3'
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('HRXAK100')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.d).to.be.eql(8)
    expect(body.bg).to.be.eql('3')
    expect(body.tx).to.be.eql('linen')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]x8\.3\.linen\.svg/)).to.be.an('array')
    }
  }, 200)

  // final full get
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.token.find(i => i.id === 'G8QAJ200')).to.be.eql(undefined) // original ID gone
    const newAsset = body.library.token.find(i => i.id === 'HRXAK100')

    expect(newAsset.name).to.be.eql('blah')
    expect(newAsset.id).to.be.eql('HRXAK100')
    expect(newAsset.type).to.be.eql('token')
    expect(newAsset.w).to.be.eql(5)
    expect(newAsset.h).to.be.eql(3)
    expect(newAsset.d).to.be.eql(8)
    expect(newAsset.bg).to.be.eql('3')
    expect(newAsset.tx).to.be.eql('linen')
    expect(newAsset.base).to.be.eql(undefined)
    expect(newAsset.mask).to.be.eql(undefined)
    for (const media of newAsset.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]x8\.3\.linen\.svg/)).to.be.an('array')
    }
  }, 200)

  Test.closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiDeleteAsset (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // check library
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete invalid id
  Test.jsonDelete(api, () => `/rooms/${room}/assets/blah/`, 204)

  // check library
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete sticker
  Test.jsonDelete(api, () => `/rooms/${room}/assets/EPccl300/`, 204) // _.area.4x4
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker - 1)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete tile
  Test.jsonDelete(api, () => `/rooms/${room}/assets/ZFRq_100/`, 204)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker - 1)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile - 1)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete token
  Test.jsonDelete(api, () => `/rooms/${room}/assets/GYWId200/`, 204)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker - 1)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile - 1)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token - 1)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete other
  Test.jsonDelete(api, () => `/rooms/${room}/assets/hFoyZ200/`, 204)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker - 1)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile - 1)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token - 1)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other - 1)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete badge
  Test.jsonDelete(api, () => `/rooms/${room}/assets/B5K2G200/`, 204)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker - 1)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile - 1)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token - 1)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other - 1)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge - 1)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  // delete material not possible
  Test.jsonDelete(api, () => `/rooms/${room}/assets/H4W0w000/`, 403)

  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.sticker.length).to.be.eql(Test.snapshot._.sticker + Test.snapshot.classic.sticker - 1)
    expect(body.library.tile.length).to.be.eql(Test.snapshot._.tile + Test.snapshot.classic.tile - 1)
    expect(body.library.token.length).to.be.eql(Test.snapshot._.token + Test.snapshot.classic.token - 1)
    expect(body.library.other.length).to.be.eql(Test.snapshot._.other + Test.snapshot.classic.other - 1)
    expect(body.library.badge.length).to.be.eql(Test.snapshot._.badge + Test.snapshot.classic.badge - 1)
    expect(body.library.material.length).to.be.eql(Test.snapshot._.material + Test.snapshot.classic.material)
  }, 200)

  Test.closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - assets', function () {
    runner((api, version, room) => {
      describe('create', () => testApiCreateAsset(api, room))
      describe('update (token)', () => testApiUpdateAssetToken(api, room))
      describe('update (tile/color)', () => testApiUpdateAssetTileColor(api, room))
      describe('update (sticker/material)', () => testApiUpdateAssetStickerMaterial(api, room))
      describe('update (other/base/mask)', () => testApiUpdateAssetOtherBaseMask(api, room))
      describe('update (conflict)', () => testApiUpdateAssetConflict(api, room))
      describe('update (table id change)', () => testApiUpdateAssetIDs(api, room))
      describe('delete', () => testApiDeleteAsset(api, room))
    })
  })
}
