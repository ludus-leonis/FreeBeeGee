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

import shajs from 'sha.js'

import {
  runTests,
  openTestroom,
  testJsonGet,
  testJsonPost,
  testJsonPut,
  testJsonPatch,
  testJsonDelete,
  testGetBuffer,
  testGetBufferQuery,
  expect,
  closeTestroom
} from './utils/chai.mjs'

// -----------------------------------------------------------------------------

let token = null

function test401 (api, version, room) {
  openTestroom(api, room, 'Classic', 'myPassword')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    token = body.token
  }, 200)

  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 401)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {}, 401)
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {}, 401)
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, body => {}, 401)
  testJsonGet(api, () => `/rooms/${room}/snapshot/`, body => {}, 401)

  testJsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 401)
  testJsonPost(api, () => `/rooms/${room}/assets/`, () => {}, body => {}, 401)

  testJsonPut(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 401)
  testJsonPut(api, () => `/rooms/${room}/tables/1/`, () => {}, body => {}, 401)

  testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 401)
  testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 401)
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {}, body => {}, 401)

  testJsonDelete(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, 401)
  testJsonDelete(api, () => `/rooms/${room}/`, 401)

  testJsonGet(api, () => `/rooms/${room}/blah/`, body => {}, 404)

  testJsonDelete(api, () => `/rooms/${room}/`, 204, () => token)
}

function test403 (api, version, room) {
  openTestroom(api, room, 'Classic', 'myPassword')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    token = body.token
  }, 200)

  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonGet(api, () => `/rooms/${room}/snapshot/`, body => {}, 403, () => 'INVALID-TOKEN')

  testJsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonPost(api, () => `/rooms/${room}/assets/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')

  testJsonPut(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonPut(api, () => `/rooms/${room}/tables/1/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')

  testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {}, body => {}, 403, () => 'INVALID-TOKEN')

  testJsonDelete(api, () => `/rooms/${room}/tables/1/pieces/12345678/`, 403, () => 'INVALID-TOKEN')
  testJsonDelete(api, () => `/rooms/${room}/`, 403, () => 'INVALID-TOKEN')

  testJsonGet(api, () => `/rooms/${room}/blah/`, body => {}, 404, () => 'INVALID-TOKEN')

  testJsonDelete(api, () => `/rooms/${room}/`, 204, () => token)
}

function test20x (api, version, room) {
  // hint: 400 is also ok, as this means the permission checks were successfull

  openTestroom(api, room, 'Classic', 'myPassword')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    token = body.token
  }, 200)

  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {}, 200, () => token)
  testJsonGet(api, () => `/rooms/${room}/tables/1/`, body => {}, 200, () => token)
  testJsonGet(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, body => {}, 200, () => token)
  testGetBuffer(api, () => `/rooms/${room}/snapshot/`, header => {}, body => {}, 200, () => token)
  testGetBufferQuery(api, () => `/rooms/${room}/snapshot/`, header => {}, body => {}, 200, () => shajs('sha256').update(`fbg-${token}`).digest('hex'))

  testJsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 400, () => token)
  testJsonPost(api, () => `/rooms/${room}/assets/`, () => {}, body => {}, 400, () => token)

  testJsonPut(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, () => {}, body => {}, 400, () => token)
  testJsonPut(api, () => `/rooms/${room}/tables/1/`, () => {}, body => {}, 400, () => token)

  testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, () => {}, body => {}, 400, () => token)
  testJsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => {}, body => {}, 400, () => token)
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {}, body => {}, 400, () => token)

  testJsonGet(api, () => `/rooms/${room}/blah/`, body => {}, 404, () => token)

  testJsonDelete(api, () => `/rooms/${room}/tables/1/pieces/G1iUfa3J/`, 204, () => token)
  testJsonDelete(api, () => `/rooms/${room}/`, 204, () => token)
}

function testPasswordChange (api, version, room) {
  openTestroom(api, room, 'Classic')

  // --- login to public room results in 0000 token ----------------------------
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'wrongpassword'
    }
  }, body => {
    expect(body.token).to.be.eql('00000000-0000-0000-0000-000000000000')
    token = body.token
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => 'INVALID_TOKEN')
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  // --- change password - also changes token ----------------------------------
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    expect(body.token).not.to.be.eql('00000000-0000-0000-0000-000000000000')
    token = body.token
  }, 200, () => token)

  // room/login now requires password
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {
    expect(body.token).to.be.eql(token)
  }, 200)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'wrongpassword'
    }
  }, body => {}, 403)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 401)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 403, () => 'INVALID_TOKEN')
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 401)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 403, () => 'INVALID_TOKEN')
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  // --- change password again - token stays -----------------------------------
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword2'
    }
  }, body => {
    expect(body.token).to.be.an('string')
    expect(body.token).to.be.eql(token)
  }, 200, () => token)

  // room/login now requires different password but same token
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword2'
    }
  }, body => {
    expect(body.token).to.be.eql(token)
  }, 200)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'myPassword'
    }
  }, body => {}, 403)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 401)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 403, () => 'INVALID_TOKEN')
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 401)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 403, () => 'INVALID_TOKEN')
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  // --- unset password - token reverts to 0000 --------------------------------
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: ''
    }
  }, body => {
    expect(body.token).to.be.eql('00000000-0000-0000-0000-000000000000')
  }, 200, () => token)

  // passwords now no longer matter
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {
    return {
      password: 'wrongpassword'
    }
  }, body => {
    expect(body.token).to.be.eql('00000000-0000-0000-0000-000000000000')
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => 'INVALID_TOKEN')
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 200, () => token)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  testJsonPost(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400)
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => 'INVALID_TOKEN')
  testJsonPatch(api, () => `/rooms/${room}/auth/`, () => {}, body => {}, 400, () => token)

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

describe('API - auth', function () {
  runTests((api, version, room) => {
    describe('401 - no token', () => test401(api, version, room))
    describe('403 - invalid token', () => test403(api, version, room))
    describe('20x - valid token', () => test20x(api, version, room))
    describe('password change', () => testPasswordChange(api, version, room))
  })
})
