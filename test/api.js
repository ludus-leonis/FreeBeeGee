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

/* global describe, it */
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. To run them, you have to `npm run gulp dist-test` and
// serve dist/FreeBeeGee/ using local webservers. Then run `npm test`.
// Danger: the tests make destructive calls, so don't run against a live version.

const p = require('../package.json')

// --- helpers -----------------------------------------------------------------

const fs = require('fs')
const chai = require('chai')
const expect = chai.expect
chai
  .use(require('chai-http'))
  .use(require('chai-match'))

/**
 * GET an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 * @param status Expected HTTP status.
 * @param forward Data to forward to the payload callback.
 */
function testJsonGet (api, path, payloadTests, status = 200, forward = null) {
  it(`GET ${api}${path()}`, function (done) {
    chai.request(api)
      .get(path())
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body, forward)
        done()
      })
  })
}

/**
 * GET an any endpoint, do common HTTP tests on it, and then run payload-
 * specific tests. Used for non-JSON endpoints e.g. data blobs.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 * @param status Expected HTTP status.
 * @param forward Data to forward to the payload callback.
 */
function testGet (api, path, payloadTests, status = 200, forward = null) {
  it(`GET ${api}${path()}`, function (done) {
    chai.request(api)
      .get(path())
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res.body).to.be.not.null
        payloadTests(res.body, forward)
        done()
      })
  })
}

/**
 * Upload a file to an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param name Function to return (possibly dynamic) room name.
 * @param upload Function to return (possibly dynamic) filename of file to upload.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 * @param status Expected HTTP status.
 */
