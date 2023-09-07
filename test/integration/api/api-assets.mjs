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

import {
  expect,
  openTestroom,
  closeTestroom,
  testJsonGet,
  testJsonPatch,
  testJsonPost,
  testJsonDelete,
  testGetBuffer
} from '../utils/chai.mjs'

import {
  LAYER_TILE
} from '../../../src/js/view/room/tabletop/tabledata.mjs'

// -----------------------------------------------------------------------------

let data = null

function testApiCreateAsset (api, version, room) {
  openTestroom(api, room, 'RPG')

  // get library size
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    data = body.library
  }, 200)

  // upload asset
  const image = fs.readFileSync('test/data/tile.jpg', { encoding: 'utf8', flag: 'r' })
  testJsonPost(api, () => `/rooms/${room}/assets/`, () => {
    return {
      base64: Buffer.from(image).toString('base64'),
      bg: '#808080',
      format: 'jpg',
      h: 2,
      w: 3,
      type: LAYER_TILE,
      tx: 'wood',
      name: 'upload.test'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.bg).to.be.eql('#808080')
    expect(body.format).to.be.eql('jpg')
    expect(body.h).to.be.eql(2)
    expect(body.w).to.be.eql(3)
    expect(body.type).to.be.eql(LAYER_TILE)
    expect(body.name).to.be.eql('upload.test')
    expect(body.tx).to.be.eql('wood')
  }, 201)

  // library must contain asset now
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    expect(body.library.tile.length).to.be.eql(data.tile.length + 1)

    const index = body.library.tile.length - 1

    expect(body.library.tile[index].id).to.be.an('string')
    expect(body.library.tile[index].media).to.be.an('array')
    expect(body.library.tile[index].media[0]).to.be.eql('upload.test.3x2x1.808080.wood.jpg')
    expect(body.library.tile[index].bg).to.be.eql('#808080')
    expect(body.library.tile[index].h).to.be.eql(2)
    expect(body.library.tile[index].w).to.be.eql(3)
    expect(body.library.tile[index].type).to.be.eql(LAYER_TILE)
    expect(body.library.tile[index].name).to.be.eql('upload.test')
    expect(body.library.tile[index].tx).to.be.eql('wood')
  }, 200)

  // check asset blob
  testGetBuffer(api, () => `/data/rooms/${room}/assets/tile/upload.test.3x2x1.808080.wood.jpg`, () => {}, (buffer) => {
    expect(buffer.toString('utf-8')).to.be.eql(image)
  }, 200)

  closeTestroom(api, room)
}

function testApiUpdateAssetOtherBaseMask (api, version, room) {
  openTestroom(api, room, 'Classic')

  // check library
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.other.length).to.be.eql(16)
  }, 200)

  // patch name < 10 sides
  testJsonPatch(api, () => `/rooms/${room}/assets/xY7Gr200/`, () => {
    return {
      id: 'xY7Gr200',
      name: 'barFoo.fooBar',
      tx: 'paper'
    }
  }, body => {
    expect(body.name).to.be.eql('barFoo.fooBar')
    expect(body.id).to.be.eql('zM-sI100')
    expect(body.type).to.be.eql('other')
    expect(body.w).to.be.eql(1)
    expect(body.h).to.be.eql(1)
    expect(body.bg).to.be.eql('2')
    expect(body.tx).to.be.eql('paper')
    expect(body.base).to.be.eql('barFoo.fooBar.1x1x0.2.paper.png')
    expect(body.mask).to.be.eql('barFoo.fooBar.1x1xX.2.paper.svg')
    for (const media of body.media) {
      expect(media.match(/barFoo.fooBar\.1x1x[0-9]\.2\.paper\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch name >= 10 sides
  testJsonPatch(api, () => `/rooms/${room}/assets/aeS5y000/`, () => {
    return {
      id: 'aeS5y000',
      name: 'fooBar.fooBar',
      tx: 'paper'
    }
  }, body => {
    expect(body.name).to.be.eql('fooBar.fooBar')
    expect(body.id).to.be.eql('cp0Nn000')
    expect(body.type).to.be.eql('other')
    expect(body.w).to.be.eql(1)
    expect(body.h).to.be.eql(1)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('paper')
    expect(body.base).to.be.eql('fooBar.fooBar.1x1x00.1.paper.png')
    expect(body.mask).to.be.eql('fooBar.fooBar.1x1xXX.1.paper.svg')
    expect(body.media).to.be.eql([
      'fooBar.fooBar.1x1x01.1.paper.svg',
      'fooBar.fooBar.1x1x02.1.paper.svg',
      'fooBar.fooBar.1x1x03.1.paper.svg',
      'fooBar.fooBar.1x1x04.1.paper.svg',
      'fooBar.fooBar.1x1x05.1.paper.svg',
      'fooBar.fooBar.1x1x06.1.paper.svg',
      'fooBar.fooBar.1x1x07.1.paper.svg',
      'fooBar.fooBar.1x1x08.1.paper.svg',
      'fooBar.fooBar.1x1x09.1.paper.svg',
      'fooBar.fooBar.1x1x10.1.paper.svg',
      'fooBar.fooBar.1x1x11.1.paper.svg',
      'fooBar.fooBar.1x1x12.1.paper.svg'
    ])
  }, 200)

  // final full get
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(17)
    expect(body.library.tile.length).to.be.eql(12)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  closeTestroom(api, room)
}

function testApiUpdateAssetIDs (api, version, room) {
  openTestroom(api, room, 'Classic')

  // put 2 pieces on table
  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { // add letter-token
      l: 4,
      a: '73740cdf',
      x: 18,
      y: 8,
      z: 10
    }
  }, body => {}, 201)
  testJsonPost(api, () => `/rooms/${room}/tables/9/pieces/`, () => {
    return { // add die
      l: 4,
      a: 'xY7Gr200',
      x: 22,
      y: 21,
      z: 11
    }
  }, body => {}, 201)

  // get & compare pieces before change
  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body[0].a).to.be.eql('xY7Gr200')
    expect(body[1].a).to.be.eql('73740cdf')
  })

  // rename die asset
  testJsonPatch(api, () => `/rooms/${room}/assets/xY7Gr200/`, () => {
    return {
      id: 'xY7Gr200',
      name: 'barFoo.fooBar',
      tx: 'paper'
    }
  }, body => {
    expect(body.id).to.be.eql('zM-sI100') // new ID
  }, 200)

  // get & compare pieces after change - one piece changed
  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body[0].a).to.be.eql('zM-sI100') // new
    expect(body[1].a).to.be.eql('73740cdf') // old
  })

  closeTestroom(api, room)
}

