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
  openTestroom,
  closeTestroom
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

// --- the test runners --------------------------------------------------------

export function run (runner) {
  describe('API - assets', function () {
    runner((api, version, room) => {
      describe('invalid assets', () => testApiInvalidAsset(api, version, room))
      describe('minimal assets', () => testApiMinimalAsset(api, version, room))
    })
  })
}
