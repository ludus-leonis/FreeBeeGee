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

/* global describe, Buffer */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import * as fs from 'fs'

import * as Test from 'test/integration/utils/test.mjs'

const expect = Test.expect

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiZipMinimal (api, room) {
  Test.zipUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => Test.zipCreate(zip => {
      zip.addFile('none', Buffer.from('none'))
    }),
    body => {
      expect(body).to.be.an('object')
      expect(body).to.have.all.keys(['id', 'name', 'engine', 'width', 'height', 'library', 'setup', 'credits'])
      expect(body.id).to.match(Test.REGEXP.ID)
      expect(body.name).to.be.eql(room)
      expect(body.engine).to.be.eql(Test.p.versionEngine)
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.badge).to.be.an('array')
      expect(body.library.badge.length).to.be.eql(0 + Test.snapshot._.badge)
      expect(body.library.material).to.be.an('array')
      expect(body.library.material.length).to.be.eql(0 + Test.snapshot._.material)
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(0 + Test.snapshot._.other)
      expect(body.library.sticker).to.be.an('array')
      expect(body.library.sticker.length).to.be.eql(0 + Test.snapshot._.sticker)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(0 + Test.snapshot._.tile)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(0 + Test.snapshot._.token)
      expect(body.setup).to.be.an('object')
      expect(body.setup.type).to.be.eql('grid-square')
      expect(body.setup.gridSize).to.be.eql(64)
      expect(body.setup.gridWidth).to.be.eql(48)
      expect(body.setup.gridHeight).to.be.eql(32)
      expect(body.setup.version).to.be.eql(Test.p.version)
      expect(body.setup.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
      expect(body.setup.colors).to.be.an('array')
      expect(body.setup.colors.length).to.be.eql(13)
      expect(body.setup.borders).to.be.an('array')
      expect(body.setup.borders.length).to.be.eql(13)
      expect(body.credits).to.be.eql('This snapshot does not provide license information.')
    }, 201)

  // get table 0
  Test.jsonGet(api, () => `/rooms/${room}/tables/0/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get table 1
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get table 2
  Test.jsonGet(api, () => `/rooms/${room}/tables/2/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiZipFull (api, room) {
  Test.zipUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => { return fs.readFileSync('.cache/snapshots/full.zip') },
    body => {
      expect(body).to.be.an('object')
      expect(body).to.have.all.keys(['id', 'name', 'engine', 'width', 'height', 'library', 'setup', 'credits'])
      expect(body.id).to.match(Test.REGEXP.ID)
      expect(body.name).to.be.eql(room)
      expect(body.engine).to.be.eql(Test.p.versionEngine)
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.badge).to.be.an('array')
      expect(body.library.badge.length).to.be.eql(1 + Test.snapshot._.badge)
      expect(body.library.badge[body.library.badge.length - 1].name).to.be.eql('extra')
      expect(body.library.badge[body.library.badge.length - 1].w).to.be.eql(undefined)
      expect(body.library.material).to.be.an('array')
      expect(body.library.material.length).to.be.eql(1 + Test.snapshot._.material)
      expect(body.library.material[body.library.material.length - 1].name).to.be.eql('wood')
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(1 + Test.snapshot._.other)
      expect(body.library.other[body.library.other.length - 1].name).to.be.eql('aaa')
      expect(body.library.other[body.library.other.length - 1].w).to.be.eql(4)
      expect(body.library.sticker).to.be.an('array')
      expect(body.library.sticker.length).to.be.eql(1 + Test.snapshot._.sticker)
      expect(body.library.sticker[body.library.sticker.length - 1].name).to.be.eql('aab.1x1')
      expect(body.library.sticker[body.library.sticker.length - 1].w).to.be.eql(undefined)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(1 + Test.snapshot._.tile)
      expect(body.library.tile[body.library.tile.length - 1].name).to.be.eql('aac')
      expect(body.library.tile[body.library.tile.length - 1].w).to.be.eql(9)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(1 + Test.snapshot._.token)
      expect(body.library.token[body.library.token.length - 1].name).to.be.eql('aad.plain')
      expect(body.library.token[body.library.token.length - 1].w).to.be.eql(undefined)
      expect(body.setup).to.be.an('object')
      expect(body.setup.type).to.be.eql('grid-square')
      expect(body.setup.gridSize).to.be.eql(64)
      expect(body.setup.gridWidth).to.be.eql(48)
      expect(body.setup.gridHeight).to.be.eql(32)
      expect(body.setup.version).to.be.eql(Test.p.version)
      expect(body.setup.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
      expect(body.setup.colors).to.be.an('array')
      expect(body.setup.colors.length).to.be.eql(1)
      expect(body.credits).to.contain('I am a license.')
    }, 201)

  // get table 1
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].a).to.be.eql('bb0bc000')
    expect(body[1].a).to.be.eql('f6285f0a')
  })

  // get table 2
  Test.jsonGet(api, () => `/rooms/${room}/tables/2/`, body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].a).to.be.eql('726e27bc')
    expect(body[1].a).to.be.eql('d04e9f58')
  })

  // get table 3
  Test.jsonGet(api, () => `/rooms/${room}/tables/3/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  Test.closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - uploads', function () {
    runner((api, version, room) => {
      describe('ZIP upload - minimal', () => testApiZipMinimal(api, room))
      describe('ZIP upload - full', () => testApiZipFull(api, room))
    })
  })
}
