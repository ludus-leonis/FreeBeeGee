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

import shajs from 'sha.js'

import * as Test from '../utils/test.mjs'
const expect = Test.expect

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

let token = null

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function test401 (api, room) { // no token
  Test.openTestroom(api, room, 'Classic', 'myPassword')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    token = body.token
  }, 200)

  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 401)
  Test.jsonGet(api, () => `/rooms/${room}/digest/`, body => {}, 401)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {}, 401)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, body => {}, 401)
  Test.jsonGet(api, () => `/rooms/${room}/snapshot/`, body => {}, 401)

  Test.jsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 401)
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => {}, body => {}, 401)
  Test.jsonPost(api, () => `/rooms/${room}/assets/`, () => {}, body => {}, 401)
  Test.jsonDelete(api, () => `/rooms/${room}/assets/123/`, 401)
  Test.jsonDelete(api, () => `/rooms/${room}/assets/wAksS100/`, 401)

  Test.jsonPut(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 401)
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/`, () => {}, body => {}, 401)

  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 401)
  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 401)
  Test.jsonPatch(api, () => `/rooms/${room}/setup/`, () => {}, body => {}, 401)

  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, 401)
  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/`, 401)
  Test.jsonDelete(api, () => `/rooms/${room}/`, 401)

  Test.jsonGet(api, () => `/rooms/${room}/blah/`, body => {}, 404)

  Test.jsonDelete(api, () => `/rooms/${room}/`, 204, () => token)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function test403 (api, room) { // wrong token
  Test.openTestroom(api, room, 'Classic', 'myPassword')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    token = body.token
  }, 200)

  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/digest/`, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/snapshot/`, body => {}, 403, () => 'INVALID-TOKEN')

  Test.jsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonPost(api, () => `/rooms/${room}/assets/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonDelete(api, () => `/rooms/${room}/assets/123/`, 403, () => 'INVALID-TOKEN') // non-existing ID
  Test.jsonDelete(api, () => `/rooms/${room}/assets/wAksS100/`, 403, () => 'INVALID-TOKEN') // existing ID

  Test.jsonPut(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')

  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  Test.jsonPatch(api, () => `/rooms/${room}/setup/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')

  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, 403, () => 'INVALID-TOKEN')
  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/`, 403, () => 'INVALID-TOKEN')
  Test.jsonDelete(api, () => `/rooms/${room}/`, 403, () => 'INVALID-TOKEN')

  Test.jsonGet(api, () => `/rooms/${room}/blah/`, body => {}, 404, () => 'INVALID-TOKEN')

  Test.jsonDelete(api, () => `/rooms/${room}/`, 204, () => token)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function test20x (api, room) {
  // hint: 400 is also ok, as this means the permission checks were successfull

  Test.openTestroom(api, room, 'Classic', 'myPassword')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    token = body.token
  }, 200)

  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  Test.jsonGet(api, () => `/rooms/${room}/digest/`, body => {}, 200, () => token)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {}, 200, () => token)
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, body => {}, 200, () => token)
  Test.getBuffer(api, () => `/rooms/${room}/snapshot/`, header => {}, body => {}, 200, () => token)
  Test.getBufferQuery(api, () => `/rooms/${room}/snapshot/`, header => {}, body => {}, 200, () => shajs('sha256').update(`fbg-${token}`).digest('hex'))

  Test.jsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 400, () => token)
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/undo/`, () => {}, body => {}, 204, () => token)
  Test.jsonPost(api, () => `/rooms/${room}/assets/`, () => {}, body => {}, 400, () => token)
  Test.jsonDelete(api, () => `/rooms/${room}/assets/123/`, 204, () => token) // non-existing ID
  Test.jsonDelete(api, () => `/rooms/${room}/assets/wAksS100/`, 204, () => token) // existing ID

  Test.jsonPut(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, () => {}, body => {}, 400, () => token)
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/`, () => {}, body => {}, 400, () => token)

  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, () => {}, body => {}, 400, () => token)
  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 400, () => token)
  Test.jsonPatch(api, () => `/rooms/${room}/setup/`, () => {}, body => {}, 400, () => token)

  Test.jsonGet(api, () => `/rooms/${room}/blah/`, body => {}, 404, () => token)

  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, 204, () => token)
  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/`, 400, () => token)
  Test.jsonDelete(api, () => `/rooms/${room}/`, 204, () => token)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testPasswordChange (api, room) {
  Test.openTestroom(api, room, 'Classic')

  // --- login to public room results in 0000 token ----------------------------
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'wrongpassword'
    }
  }, body => {
    expect(body.token).to.be.eql('00000000-0000-0000-0000-000000000000')
    token = body.token
  }, 200)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => 'INVALID_TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  // --- change password - also changes token ----------------------------------
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    expect(body.token).not.to.be.eql('00000000-0000-0000-0000-000000000000')
    token = body.token
  }, 200, () => token)

  // room/login now requires password
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.eql(token)
  }, 200)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'wrongpassword'
    }
  }, body => {}, 403)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 401)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 403, () => 'INVALID_TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 401)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 403, () => 'INVALID_TOKEN')
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  // --- change password again - token stays -----------------------------------
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword2'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    expect(body.token).to.be.eql(token)
  }, 200, () => token)

  // room/login now requires different password but same token
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword2'
    }
  }, body => {
    expect(body.token).to.be.eql(token)
  }, 200)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {}, 403)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 401)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 403, () => 'INVALID_TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 401)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 403, () => 'INVALID_TOKEN')
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  // --- unset password - token reverts to 0000 --------------------------------
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: ''
    }
  }, body => {
    expect(body.token).to.be.eql('00000000-0000-0000-0000-000000000000')
  }, 200, () => token)

  // passwords now no longer matter
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'wrongpassword'
    }
  }, body => {
    expect(body.token).to.be.eql('00000000-0000-0000-0000-000000000000')
  }, 200)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => 'INVALID_TOKEN')
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  Test.jsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  Test.jsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  Test.closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - auth', function () {
    runner((api, version, room) => {
      describe('401 - no token', () => test401(api, room))
      describe('403 - invalid token', () => test403(api, room))
      describe('20x - valid token', () => test20x(api, room))
      describe('password change', () => testPasswordChange(api, room))
    })
  })
}