function testZIPUpload (api, path, name, auth, upload, payloadTests, status = 200) {
  it(`POST ${api}${path()}`, function (done) {
    chai.request(api)
      .post(path())
      .field('name', name())
      .field('auth', auth())
      .attach('snapshot', upload())
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * POST an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param payload Function to return (possibly dynamic) object to send as JSON.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 * @param status Expected HTTP status.
 */
function testJsonPost (api, path, payload, payloadTests, status = 200) {
  it(`POST ${api}${path()}`, function (done) {
    chai.request(api)
      .post(path())
      .set('content-type', 'application/json')
      .send(payload())
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * POST an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param payload Function to return (possibly dynamic) object to send as JSON.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 * @param status Expected HTTP status.
*/
function testJsonPut (api, path, payload, payloadTests, status = 200) {
  it(`PUT ${api}${path()}`, function (done) {
    chai.request(api)
      .put(path())
      .set('content-type', 'application/json')
      .send(payload())
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * PATCH an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param payload Function to return (possibly dynamic) object to send as JSON.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 * @param status Expected HTTP status.
 */
function testJsonPatch (api, path, payload, payloadTests, status = 200) {
  it(`PATCH ${api}${path()}`, function (done) {
    chai.request(api)
      .patch(path())
      .set('content-type', 'application/json')
      .send(payload())
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res).to.be.json
        expect(res.body).to.be.not.null
        payloadTests(res.body)
        done()
      })
  })
}

/**
 * DELETE an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param status Expected HTTP status. Defaults to 204 = gone.
*/
function testJsonDelete (api, path, status = 204) {
  it(`DELETE ${api}${path()}`, function (done) {
    chai.request(api)
      .delete(path())
      .set('content-type', 'application/json')
      .end(function (err, res) {
        expect(err).to.be.null
        expect(res).to.have.status(status)
        expect(res.body).to.be.not.null
        expect(res.body).to.be.eql({}) // API returns empty json objects as "no content"
        done()
      })
  })
}

// --- the test code -----------------------------------------------------------

let data = null

function testApiServerInfo (api) {
  testJsonGet(api, () => '/', body => {
    expect(body).to.be.an('object')
    expect(body.createPassword).to.be.eql(true)
    expect(body.freeRooms).to.be.eql(16)
    expect(body.ttl).to.be.eql(48)
    expect(body.version).to.match(/^[0-9]+\.[0-9]+\.[0-9]+/)
  })
}

function testApiTemplates (api) {
  testJsonGet(api, () => '/templates/', body => {
    expect(body).to.be.an('array')
    expect(body).to.include('RPG')
    expect(body).to.include('Classic')
  })
}

function testApiCrudRoom (api, version) {
  // get room - should not be there yet
  testJsonGet(api, () => `/rooms/crudRoom${version}/`, body => {
    expect(body).to.be.an('object')
    expect(body._messages).to.include(`not found: crudRoom${version}`)
  }, 404)

  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: `crudRoom${version}`,
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.name).to.be.eql(`crudRoom${version}`)
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.backgrounds).to.be.an('array')
    expect(body.backgrounds[body.backgrounds.length - 1]).to.be.an('object')
    expect(body.backgrounds[body.backgrounds.length - 1].name).to.be.eql('Wood')
    expect(body.backgrounds[body.backgrounds.length - 1].color).to.be.eql('#57514d')
    expect(body.backgrounds[body.backgrounds.length - 1].scroller).to.be.eql('#3e3935')
    expect(body.backgrounds[body.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
    expect(body.width).to.be.eql(3072)
    expect(body.height).to.be.eql(2048)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay).to.be.an('array')
    expect(body.library.tile).to.be.an('array')
    expect(body.library.token).to.be.an('array')
    expect(body.template).to.be.an('object')
    expect(body.template.type).to.be.eql('grid-square')
    expect(body.template.gridSize).to.be.eql(64)
    expect(body.template.gridWidth).to.be.eql(48)
    expect(body.template.gridHeight).to.be.eql(32)
    expect(body.template.version).to.be.eql(p.version)
    expect(body.template.engine).to.be.eql(p.versionEngine)
    expect(body.template.colors).to.be.an('array')
  }, 201)

  // read room
  testJsonGet(api, () => `/rooms/crudRoom${version}/`, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.name).to.be.eql(`crudRoom${version}`)
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.backgrounds).to.be.an('array')
    expect(body.backgrounds[body.backgrounds.length - 1]).to.be.an('object')
    expect(body.backgrounds[body.backgrounds.length - 1].name).to.be.eql('Wood')
    expect(body.backgrounds[body.backgrounds.length - 1].color).to.be.eql('#57514d')
    expect(body.backgrounds[body.backgrounds.length - 1].scroller).to.be.eql('#3e3935')
    expect(body.backgrounds[body.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
    expect(body.width).to.be.eql(3072)
    expect(body.height).to.be.eql(2048)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay).to.be.an('array')
    expect(body.library.tile).to.be.an('array')
    expect(body.library.token).to.be.an('array')
    expect(body.template).to.be.an('object')
    expect(body.template.type).to.be.eql('grid-square')
    expect(body.template.gridSize).to.be.eql(64)
    expect(body.template.gridWidth).to.be.eql(48)
    expect(body.template.gridHeight).to.be.eql(32)
    expect(body.template.version).to.be.eql(p.version)
    expect(body.template.engine).to.be.eql(p.versionEngine)
    expect(body.template.colors).to.be.an('array')
  }, 200)

  // update room
  // [not possible yet]

  // delete room
  testJsonDelete(api, () => `/rooms/crudRoom${version}/`)
  testJsonGet(api, () => `/rooms/crudRoom${version}/`, body => {}, 404)
}

function testApiCrudTable (api, version) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: `crudTable${version}`,
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(`crudTable${version}`)
  }, 201)

  // get table
  testJsonGet(api, () => `/rooms/crudTable${version}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.gt(5)
    data = body
  })

  // reset room
  testJsonPut(api, () => `/rooms/crudTable${version}/tables/1/`, () => [], body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(0)
  })

  // get table again - still empty
  testJsonGet(api, () => `/rooms/crudTable${version}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(0)
  })

  // cleanup
  testJsonDelete(api, () => `/rooms/crudTable${version}/`)
}

