/**
 * @copyright 2021 Markus Leupold-Löwenthal
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

// Mocha / Chai tests for the API. To run them, you have to `gulp dist-test` and
// serve dist/FreeBeeGee/ using a local webserver. Then run `npm test`.
// Danger: the tests make destructive calls, so don't run against a live version.

const API_URL = 'http://play.local/api'
const p = require('../package.json')

// --- helpers -----------------------------------------------------------------

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
 */
function testJsonGet (path, payloadTests, status = 200, forward = null) {
  it(`GET ${API_URL}${path()}`, function (done) {
    chai.request(API_URL)
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
 * Upload a file to an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
 * specific tests.
 *
 * @param path Function to return a path (possibly with dynamic ID) during runtime.
 * @param name Function to return (possibly dynamic) table name.
 * @param upload Function to return (possibly dynamic) filename of file to upload.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 */
function testZIPUpload (path, name, auth, upload, payloadTests, status = 200) {
  it(`POST ${API_URL}${path()}`, function (done) {
    // const boundary = Math.random()
    chai.request(API_URL)
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
 */
function testJsonPost (path, payload, payloadTests, status = 200) {
  it(`POST ${API_URL}${path()}`, function (done) {
    chai.request(API_URL)
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
 */
function testJsonPut (path, payload, payloadTests, status = 200) {
  it(`PUT ${API_URL}${path()}`, function (done) {
    chai.request(API_URL)
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
 */
function testJsonPatch (path, payload, payloadTests, status = 200) {
  it(`PATCH ${API_URL}${path()}`, function (done) {
    chai.request(API_URL)
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
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 */
function testJsonDelete (path, status = 204) {
  it(`PUT ${API_URL}${path()}`, function (done) {
    chai.request(API_URL)
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

// --- the actual tests --------------------------------------------------------

let data = null

describe('API Server-Info', function () {
  testJsonGet(() => '/', body => {
    expect(body).to.be.an('object')
    expect(body.createPassword).to.be.eql(true)
    expect(body.freeTables).to.be.eql(16)
    expect(body.ttl).to.be.eql(48)
    expect(body.version).to.match(/^[0-9]+\.[0-9]+\.[0-9]+/)
  })
})

describe('API Templates', function () {
  testJsonGet(() => '/templates/', body => {
    expect(body).to.be.an('array')
    expect(body).to.include('RPG')
    expect(body).to.include('Classic')
  })
})

describe('CRUD table', function () {
  // get table - should not be there yet
  testJsonGet(() => '/tables/crudTable/', body => {
    expect(body).to.be.an('object')
    expect(body._messages).to.include('not found: crudTable')
  }, 404)

  // create table
  testJsonPost(() => '/tables/', () => {
    return {
      name: 'crudTable',
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.name).to.be.eql('crudTable')
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.background).to.be.an('object')
    expect(body.background.color).to.be.eql('#423e3d')
    expect(body.background.scroller).to.be.eql('#2b2929')
    expect(body.background.image).to.be.eql('img/desktop-wood.jpg')
    expect(body.width).to.be.eql(3072)
    expect(body.height).to.be.eql(2048)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay).to.be.an('array')
    expect(body.library.tile).to.be.an('array')
    expect(body.library.token).to.be.an('array')
    expect(body.template).to.be.an('object')
    expect(body.template.type).to.be.eql('grid-square')
    expect(body.template.snapSize).to.be.eql(32)
    expect(body.template.gridSize).to.be.eql(64)
    expect(body.template.gridWidth).to.be.eql(48)
    expect(body.template.gridHeight).to.be.eql(32)
    expect(body.template.version).to.be.eql(p.version)
    expect(body.template.engine).to.be.eql('^' + p.versionEngine)
    expect(body.template.colors).to.be.an('array')
  }, 201)

  // read table
  testJsonGet(() => '/tables/crudTable/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.name).to.be.eql('crudTable')
    expect(body.engine).to.be.eql(p.versionEngine)
    expect(body.background).to.be.an('object')
    expect(body.background.color).to.be.eql('#423e3d')
    expect(body.background.scroller).to.be.eql('#2b2929')
    expect(body.background.image).to.be.eql('img/desktop-wood.jpg')
    expect(body.width).to.be.eql(3072)
    expect(body.height).to.be.eql(2048)
    expect(body.library).to.be.an('object')
    expect(body.library.overlay).to.be.an('array')
    expect(body.library.tile).to.be.an('array')
    expect(body.library.token).to.be.an('array')
    expect(body.template).to.be.an('object')
    expect(body.template.type).to.be.eql('grid-square')
    expect(body.template.snapSize).to.be.eql(32)
    expect(body.template.gridSize).to.be.eql(64)
    expect(body.template.gridWidth).to.be.eql(48)
    expect(body.template.gridHeight).to.be.eql(32)
    expect(body.template.version).to.be.eql(p.version)
    expect(body.template.engine).to.be.eql('^' + p.versionEngine)
    expect(body.template.colors).to.be.an('array')
  }, 200)

  // update table
  // [not possible yet]

  // delete table
  // [not possible yet]
})

describe('CRUD state', function () {
  // create table
  testJsonPost(() => '/tables/', () => {
    return {
      name: 'crudState',
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql('crudState')
  }, 201)

  // get state
  testJsonGet(() => '/tables/crudState/states/1/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.gt(5)
    data = body
  })

  // get initial state
  testJsonGet(() => '/tables/crudState/states/0/', save => {
    expect(save).to.be.eql(data)
    data = save
  })

  // reset table
  testJsonPut(() => '/tables/crudState/states/1/', () => [], body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(0)
  })

  // get state again - still empty
  testJsonGet(() => '/tables/crudState/states/1/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(0)
  })

  // restore save
})

describe('CRUD piece', function () {
  // create table
  testJsonPost(() => '/tables/', () => {
    return {
      name: 'crudPiece',
      template: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql('crudPiece')
  }, 201)

  // create piece
  testJsonPost(() => '/tables/crudPiece/states/1/pieces/', () => {
    return { // add letter-token
      layer: 'token',
      asset: 'dd74249373740cdf',
      w: 1,
      h: 1,
      x: 18,
      y: 8,
      z: 10,
      r: 0,
      no: 2,
      side: 0,
      border: 1
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.layer).to.be.eql('token')
    expect(body.asset).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.no).to.be.eql(2)
    expect(body.side).to.not.exist
    expect(body.border).to.be.eql(1)
    data = body
  }, 201)

  // get & compare piece
  testJsonGet(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.layer).to.be.eql('token')
    expect(body.asset).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.no).to.be.eql(2)
    expect(body.side).to.not.exist
    expect(body.border).to.be.eql(1)
  })

  // update piece (patch)
  testJsonPatch(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/', () => {
    return {
      x: 19
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.layer).to.be.eql('token')
    expect(body.asset).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(19)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.no).to.be.eql(2)
    expect(body.side).to.not.exist
    expect(body.border).to.be.eql(1)
  })

  // get & compare piece
  testJsonGet(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.layer).to.be.eql('token')
    expect(body.asset).to.be.eql('dd74249373740cdf')
    expect(body.w).to.not.exist
    expect(body.h).to.not.exist
    expect(body.x).to.be.eql(19)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.not.exist
    expect(body.no).to.be.eql(2)
    expect(body.side).to.not.exist
    expect(body.border).to.be.eql(1)
  })

  // update/replace piece (put)
  testJsonPut(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/', () => {
    return {
      layer: 'tile',
      asset: '0d74249373740cdf',
      w: 2,
      h: 3,
      x: 17,
      y: 7,
      z: 27,
      r: 90,
      no: 5,
      side: 3,
      border: 2
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.layer).to.be.eql('tile')
    expect(body.asset).to.be.eql('0d74249373740cdf')
    expect(body.w).to.be.eql(2)
    expect(body.h).to.be.eql(3)
    expect(body.x).to.be.eql(17)
    expect(body.y).to.be.eql(7)
    expect(body.z).to.be.eql(27)
    expect(body.r).to.be.eql(90)
    expect(body.no).to.be.eql(5)
    expect(body.side).to.be.eql(3)
    expect(body.border).to.be.eql(2)
  })

  // get & compare piece
  testJsonGet(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.layer).to.be.eql('tile')
    expect(body.asset).to.be.eql('0d74249373740cdf')
    expect(body.w).to.be.eql(2)
    expect(body.h).to.be.eql(3)
    expect(body.x).to.be.eql(17)
    expect(body.y).to.be.eql(7)
    expect(body.z).to.be.eql(27)
    expect(body.r).to.be.eql(90)
    expect(body.no).to.be.eql(5)
    expect(body.side).to.be.eql(3)
    expect(body.border).to.be.eql(2)
  })

  // delete piece
  testJsonDelete(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/')

  // get - should be gone
  testJsonGet(() => '/tables/crudPiece/states/1/pieces/' + (data ? data.id : 'ID') + '/', body => {}, 404)
})

describe('ZIP upload - minimal', function () {
  testZIPUpload(
    () => '/tables/',
    () => { return 'minimalzip' },
    () => { return 'apitests' },
    () => { return 'test/data/empty.zip' },
    body => {
      expect(body).to.be.an('object')
      expect(body.id).to.match(/^[0-9a-f]+$/)
      expect(body.name).to.be.eql('minimalzip')
      expect(body.engine).to.be.eql(p.versionEngine)
      expect(body.background).to.be.an('object')
      expect(body.background.color).to.be.eql('#423e3d')
      expect(body.background.scroller).to.be.eql('#2b2929')
      expect(body.background.image).to.be.eql('img/desktop-wood.jpg')
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
      expect(body.template.snapSize).to.be.eql(32)
      expect(body.template.gridSize).to.be.eql(64)
      expect(body.template.gridWidth).to.be.eql(48)
      expect(body.template.gridHeight).to.be.eql(32)
      expect(body.template.version).to.be.eql(p.version)
      expect(body.template.engine).to.be.eql('^' + p.versionEngine)
      expect(body.template.colors).to.be.an('array')
      expect(body.template.colors.length).to.be.eql(2)
      expect(body.credits).to.be.eql('This snapshot does not provide license information.')
    }, 201)

  // get state 0
  testJsonGet(() => '/tables/minimalzip/states/0/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get state 1
  testJsonGet(() => '/tables/minimalzip/states/1/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get state 2
  testJsonGet(() => '/tables/minimalzip/states/2/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })
})

describe('ZIP upload - full', function () {
  testZIPUpload(
    () => '/tables/',
    () => { return 'fullziptest' },
    () => { return 'apitests' },
    () => { return 'test/data/full.zip' },
    body => {
      expect(body).to.be.an('object')
      expect(body.id).to.match(/^[0-9a-f]+$/)
      expect(body.name).to.be.eql('fullziptest')
      expect(body.engine).to.be.eql(p.versionEngine)
      expect(body.background).to.be.an('object')
      expect(body.background.color).to.be.eql('#423e3d')
      expect(body.background.scroller).to.be.eql('#2b2929')
      expect(body.background.image).to.be.eql('img/desktop-wood.jpg')
      expect(body.width).to.be.eql(3072)
      expect(body.height).to.be.eql(2048)
      expect(body.library).to.be.an('object')
      expect(body.library.other).to.be.an('array')
      expect(body.library.other.length).to.be.eql(1)
      expect(body.library.other[0].alias).to.be.eql('dicemat')
      expect(body.library.other[0].w).to.be.eql(4)
      expect(body.library.overlay).to.be.an('array')
      expect(body.library.overlay.length).to.be.eql(1)
      expect(body.library.overlay[0].alias).to.be.eql('area.1x1')
      expect(body.library.overlay[0].w).to.be.eql(1)
      expect(body.library.tile).to.be.an('array')
      expect(body.library.tile.length).to.be.eql(1)
      expect(body.library.tile[0].alias).to.be.eql('go')
      expect(body.library.tile[0].w).to.be.eql(9)
      expect(body.library.token).to.be.an('array')
      expect(body.library.token.length).to.be.eql(1)
      expect(body.library.token[0].alias).to.be.eql('generic.plain')
      expect(body.library.token[0].w).to.be.eql(1)
      expect(body.template).to.be.an('object')
      expect(body.template.type).to.be.eql('grid-square')
      expect(body.template.snapSize).to.be.eql(16)
      expect(body.template.gridSize).to.be.eql(64)
      expect(body.template.gridWidth).to.be.eql(48)
      expect(body.template.gridHeight).to.be.eql(32)
      expect(body.template.version).to.be.eql('1.2.3')
      expect(body.template.engine).to.be.eql('^0.1.0')
      expect(body.template.colors).to.be.an('array')
      expect(body.template.colors.length).to.be.eql(1)
      expect(body.credits).to.contain('I am a license.')
    }, 201)

  // get state 0
  testJsonGet(() => '/tables/fullziptest/states/0/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(4)
    expect(body[0].asset).to.be.eql('bb07ac49818bc000')
    expect(body[1].asset).to.be.eql('f628553dd1802f0a')
    expect(body[2].asset).to.be.eql('7261fff0158e27bc')
    expect(body[3].asset).to.be.eql('d04e9af5e03f9f58')
  })

  // get state 1
  testJsonGet(() => '/tables/fullziptest/states/1/', body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].asset).to.be.eql('bb07ac49818bc000')
    expect(body[1].asset).to.be.eql('f628553dd1802f0a')
  })

  // get state 2
  testJsonGet(() => '/tables/fullziptest/states/2/', body => {
    expect(body.length).to.be.eql(2)
    expect(body[0].asset).to.be.eql('7261fff0158e27bc')
    expect(body[1].asset).to.be.eql('d04e9af5e03f9f58')
  })

  // get state 3
  testJsonGet(() => '/tables/fullziptest/states/3/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })
})