function testApiUpdateAssetConflict (api, version, room) {
  openTestroom(api, room, 'Classic')

  // patching first d4 asset works
  testJsonPatch(api, () => `/rooms/${room}/assets/SHt9A300/`, () => {
    return {
      id: 'SHt9A300',
      name: 'patch.conflict',
      w: 8,
      h: 10
    }
  }, body => { //
    expect(body.name).to.be.eql('patch.conflict')
    expect(body.id).to.be.eql('HNxfT200')
    expect(body.w).to.be.eql(8)
    expect(body.h).to.be.eql(10)
  }, 200)

  // patching second d4 asset fails
  testJsonPatch(api, () => `/rooms/${room}/assets/xY7Gr200/`, () => {
    return {
      id: 'xY7Gr200',
      name: 'patch.conflict',
      w: 8,
      h: 10
    }
  }, body => {
    expect(body._messages[0]).to.match(/asset HNxfT200 already exists/)
  }, 409)

  closeTestroom(api, room)
}

function testApiUpdateAssetOverlayMaterial (api, version, room) {
  openTestroom(api, room, 'Classic')

  // check library
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.tile.length).to.be.eql(12)
  }, 200)

  // patch name
  testJsonPatch(api, () => `/rooms/${room}/assets/d3eZa200/`, () => {
    return {
      id: 'd3eZa200',
      name: '_.fooBar',
      bg: '2'
    }
  }, body => {
    expect(body.name).to.be.eql('_.fooBar')
    expect(body.id).to.be.eql('ehAVG100')
    expect(body.type).to.be.eql('overlay')
    expect(body.w).to.be.eql(3)
    expect(body.h).to.be.eql(3)
    expect(body.bg).to.be.eql('2')
    expect(body.tx).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch known material
  testJsonPatch(api, () => `/rooms/${room}/assets/ehAVG100/`, () => {
    return {
      id: 'd3eZa200',
      tx: 'wood'
    }
  }, body => {
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.wood.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch unknown material
  testJsonPatch(api, () => `/rooms/${room}/assets/ehAVG100/`, () => {
    return {
      id: 'd3eZa200',
      tx: 'foobar'
    }
  }, body => {
    expect(body._messages[0]).to.match(/material foobar not found/)
  }, 400)

  // patch unknown material
  testJsonPatch(api, () => `/rooms/${room}/assets/ehAVG100/`, () => {
    return {
      id: 'd3eZa200',
      tx: 'null'
    }
  }, body => {
    expect(body._messages[0]).to.match(/material null not found/)
  }, 400)

  // patch no material
  testJsonPatch(api, () => `/rooms/${room}/assets/ehAVG100/`, () => {
    return {
      id: 'd3eZa200',
      tx: 'none'
    }
  }, body => {
    expect(body.tx).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.2.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // patch with bg
  testJsonPatch(api, () => `/rooms/${room}/assets/ehAVG100/`, () => {
    return {
      id: 'd3eZa200',
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
  testJsonPatch(api, () => `/rooms/${room}/assets/ehAVG100/`, () => {
    return {
      id: 'd3eZa200',
      tx: null
    }
  }, body => {
    expect(body.tx).to.be.eql(undefined)
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql('_.fooBar.3x3xX.svg')
    expect(body.media).to.be.eql([])
  }, 200)

  // final full get
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(17)
    expect(body.library.tile.length).to.be.eql(12)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  closeTestroom(api, room)
}

function testApiUpdateAssetTileColor (api, version, room) {
  openTestroom(api, room, 'Classic')

  // check library
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.tile.length).to.be.eql(12)
  }, 200)

  // patch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      bg: '3'
    }
  }, body => {
    expect(body.bg).to.be.eql('3')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.3.jpg'])
  }, 200)

  // unpatch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      bg: null
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.jpg'])
  }, 200)

  // patch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      bg: '#aabbcc'
    }
  }, body => {
    expect(body.bg).to.be.eql('#AABBCC')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.AABBCC.jpg'])
  }, 200)

  // patch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      bg: '#808080'
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.jpg'])
  }, 200)

  // patch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      bg: 'transparent'
    }
  }, body => {
    expect(body.bg).to.be.eql('transparent')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.transparent.jpg'])
  }, 200)

  // patch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      bg: '0'
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.jpg'])
  }, 200)

  // patch color
  testJsonPatch(api, () => `/rooms/${room}/assets/Y6aoL100/`, () => {
    return {
      id: 'Y6aoL100',
      tx: 'linen'
    }
  }, body => {
    expect(body.bg).to.be.eql('#808080')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    expect(body.media).to.be.eql(['chess.8x8.0.linen.jpg'])
  }, 200)

  // final full get
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(17)
    expect(body.library.tile.length).to.be.eql(12)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  closeTestroom(api, room)
}

