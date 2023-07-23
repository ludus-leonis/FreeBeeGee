/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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
  p,
  expect,
  closeTestroom,
  testJsonGet,
  testJsonPost
} from '../utils/chai.mjs'

// -----------------------------------------------------------------------------

function testApiSetupRPG (api, version, room) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      snapshot: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(room)
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay.length).to.be.gte(5)
    expect(body.library.tile.length).to.be.gte(10)
    expect(body.library.token.length).to.be.gte(200)
    expect(body.library.other.length).to.be.gte(5)
    expect(body.library.badge.length).to.be.gte(2)
    expect(body.library.material.length).to.be.gte(3)
    expect(body.setup).to.be.an('object')
    expect(body.setup.type).to.be.eql('grid-square')
  }, 201)

  // check table
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.gte(16)
  })

  closeTestroom(api, room)
}

function testApiSetupHex (api, version, room) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      snapshot: 'Hex',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(room)
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay.length).to.be.gte(0)
    expect(body.library.tile.length).to.be.gte(10)
    expect(body.library.token.length).to.be.gte(200)
    expect(body.library.other.length).to.be.gte(5)
    expect(body.library.badge.length).to.be.gte(10)
    expect(body.library.material.length).to.be.gte(3)
    expect(body.setup).to.be.an('object')
    expect(body.setup.type).to.be.eql('grid-hex')
  }, 201)

  // check table
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.gte(16)
  })

  closeTestroom(api, room)
}

function testApiSetupClassic (api, version, room) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      snapshot: 'Classic',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(room)
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay.length).to.be.gte(1)
    expect(body.library.tile.length).to.be.gte(3)
    expect(body.library.token.length).to.be.gte(8)
    expect(body.library.other.length).to.be.gte(5)
    expect(body.library.badge.length).to.be.gte(2)
    expect(body.library.material.length).to.be.gte(3)
    expect(body.setup).to.be.an('object')
    expect(body.setup.type).to.be.eql('grid-square')
  }, 201)

  // check table
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1) // 1 sticky note
  })

  closeTestroom(api, room)
}

function testApiSetupTutorial (api, version, room) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      snapshot: 'Tutorial',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(room)
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay.length).to.be.gte(1)
    expect(body.library.tile.length).to.be.gte(1)
    expect(body.library.token.length).to.be.gte(1)
    expect(body.library.other.length).to.be.gte(1)
    expect(body.library.badge.length).to.be.gte(2)
    expect(body.library.material.length).to.be.gte(3)
    expect(body.setup).to.be.an('object')
    expect(body.setup.type).to.be.eql('grid-square')
  }, 201)

  // check table
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.gte(4)
  })

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

export function run (runner) {
  describe('API - snapshots', function () {
    runner((api, version, room) => {
      describe('RPG', () => testApiSetupRPG(api, version, room))
      describe('Hex', () => testApiSetupHex(api, version, room))
      describe('Classic', () => testApiSetupClassic(api, version, room))
      describe('Tutorial', () => testApiSetupTutorial(api, version, room))
    })
  })
}
