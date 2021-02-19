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
 * @param path Server within the api/ folder.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 */
function testJsonGet (path, payloadTests, status = 200) {
  it(`GET ${API_URL}${path}`, function (done) {
    chai.request(API_URL)
      .get(path)
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
 * @param path Server within the api/ folder.
 * @param payload Javascript object to send as JSON.
 * @param payloadTests Callback function. Will recieve the parsed payload for
 *                     further checking.
 */
function testJsonPost (path, payload, payloadTests, status = 200) {
  it(`POST ${API_URL}${path}`, function (done) {
    chai.request(API_URL)
      .post(path)
      .set('content-type', 'application/json')
      .send(payload)
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

// /**
//  * POST an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
//  * specific tests.
//  *
//  * @param path Server within the api/ folder.
//  * @param payload Javascript object to send as JSON.
//  * @param payloadTests Callback function. Will recieve the parsed payload for
//  *                     further checking.
//  */
// function testJsonPut (path, payload, payloadTests, status = 200) {
//   it(`PUT ${API_URL}${path}`, function (done) {
//     chai.request(API_URL)
//       .put(path)
//       .set('content-type', 'application/json')
//       .send(payload)
//       .end(function (err, res) {
//         expect(err).to.be.null
//         expect(res).to.have.status(status)
//         expect(res).to.be.json
//         expect(res.body).to.be.not.null
//         payloadTests(res.body)
//         done()
//       })
//   })
// }

// /**
//  * PATCH an JSON/Rest endpoint, do common HTTP tests on it, and then run payload-
//  * specific tests.
//  *
//  * @param path Server within the api/ folder.
//  * @param payload Javascript object to send as JSON.
//  * @param payloadTests Callback function. Will recieve the parsed payload for
//  *                     further checking.
//  */
// function testJsonPatch (path, payload, payloadTests, status = 200) {
//   it(`PUT ${API_URL}${path}`, function (done) {
//     chai.request(API_URL)
//       .patch(path)
//       .set('content-type', 'application/json')
//       .send(payload)
//       .end(function (err, res) {
//         expect(err).to.be.null
//         expect(res).to.have.status(status)
//         expect(res).to.be.json
//         expect(res.body).to.be.not.null
//         payloadTests(res.body)
//         done()
//       })
//   })
// }

// --- the actual tests --------------------------------------------------------

describe('API Server-Info', function () {
  testJsonGet('/', body => {
    expect(body).to.be.an('object')
    expect(body.createPassword).to.be.eql(true)
    expect(body.openSlots).to.be.eql(16)
    expect(body.ttl).to.be.eql(48)
    expect(body.version).to.match(/^[0-9]+\.[0-9]+\.[0-9]+/)
  })
})

describe('API Templates', function () {
  testJsonGet('/templates/', body => {
    expect(body).to.be.an('array')
    expect(body).to.include('RPG')
    expect(body).to.include('Classic')
  })
})

describe('CRUD game', function () {
  // get game - should not be there yet
  testJsonGet('/games/crudGame/', body => {
    expect(body).to.be.an('object')
    expect(body._errors).to.include('not found: crudGame')
  }, 404)

  // create game
  testJsonPost('/games/', {
    name: 'crudGame',
    template: 'RPG',
    auth: 'apitests'
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.name).to.be.eql('crudGame')
    expect(body.engine).to.be.eql(p.version)
    expect(body.tables).to.be.an('array')
    expect(body.tables[0].name).to.be.eql('Main')
    expect(body.tables[0].background).to.be.an('object')
    expect(body.tables[0].background.color).to.be.eql('#423e3d')
    expect(body.tables[0].background.scroller).to.be.eql('#2b2929')
    expect(body.tables[0].background.image).to.be.eql('img/desktop-wood.jpg')
    expect(body.tables[0].width).to.be.eql(3072)
    expect(body.tables[0].height).to.be.eql(2048)
    expect(body.tables[0].library).to.be.an('object')
    expect(body.tables[0].library.overlay).to.be.an('array')
    expect(body.tables[0].library.tile).to.be.an('array')
    expect(body.tables[0].library.token).to.be.an('array')
    expect(body.tables[0].template).to.be.an('object')
    expect(body.tables[0].template.type).to.be.eql('grid-square')
    expect(body.tables[0].template.gridSize).to.be.eql(64)
    expect(body.tables[0].template.width).to.be.eql(48)
    expect(body.tables[0].template.height).to.be.eql(32)
    expect(body.tables[0].template.version).to.be.eql(p.version)
    expect(body.tables[0].template.engine).to.be.eql('^' + p.version)
    expect(body.tables[0].template.colors).to.be.an('array')
  }, 201)

  // read game
  testJsonGet('/games/crudGame/', body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.name).to.be.eql('crudGame')
    expect(body.engine).to.be.eql(p.version)
    expect(body.tables).to.be.an('array')
    expect(body.tables[0].name).to.be.eql('Main')
    expect(body.tables[0].background).to.be.an('object')
    expect(body.tables[0].background.color).to.be.eql('#423e3d')
    expect(body.tables[0].background.scroller).to.be.eql('#2b2929')
    expect(body.tables[0].background.image).to.be.eql('img/desktop-wood.jpg')
    expect(body.tables[0].width).to.be.eql(3072)
    expect(body.tables[0].height).to.be.eql(2048)
    expect(body.tables[0].library).to.be.an('object')
    expect(body.tables[0].library.overlay).to.be.an('array')
    expect(body.tables[0].library.tile).to.be.an('array')
    expect(body.tables[0].library.token).to.be.an('array')
    expect(body.tables[0].template).to.be.an('object')
    expect(body.tables[0].template.type).to.be.eql('grid-square')
    expect(body.tables[0].template.gridSize).to.be.eql(64)
    expect(body.tables[0].template.width).to.be.eql(48)
    expect(body.tables[0].template.height).to.be.eql(32)
    expect(body.tables[0].template.version).to.be.eql(p.version)
    expect(body.tables[0].template.engine).to.be.eql('^' + p.version)
    expect(body.tables[0].template.colors).to.be.an('array')
  }, 200)

  // update game
  // [not possible yet]

  // delete game
  // [not possible yet]
})

describe('CRUD piece', function () {
  // create game
  testJsonPost('/games/', {
    name: 'crudPiece',
    template: 'RPG',
    auth: 'apitests'
  }, body => {
    expect(body).to.be.an('object')
    expect(body.name).to.be.eql('crudPiece')
  }, 201)

  // create piece
  testJsonPost('/games/crudPiece/pieces/', { // add letter-token
    layer: 'token',
    asset: 'dd74249373740cdf',
    width: 1,
    height: 1,
    x: 18,
    y: 8,
    z: 10,
    r: 0,
    side: 0,
    color: 1
  }, body => {
    expect(body).to.be.an('object')
    expect(body.id).to.match(/^[0-9a-f]+$/)
    expect(body.layer).to.be.eql('token')
    expect(body.asset).to.be.eql('dd74249373740cdf')
    expect(body.width).to.be.eql(1)
    expect(body.height).to.be.eql(1)
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.r).to.be.eql(0)
    expect(body.side).to.be.eql(0)
    expect(body.color).to.be.eql(1)
  }, 201)

  // get piece - done via get state - new item is always first
  testJsonGet('/games/crudPiece/state/', body => {
    expect(body).to.be.an('array')
    expect(body[0].layer).to.be.eql('token')
    expect(body[0].asset).to.be.eql('dd74249373740cdf')
    expect(body[0].width).to.be.eql(1)
    expect(body[0].height).to.be.eql(1)
    expect(body[0].x).to.be.eql(18)
    expect(body[0].y).to.be.eql(8)
    expect(body[0].z).to.be.eql(10)
    expect(body[0].r).to.be.eql(0)
    expect(body[0].side).to.be.eql(0)
    expect(body[0].color).to.be.eql(1)
  })

  // update game
  // [no test yet]

  // delete game
  // [no test yet]
})