function testApiUpdateAssetToken (api, version, room) {
  openTestroom(api, room, 'Classic')

  // check library
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.token.length).to.be.eql(11)
  }, 200)

  // can't patch ID
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'foobar'
    }
  }, body => {
    expect(body._messages[0]).to.match(/invalid ID: foobar/)
  }, 400)

  // can't patch type
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'mAa-Q300',
      type: 'tile'
    }
  }, body => {
    expect(body.type).to.be.eql('token')
  }, 200)

  // can't patch media directly
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'mAa-Q300',
      media: []
    }
  }, body => {
    expect(body.media.length).to.be.eql(26)
  }, 200)

  // can't patch mask
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'mAa-Q300',
      mask: 'nope.png'
    }
  }, body => {
    expect(body.mask).to.be.eql(undefined)
  }, 200)

  // can't patch base
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'mAa-Q300',
      base: 'nope.png'
    }
  }, body => {
    expect(body.base).to.be.eql(undefined)
  }, 200)

  // can't patch unkown field
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'mAa-Q300',
      foobar: 'nope.png'
    }
  }, body => {
    expect(body._messages[0]).to.match(/ foobar unkown/)
  }, 400)

  // patch name
  testJsonPatch(api, () => `/rooms/${room}/assets/mAa-Q300/`, () => {
    return {
      id: 'mAa-Q300',
      name: 'blah'
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('MEyoI300')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(1)
    expect(body.h).to.be.eql(1)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.1x1x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch w
  testJsonPatch(api, () => `/rooms/${room}/assets/MEyoI300/`, () => {
    return {
      id: 'MEyoI300',
      w: 5
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('mxRXR100')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(1)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x1x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch h
  testJsonPatch(api, () => `/rooms/${room}/assets/mxRXR100/`, () => {
    return {
      id: 'mxRXR100',
      h: 3
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('V3FZs300')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('wood')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]\.1\.wood\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch tx
  testJsonPatch(api, () => `/rooms/${room}/assets/V3FZs300/`, () => {
    return {
      id: 'V3FZs300',
      tx: 'linen'
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('V3FZs300')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.bg).to.be.eql('1')
    expect(body.tx).to.be.eql('linen')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]\.1\.linen\.svg/)).to.be.an('array')
    }
  }, 200)

  // patch bg
  testJsonPatch(api, () => `/rooms/${room}/assets/V3FZs300/`, () => {
    return {
      id: 'V3FZs300',
      bg: '3'
    }
  }, body => {
    expect(body.name).to.be.eql('blah')
    expect(body.id).to.be.eql('V3FZs300')
    expect(body.type).to.be.eql('token')
    expect(body.w).to.be.eql(5)
    expect(body.h).to.be.eql(3)
    expect(body.bg).to.be.eql('3')
    expect(body.tx).to.be.eql('linen')
    expect(body.base).to.be.eql(undefined)
    expect(body.mask).to.be.eql(undefined)
    for (const media of body.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]\.3\.linen\.svg/)).to.be.an('array')
    }
  }, 200)

  // final full get
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.token.find(i => i.id === 'mAa-Q300')).to.be.eql(undefined) // original ID gone
    const newAsset = body.library.token.find(i => i.id === 'V3FZs300')

    expect(newAsset.name).to.be.eql('blah')
    expect(newAsset.id).to.be.eql('V3FZs300')
    expect(newAsset.type).to.be.eql('token')
    expect(newAsset.w).to.be.eql(5)
    expect(newAsset.h).to.be.eql(3)
    expect(newAsset.bg).to.be.eql('3')
    expect(newAsset.tx).to.be.eql('linen')
    expect(newAsset.base).to.be.eql(undefined)
    expect(newAsset.mask).to.be.eql(undefined)
    for (const media of newAsset.media) {
      expect(media.match(/blah\.5x3x[0-9][0-9]\.3\.linen\.svg/)).to.be.an('array')
    }
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiDeleteAsset (api, version, room) {
  openTestroom(api, room, 'Classic')

  // check library
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(17)
    expect(body.library.tile.length).to.be.eql(12)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete invalid id
  testJsonDelete(api, () => `/rooms/${room}/assets/blah/`, 204)

  // check library
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(17)
    expect(body.library.tile.length).to.be.eql(12)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete overlay
  testJsonDelete(api, () => `/rooms/${room}/assets/wPXsm000/`, 204)
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(16)
    expect(body.library.tile.length).to.be.eql(12)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete tile
  testJsonDelete(api, () => `/rooms/${room}/assets/lWh16200/`, 204)
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(16)
    expect(body.library.tile.length).to.be.eql(11)
    expect(body.library.token.length).to.be.eql(11)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete token
  testJsonDelete(api, () => `/rooms/${room}/assets/f_9xm000/`, 204)
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(16)
    expect(body.library.tile.length).to.be.eql(11)
    expect(body.library.token.length).to.be.eql(10)
    expect(body.library.other.length).to.be.eql(16)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete other
  testJsonDelete(api, () => `/rooms/${room}/assets/lPebe300/`, 204)
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(16)
    expect(body.library.tile.length).to.be.eql(11)
    expect(body.library.token.length).to.be.eql(10)
    expect(body.library.other.length).to.be.eql(15)
    expect(body.library.badge.length).to.be.eql(5)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete badge
  testJsonDelete(api, () => `/rooms/${room}/assets/wRe_l200/`, 204)
  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(16)
    expect(body.library.tile.length).to.be.eql(11)
    expect(body.library.token.length).to.be.eql(10)
    expect(body.library.other.length).to.be.eql(15)
    expect(body.library.badge.length).to.be.eql(4)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  // delete material not possible
  testJsonDelete(api, () => `/rooms/${room}/assets/Hb9tz200/`, 403)

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.library.overlay.length).to.be.eql(16)
    expect(body.library.tile.length).to.be.eql(11)
    expect(body.library.token.length).to.be.eql(10)
    expect(body.library.other.length).to.be.eql(15)
    expect(body.library.badge.length).to.be.eql(4)
    expect(body.library.material.length).to.be.eql(5)
  }, 200)

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

export function run (runner) {
  describe('API - assets', function () {
    runner((api, version, room) => {
      describe('create', () => testApiCreateAsset(api, version, room))
      describe('update (token)', () => testApiUpdateAssetToken(api, version, room))
      describe('update (tile/color)', () => testApiUpdateAssetTileColor(api, version, room))
      describe('update (overlay/material)', () => testApiUpdateAssetOverlayMaterial(api, version, room))
      describe('update (other/base/mask)', () => testApiUpdateAssetOtherBaseMask(api, version, room))
      describe('update (conflict)', () => testApiUpdateAssetConflict(api, version, room))
      describe('update (table id change)', () => testApiUpdateAssetIDs(api, version, room))
      describe('delete', () => testApiDeleteAsset(api, version, room))
    })
  })
}
