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
  p,
  expect,
  zipCreate,
  runTests,
  openTestroom,
  closeTestroom,
  testGetBuffer,
  testJsonGet,
  testJsonPost,
  testZIPUpload
} from './utils/chai.mjs'

import {
  LAYER_TILE
} from '../../src/js/view/room/tabletop/tabledata.mjs'

import * as fs from 'fs'

// -----------------------------------------------------------------------------

let data = null

const _ = { // asset count in system template
  other: 16,
  overlay: 17,
  tile: 2,
  token: 4,
  badge: 2
}

function testApiZipMinimal (api, version, room) {
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('none', Buffer.from('none'))
    }),
    body => {
      expect(body).to.be.an('object')
      expect(body).to.have.all.keys(['id', 'name', 'engine', 'width', 'height', 'library', 'template', 'credits'])
      expect(body.id).to.match(REGEXP_ID)
      expect(body.name).to.be.eql(room)
      expect(body.engine).to.be.eql(p.versionEngine)
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.badge).to.be.an('array')
      expect(body.library.badge.length).to.be.eql(0 + _.badge)
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(0 + _.other)
      expect(body.library.overlay).to.be.an('array')
      expect(body.library.overlay.length).to.be.eql(0 + _.overlay)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(0 + _.tile)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(0 + _.token)
      expect(body.template).to.be.an('object')
      expect(body.template.type).to.be.eql('grid-square')
      expect(body.template.gridSize).to.be.eql(64)
      expect(body.template.gridWidth).to.be.eql(48)
      expect(body.template.gridHeight).to.be.eql(32)
      expect(body.template.version).to.be.eql(p.version)
      expect(body.template.engine).to.be.eql(p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
      expect(body.template.colors).to.be.an('array')
      expect(body.template.colors.length).to.be.eql(13)
      expect(body.template.borders).to.be.an('array')
      expect(body.template.borders.length).to.be.eql(13)
      expect(body.credits).to.be.eql('This template does not provide license information.')
    }, 201)

  // get table 0
  testJsonGet(api, () => `/rooms/${room}/tables/0/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get table 1
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get table 2
  testJsonGet(api, () => `/rooms/${room}/tables/2/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

function testApiZipFull (api, version, room) {
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => { return fs.readFileSync('.cache/snapshots/full.zip') },
    body => {
      expect(body).to.be.an('object')
      expect(body).to.have.all.keys(['id', 'name', 'engine', 'width', 'height', 'library', 'template', 'credits'])
      expect(body.id).to.match(REGEXP_ID)
      expect(body.name).to.be.eql(room)
      expect(body.engine).to.be.eql(p.versionEngine)
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.badge).to.be.an('array')
      expect(body.library.badge.length).to.be.eql(1 + _.badge)
      expect(body.library.badge[body.library.badge.length - 1].name).to.be.eql('extra')
      expect(body.library.badge[body.library.badge.length - 1].w).to.be.eql(1)
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(1 + _.other)
      expect(body.library.other[body.library.other.length - 1].name).to.be.eql('aaa')
      expect(body.library.other[body.library.other.length - 1].w).to.be.eql(4)
      expect(body.library.overlay).to.be.an('array')
      expect(body.library.overlay.length).to.be.eql(1 + _.overlay)
      expect(body.library.overlay[body.library.overlay.length - 1].name).to.be.eql('aab.1x1')
      expect(body.library.overlay[body.library.overlay.length - 1].w).to.be.eql(1)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(1 + _.tile)
      expect(body.library.tile[body.library.tile.length - 1].name).to.be.eql('aac')
      expect(body.library.tile[body.library.tile.length - 1].w).to.be.eql(9)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(1 + _.token)
      expect(body.library.token[body.library.token.length - 1].name).to.be.eql('aad.plain')
      expect(body.library.token[body.library.token.length - 1].w).to.be.eql(1)
      expect(body.template).to.be.an('object')
      expect(body.template.type).to.be.eql('grid-square')
      expect(body.template.gridSize).to.be.eql(64)
      expect(body.template.gridWidth).to.be.eql(48)
      expect(body.template.gridHeight).to.be.eql(32)
      expect(body.template.version).to.be.eql(p.version)
      expect(body.template.engine).to.be.eql(p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
      expect(body.template.colors).to.be.an('array')
      expect(body.template.colors.length).to.be.eql(1)
      expect(body.credits).to.contain('I am a license.')
    }, 201)

  // get table 1
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].a).to.be.eql('bb0bc000')
    expect(body[1].a).to.be.eql('f6285f0a')
  })

  // get table 2
  testJsonGet(api, () => `/rooms/${room}/tables/2/`, body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].a).to.be.eql('726e27bc')
    expect(body[1].a).to.be.eql('d04e9f58')
  })

  // get table 3
  testJsonGet(api, () => `/rooms/${room}/tables/3/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  closeTestroom(api, room)
}

function testApiImageUpload (api, version, room) {
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

// --- the test runners --------------------------------------------------------

describe('API - uploads', function () {
  runTests((api, version, room) => {
    describe('ZIP upload - minimal', () => testApiZipMinimal(api, version, room))
    describe('ZIP upload - full', () => testApiZipFull(api, version, room))
    describe('JPG upload', () => testApiImageUpload(api, version, room))
  })
})
