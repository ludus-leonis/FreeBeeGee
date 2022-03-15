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
  runTests,
  openTestroom,
  closeTestroom
} from './utils/chai.mjs'

// -----------------------------------------------------------------------------

function testApiInvalidAsset (api, version, room) {
  openTestroom(api, room, 'Classic')

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiMinimalAsset (api, version, room) {
  openTestroom(api, room, 'Classic')

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

describe('API - assets', function () {
  runTests((api, version, room) => {
    describe('invalid assets', () => testApiInvalidAsset(api, version, room))
    describe('minimal assets', () => testApiMinimalAsset(api, version, room))
  })
})