function testApiCrudPiece (api, version) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: `crudPiece${version}`,
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(`crudPiece${version}`)
  }, 201)

  // create piece
  testJsonPost(api, () => `/rooms/crudPiece${version}/tables/1/pieces/`, () => {
    return { // add letter-token
      l: 4,
      a: 'dd74249373740cdf',
      w: 1,
      h: 1,
      x: 18,
      y: 8,
      z: 10,
      r: 0,
      n: 2,
      s: 0,
      c: [1]
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.n).to.be.eql(2)
    expect(body.s).to.not.exist
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
    data = body
  }, 201)

  // get & compare piece
  testJsonGet(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.n).to.be.eql(2)
    expect(body.s).to.not.exist
    expect(body.t).to.not.exist
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
  })

  // update piece (patch)
  testJsonPatch(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
    return {
      x: 19,
      t: ['  hello test  ']
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(19)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.n).to.be.eql(2)
    expect(body.s).to.not.exist
    expect(body.t).to.be.an('array')
    expect(body.t.length).to.be.eql(1)
    expect(body.t[0]).to.be.eql('hello test')
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
  })

  // get & compare piece
  testJsonGet(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(19)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.n).to.be.eql(2)
    expect(body.s).to.not.exist
    expect(body.t).to.be.an('array')
    expect(body.t.length).to.be.eql(1)
    expect(body.t[0]).to.be.eql('hello test')
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
  })

  // update/replace piece (put)
  testJsonPut(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
    return {
      l: 1,
      a: '0d74249373740cdf',
      w: 2,
      h: 3,
      x: 17,
      y: 7,
      z: 27,
      r: 0,
      n: 5,
      s: 3,
      t: ['    '],
      c: [2]
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(1)
    expect(body.a).to.be.eql('0d74249373740cdf')
    expect(body.w).to.be.eql(2)
    expect(body.h).to.be.eql(3)
    expect(body.x).to.be.eql(17)
    expect(body.y).to.be.eql(7)
    expect(body.z).to.be.eql(27)
    expect(body.r).to.not.exist
    expect(body.n).to.be.eql(5)
    expect(body.s).to.be.eql(3)
    expect(body.t).to.not.exist
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(2)
  })

  // get & compare piece
  testJsonGet(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(1)
    expect(body.a).to.be.eql('0d74249373740cdf')
    expect(body.w).to.be.eql(2)
    expect(body.h).to.be.eql(3)
    expect(body.x).to.be.eql(17)
    expect(body.y).to.be.eql(7)
    expect(body.z).to.be.eql(27)
    expect(body.r).to.not.exist
    expect(body.n).to.be.eql(5)
    expect(body.s).to.be.eql(3)
    expect(body.t).to.not.exist
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(2)
  })

  // delete piece
  testJsonDelete(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/')

  // get - should be gone
  testJsonGet(api, () => `/rooms/crudPiece${version}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {}, 404)

  // cleanup
  testJsonDelete(api, () => `/rooms/crudPiece${version}/`)
}

function testApiCrudPointer (api, version) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: `crudPointer${version}`,
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(`crudPointer${version}`)
  }, 201)

  // create pointer
  testJsonPost(api, () => `/rooms/crudPointer${version}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'ffffffffffffffff',
      l: 4,
      x: 100,
      y: 200,
      z: 300
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql('ffffffffffffffff')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('ffffffffffffffff')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(100)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.r).to.not.exist
    expect(body.n).to.not.exist
    expect(body.s).to.not.exist
    expect(body.c).to.not.exist
    data = body
  }, 201)

  // one piece on table
  testJsonGet(api, () => `/rooms/crudPointer${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ffffffffffffffff')
  })

  // create again
  testJsonPost(api, () => `/rooms/crudPointer${version}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'ffffffffffffffff',
      l: 4,
      x: 100,
      y: 200,
      z: 300
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql('ffffffffffffffff')
  }, 201)

  // still one piece on table
  testJsonGet(api, () => `/rooms/crudPointer${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ffffffffffffffff')
  })

  // update piece (patch)
  testJsonPatch(api, () => `/rooms/crudPointer${version}/tables/5/pieces/ffffffffffffffff/`, () => {
    return {
      x: 1000
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql('ffffffffffffffff')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('ffffffffffffffff')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(1000)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.r).to.not.exist
    expect(body.n).to.not.exist
    expect(body.s).to.not.exist
    expect(body.c).to.not.exist
  })

  // still one piece on table
  testJsonGet(api, () => `/rooms/crudPointer${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ffffffffffffffff')
  })

  // delete piece
  testJsonDelete(api, () => `/rooms/crudPointer${version}/tables/5/pieces/ffffffffffffffff/`)

  // still one piece on table
  testJsonGet(api, () => `/rooms/crudPointer${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get - should be gone
  testJsonGet(api, () => `/rooms/crudPointer${version}/tables/5/pieces/ffffffffffffffff/`, body => {}, 404)

  // cleanup
  testJsonDelete(api, () => `/rooms/crudPointer${version}/`)
}

function testApiCrudLos (api, version) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: `testApiCrudLos${version}`,
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(`testApiCrudLos${version}`)
  }, 201)

  // create pointer
  testJsonPost(api, () => `/rooms/testApiCrudLos${version}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'fffffffffffffffe',
      l: 4,
      x: 100,
      y: 200,
      z: 300,
      w: -400,
      h: -500
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql('fffffffffffffffe')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('fffffffffffffffe')
    expect(body.x).to.be.eql(100)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.w).to.be.eql(-400)
    expect(body.h).to.be.eql(-500)
    expect(body.r).to.not.exist
    expect(body.n).to.not.exist
    expect(body.s).to.not.exist
    expect(body.c).to.not.exist
    data = body
  }, 201)

  // one piece on table
  testJsonGet(api, () => `/rooms/testApiCrudLos${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('fffffffffffffffe')
  })

  // create again
  testJsonPost(api, () => `/rooms/testApiCrudLos${version}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'fffffffffffffffe',
      l: 4,
      x: 100,
      y: 200,
      z: 300
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql('fffffffffffffffe')
  }, 201)

  // still one piece on table
  testJsonGet(api, () => `/rooms/testApiCrudLos${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('fffffffffffffffe')
  })

  // update piece (patch)
  testJsonPatch(api, () => `/rooms/testApiCrudLos${version}/tables/5/pieces/fffffffffffffffe/`, () => {
    return {
      x: 1000
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql('fffffffffffffffe')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('fffffffffffffffe')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(1000)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.r).to.not.exist
    expect(body.n).to.not.exist
    expect(body.s).to.not.exist
    expect(body.c).to.not.exist
  })

  // still one piece on table
  testJsonGet(api, () => `/rooms/testApiCrudLos${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('fffffffffffffffe')
  })

  // delete piece
  testJsonDelete(api, () => `/rooms/testApiCrudLos${version}/tables/5/pieces/fffffffffffffffe/`)

  // still one piece on table
  testJsonGet(api, () => `/rooms/testApiCrudLos${version}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get - should be gone
  testJsonGet(api, () => `/rooms/testApiCrudLos${version}/tables/5/pieces/fffffffffffffffe/`, body => {}, 404)

  // cleanup
  testJsonDelete(api, () => `/rooms/testApiCrudLos${version}/`)
}

function testApiZipMinimal (api, version) {
  testZIPUpload(api,
    () => '/rooms/',
    () => { return `minimalzip${version}` },
    () => { return 'apitests' },
    () => { return 'test/data/empty.zip' },
    body => {
      expect(body).to.be.an('object')
      expect(body.id).to.match(/^[0-9a-f]+$/)
      expect(body.name).to.be.eql(`minimalzip${version}`)
      expect(body.engine).to.be.eql(p.versionEngine)
      expect(body.backgrounds).to.be.an('array')
      expect(body.backgrounds[body.backgrounds.length - 1]).to.be.an('object')
      expect(body.backgrounds[body.backgrounds.length - 1].name).to.be.eql('Wood')
      expect(body.backgrounds[body.backgrounds.length - 1].color).to.be.eql('#57514d')
      expect(body.backgrounds[body.backgrounds.length - 1].scroller).to.be.eql('#3e3935')
      expect(body.backgrounds[body.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(0)
      expect(body.library.overlay).to.be.an('array')
      expect(body.library.overlay.length).to.be.eql(0)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(0)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(0)
      expect(body.template).to.be.an('object')
      expect(body.template.type).to.be.eql('grid-square')
      expect(body.template.gridSize).to.be.eql(64)
      expect(body.template.gridWidth).to.be.eql(48)
      expect(body.template.gridHeight).to.be.eql(32)
      expect(body.template.version).to.be.eql(p.version)
      expect(body.template.engine).to.be.eql(p.versionEngine)
      expect(body.template.colors).to.be.an('array')
      expect(body.template.colors.length).to.be.eql(2)
      expect(body.credits).to.be.eql('This snapshot does not provide license information.')
    }, 201)

  // get table 0
  testJsonGet(api, () => `/rooms/minimalzip${version}/tables/0/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get table 1
  testJsonGet(api, () => `/rooms/minimalzip${version}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get table 2
  testJsonGet(api, () => `/rooms/minimalzip${version}/tables/2/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // cleanup
  testJsonDelete(api, () => `/rooms/minimalzip${version}/`)
}

function testApiZipFull (api, version) {
  testZIPUpload(api,
    () => '/rooms/',
    () => { return `fullziptest${version}` },
    () => { return 'apitests' },
    () => { return 'test/data/full.zip' },
    body => {
      expect(body).to.be.an('object')
      expect(body.id).to.match(/^[0-9a-f]+$/)
      expect(body.name).to.be.eql(`fullziptest${version}`)
      expect(body.engine).to.be.eql(p.versionEngine)
      expect(body.backgrounds).to.be.an('array')
      expect(body.backgrounds[body.backgrounds.length - 1]).to.be.an('object')
      expect(body.backgrounds[body.backgrounds.length - 1].name).to.be.eql('Wood')
      expect(body.backgrounds[body.backgrounds.length - 1].color).to.be.eql('#57514d')
      expect(body.backgrounds[body.backgrounds.length - 1].scroller).to.be.eql('#3e3935')
      expect(body.backgrounds[body.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(1)
      expect(body.library.other[0].name).to.be.eql('dicemat')
      expect(body.library.other[0].w).to.be.eql(4)
      expect(body.library.overlay).to.be.an('array')
      expect(body.library.overlay.length).to.be.eql(1)
      expect(body.library.overlay[0].name).to.be.eql('area.1x1')
      expect(body.library.overlay[0].w).to.be.eql(1)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(1)
      expect(body.library.tile[0].name).to.be.eql('go')
      expect(body.library.tile[0].w).to.be.eql(9)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(1)
      expect(body.library.token[0].name).to.be.eql('generic.plain')
      expect(body.library.token[0].w).to.be.eql(1)
      expect(body.template).to.be.an('object')
      expect(body.template.type).to.be.eql('grid-square')
      expect(body.template.gridSize).to.be.eql(64)
      expect(body.template.gridWidth).to.be.eql(48)
      expect(body.template.gridHeight).to.be.eql(32)
      expect(body.template.version).to.be.eql('1.2.3')
      expect(body.template.engine).to.be.eql('1.0.0')
      expect(body.template.colors).to.be.an('array')
      expect(body.template.colors.length).to.be.eql(1)
      expect(body.credits).to.contain('I am a license.')
    }, 201)

  // get table 1
  testJsonGet(api, () => `/rooms/fullziptest${version}/tables/1/`, body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].a).to.be.eql('bb07ac49818bc000')
    expect(body[1].a).to.be.eql('f628553dd1802f0a')
  })

  // get table 2
  testJsonGet(api, () => `/rooms/fullziptest${version}/tables/2/`, body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].a).to.be.eql('7261fff0158e27bc')
    expect(body[1].a).to.be.eql('d04e9af5e03f9f58')
  })

  // get table 3
  testJsonGet(api, () => `/rooms/fullziptest${version}/tables/3/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // cleanup
  testJsonDelete(api, () => `/rooms/fullziptest${version}/`)
}

function testApiImageUpload (api, version) {
  // create room
  testJsonPost(api, () => '/rooms/', () => {
    return {
      name: `imageupload${version}`,
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql(`imageupload${version}`)
  }, 201)

  // get library size
  testJsonGet(api, () => `/rooms/imageupload${version}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    data = body.library
  }, 200)

  // upload asset
  const image = fs.readFileSync('test/data/tile.jpg', { encoding: 'utf8', flag: 'r' })
  testJsonPost(api, () => `/rooms/imageupload${version}/assets/`, () => {
    return {
      base64: Buffer.from(image).toString('base64'),
      bg: '#808080',
      format: 'jpg',
      h: 2,
      w: 3,
      type: 'tile',
      name: 'upload.test'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.bg).to.be.eql('#808080')
    expect(body.format).to.be.eql('jpg')
    expect(body.h).to.be.eql(2)
    expect(body.w).to.be.eql(3)
    expect(body.type).to.be.eql('tile')
    expect(body.name).to.be.eql('upload.test')
  }, 201)

  // library must contain asset now
  testJsonGet(api, () => `/rooms/imageupload${version}/`, body => {
    expect(body).to.be.an('object')
    expect(body.library).to.be.an('object')
    expect(body.library.tile.length).to.be.eql(data.tile.length + 1)

    const index = body.library.tile.length - 1

    expect(body.library.tile[index].id).to.be.an('string')
    expect(body.library.tile[index].media).to.be.an('array')
    expect(body.library.tile[index].media[0]).to.be.eql('upload.test.3x2x1.808080.jpg')
    expect(body.library.tile[index].bg).to.be.eql('#808080')
    expect(body.library.tile[index].h).to.be.eql(2)
    expect(body.library.tile[index].w).to.be.eql(3)
    expect(body.library.tile[index].type).to.be.eql('tile')
    expect(body.library.tile[index].name).to.be.eql('upload.test')
  }, 200)

  // check asset blob
  testGet(api, () => `/data/rooms/imageupload${version}/assets/tile/upload.test.3x2x1.808080.jpg`, body => {
    expect(body.toString('utf-8')).to.be.eql(image)
  }, 200)

  // cleanup
  testJsonDelete(api, () => `/rooms/imageupload${version}/`)
}

