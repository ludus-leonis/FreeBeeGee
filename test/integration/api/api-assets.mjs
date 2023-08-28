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

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  expect,
  openTestroom,
  closeTestroom,
  testJsonGet,
  testJsonDelete
} from '../utils/chai.mjs'

// -----------------------------------------------------------------------------

export function testApiInvalidAsset (api, version, room) {
  openTestroom(api, room, 'Classic')

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

export function testApiMinimalAsset (api, version, room) {
  openTestroom(api, room, 'Classic')

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

export function testApiDeleteAsset (api, version, room) {
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
      describe('invalid assets', () => testApiInvalidAsset(api, version, room))
      describe('minimal assets', () => testApiMinimalAsset(api, version, room))
      describe('delete assets', () => testApiDeleteAsset(api, version, room))
    })
  })
}