function testApiIssues (api, versionOK) {
  testJsonGet(api, () => '/issues/', body => {
    expect(body.phpOk).to.be.eql(versionOK)
    expect(body.moduleZip).to.be.eql(true)
  }, 200)
}

// --- the test runners --------------------------------------------------------

function runTests (version) {
  // const api = `http://play${version}.local/api`
  const api = 'http://localhost:8765/api'
  describe('API Server-Info', () => testApiServerInfo(api))
  describe('API Templates', () => testApiTemplates(api))
  describe('CRUD room', () => testApiCrudRoom(api, version))
  describe('CRUD table', () => testApiCrudTable(api, version))
  describe('CRUD piece', () => testApiCrudPiece(api, version))
  describe('CRUD pointer', () => testApiCrudPointer(api, version))
  describe('CRUD los', () => testApiCrudLos(api, version))
  describe('ZIP upload - minimal', () => testApiZipMinimal(api, version))
  describe('ZIP upload - full', () => testApiZipFull(api, version))
  describe('JPG upload', () => testApiImageUpload(api, version))
  describe('self diagnosis', () => testApiIssues(api, version !== '72'))
}

// describe('PHP 7.2', function () { runTests('72') })
// describe('PHP 7.3', function () { runTests('73') })
// describe('PHP 7.4', function () { runTests('74') })
describe('PHP 8.0', function () { runTests('80') })
