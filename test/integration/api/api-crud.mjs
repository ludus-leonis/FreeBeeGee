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

import Test, { expect } from '../utils/test.mjs'

import Content from '../../../src/js/view/room/tabletop/content.mjs'

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

let data = null

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCrudRoom (api, room) {
  // get room - should not be there yet
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body._messages).to.include(`room meta not found: ${room}`)
  }, 404)

  // create room
  Test.jsonPost(api, () => '/rooms/', () => {
    return {
      name: room,
      snapshot: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'name', 'engine', 'width', 'height', 'library', 'setup', 'credits'])
    expect(body.id).to.match(Test.REGEXP.ID)
    expect(body.name).to.be.eql(room)
    expect(body.engine).to.be.eql(Test.p.versionEngine)
    expect(body.width).to.be.eql(3072)
    expect(body.height).to.be.eql(2048)
    expect(body.library).to.be.an('object')
    expect(Object.keys(body.library)).to.have.members([Content.LAYER.TILE, Content.LAYER.TOKEN, Content.LAYER.STICKER, 'badge', 'material', Content.LAYER.OTHER])
    expect(body.library.sticker).to.be.an('array')
    expect(body.library.tile).to.be.an('array')
    expect(body.library.token).to.be.an('array')
    expect(body.library.material).to.be.an('array')
    expect(body.library.badge).to.be.an('array')
    expect(body.library.material).to.be.an('array')
    expect(body.setup).to.be.an('object')
    expect(Object.keys(body.setup)).to.have.members(['type', 'version', 'engine', 'gridSize', 'gridWidth', 'gridHeight', 'colors', 'borders'])
    expect(body.setup.type).to.be.eql('grid-square')
    expect(body.setup.gridSize).to.be.eql(64)
    expect(body.setup.gridWidth).to.be.eql(48)
    expect(body.setup.gridHeight).to.be.eql(32)
    expect(body.setup.version).to.be.eql(Test.p.version)
    expect(body.setup.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
    expect(body.setup.colors).to.be.an('array')
    expect(body.setup.borders).to.be.an('array')
  }, 201)

  // read room
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'name', 'engine', 'width', 'height', 'library', 'setup', 'credits'])
    expect(body.id).to.match(Test.REGEXP.ID)
    expect(body.name).to.be.eql(room)
    expect(body.engine).to.be.eql(Test.p.versionEngine)
    expect(body.width).to.be.eql(3072)
    expect(body.height).to.be.eql(2048)
    expect(body.library).to.be.an('object')
    expect(Object.keys(body.library)).to.have.members([Content.LAYER.TILE, Content.LAYER.TOKEN, Content.LAYER.STICKER, 'badge', 'material', Content.LAYER.OTHER])
    expect(body.library.sticker).to.be.an('array')
    expect(body.library.tile).to.be.an('array')
    expect(body.library.token).to.be.an('array')
    expect(body.library.material).to.be.an('array')
    expect(body.library.badge).to.be.an('array')
    expect(body.library.material).to.be.an('array')
    expect(body.setup).to.be.an('object')
    expect(Object.keys(body.setup)).to.have.members(['type', 'version', 'engine', 'gridSize', 'gridWidth', 'gridHeight', 'colors', 'borders'])
    expect(body.setup.type).to.be.eql('grid-square')
    expect(body.setup.gridSize).to.be.eql(64)
    expect(body.setup.gridWidth).to.be.eql(48)
    expect(body.setup.gridHeight).to.be.eql(32)
    expect(body.setup.version).to.be.eql(Test.p.version)
    expect(body.setup.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
    expect(body.setup.colors).to.be.an('array')
    expect(body.setup.borders).to.be.an('array')
  }, 200)

  // update room
  // [not possible]

  // delete room
  Test.jsonDelete(api, () => `/rooms/${room}/`)
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {}, 404)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCrudSetup (api, room) {
  Test.openTestroom(api, room, 'RPG')

  // snapshots have limited CRUD capabilites, as they are created and read via rooms.
  // we can test changes though.

  // read room
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.setup).to.be.an('object')
    expect(Object.keys(body.setup)).to.have.members(['type', 'version', 'engine', 'gridSize', 'gridWidth', 'gridHeight', 'colors', 'borders'])
    expect(body.setup.type).to.be.eql('grid-square')
    expect(body.setup.gridSize).to.be.eql(64)
    expect(body.setup.gridWidth).to.be.eql(48)
    expect(body.setup.gridHeight).to.be.eql(32)
    expect(body.setup.version).to.be.eql(Test.p.version)
    expect(body.setup.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
    expect(body.setup.colors).to.be.an('array')
    expect(body.setup.colors.length).to.be.gte(2)
    expect(body.setup.borders.length).to.be.gte(2)
  }, 200)

  Test.jsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      type: 'grid-hex',
      gridSize: 64,
      gridWidth: 44,
      gridHeight: 55,
      table: 8,
      layersEnabled: ['note'],
      version: '9.8.7',
      engine: '8.7.6',
      colors: [{}],
      borders: [{}],
      extra: 'some'
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(Object.keys(body)).to.have.members(['type', 'version', 'engine', 'gridSize', 'gridWidth', 'gridHeight', 'colors', 'borders'])
    expect(body.type).to.be.eql('grid-square')
    expect(body.gridSize).to.be.eql(64)
    expect(body.gridWidth).to.be.eql(44)
    expect(body.gridHeight).to.be.eql(55)
    expect(body.version).to.be.eql(Test.p.version)
    expect(body.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
    expect(body.colors).to.be.an('array')
    expect(body.colors.length).to.be.gte(2)
    expect(body.borders.length).to.be.gte(2)
  })

  // read room again
  Test.jsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.setup).to.be.an('object')
    expect(Object.keys(body.setup)).to.have.members(['type', 'version', 'engine', 'gridSize', 'gridWidth', 'gridHeight', 'colors', 'borders'])
    expect(body.setup.type).to.be.eql('grid-square')
    expect(body.setup.gridSize).to.be.eql(64)
    expect(body.setup.gridWidth).to.be.eql(44)
    expect(body.setup.gridHeight).to.be.eql(55)
    expect(body.setup.version).to.be.eql(Test.p.version)
    expect(body.setup.engine).to.be.eql(Test.p.versionEngine.replace(/\.[0-9]*$/, '.0')) // patchlevel 0
    expect(body.setup.colors).to.be.an('array')
    expect(body.setup.colors.length).to.be.gte(2)
    expect(body.setup.borders.length).to.be.gte(2)
  }, 200)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCrudTable (api, room) {
  Test.openTestroom(api, room, 'RPG')

  // get table
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.gt(5)
  })

  // change table
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/`, () => [
    Test.data.pieceMinimal(), Test.data.pieceFull(), { ...Test.data.pieceFull(), w: 2, h: 2 }
  ], body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(3)
    expect(body[0]).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z')
    expect(body[0].id).not.to.be.eql(Test.data.pieceMinimal().id)
    expect(body[1]).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z', 'w', 'h', 's', 'r', 'n', 'c', 'b', 't')
    expect(body[0].id).not.to.be.eql(Test.data.pieceFull().id)
    expect(body[2]).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z', 'w', 's', 'r', 'n', 'c', 'b', 't')
    expect(body[0].id).not.to.be.eql(Test.data.pieceFull().id)
    data = body
  })

  // get table again - still there
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(3)
  })

  // patch table/pieces
  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/`, () => [
    { id: data[2].id, z: 99 },
    { id: data[0].id, x: 99 },
    { id: data[1].id, y: 99 }
  ], body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(3)
    expect(body[0]).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z', 'w', 's', 'r', 'n', 'c', 'b', 't')
    expect(body[0].z).to.be.eql(99)
    expect(body[1]).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z')
    expect(body[1].x).to.be.eql(99)
    expect(body[2]).to.have.all.keys('id', 'l', 'a', 'x', 'y', 'z', 'w', 'h', 's', 'r', 'n', 'c', 'b', 't')
    expect(body[2].y).to.be.eql(99)
  })

  // reset room
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/`, () => [], body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(0)
  })

  // get table again - still empty
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eq(0)
  })

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCrudPiece (api, room) {
  Test.openTestroom(api, room, 'RPG')

  // create piece
  Test.jsonPost(api, () => `/rooms/${room}/tables/1/pieces/`, () => {
    return { // add letter-token
      l: 4,
      a: '73740cdf',
      x: 18,
      y: 8,
      z: 10,
      w: 1,
      h: 1,
      r: 0,
      n: 2,
      s: 0,
      c: [1],
      b: ['badge-id']
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'n', 'c', 'b'])
    expect(body.id).to.match(Test.REGEXP.ID)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.n).to.be.eql(2)
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
    expect(body.b).to.be.an('array')
    expect(body.b.length).to.be.eql(1)
    expect(body.b[0]).to.be.eql('badge-id')
    data = body
  }, 201)

  // get & compare piece
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'n', 'c', 'b'])
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(18)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.n).to.be.eql(2)
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
    expect(body.b).to.be.an('array')
    expect(body.b.length).to.be.eql(1)
    expect(body.b[0]).to.be.eql('badge-id')
  })

  // update piece (patch)
  Test.jsonPatch(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
    return {
      x: 19,
      t: ['  hello test  ']
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'n', 'c', 'b', 't'])
    expect(body.id).to.match(Test.REGEXP.ID)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(19)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.n).to.be.eql(2)
    expect(body.t).to.be.an('array')
    expect(body.t.length).to.be.eql(1)
    expect(body.t[0]).to.be.eql('hello test')
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
    expect(body.b).to.be.an('array')
    expect(body.b.length).to.be.eql(1)
    expect(body.b[0]).to.be.eql('badge-id')
  })

  // get & compare piece
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'n', 'c', 'b', 't'])
    expect(body).to.be.an('object')
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('73740cdf')
    expect(body.x).to.be.eql(19)
    expect(body.y).to.be.eql(8)
    expect(body.z).to.be.eql(10)
    expect(body.n).to.be.eql(2)
    expect(body.t).to.be.an('array')
    expect(body.t.length).to.be.eql(1)
    expect(body.t[0]).to.be.eql('hello test')
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(1)
    expect(body.b).to.be.an('array')
    expect(body.b.length).to.be.eql(1)
    expect(body.b[0]).to.be.eql('badge-id')
  })

  // update/replace piece (put)
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
    return {
      l: 1,
      a: '0d7424df',
      w: 2,
      h: 3,
      x: 17,
      y: 7,
      z: 27,
      r: 0,
      n: 5,
      s: 3,
      t: ['    '],
      c: [2],
      b: ['badge2id']
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'n', 's', 'c', 'b', 'w', 'h'])
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(1)
    expect(body.a).to.be.eql('0d7424df')
    expect(body.w).to.be.eql(2)
    expect(body.h).to.be.eql(3)
    expect(body.x).to.be.eql(17)
    expect(body.y).to.be.eql(7)
    expect(body.z).to.be.eql(27)
    expect(body.n).to.be.eql(5)
    expect(body.s).to.be.eql(3)
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(2)
    expect(body.b).to.be.an('array')
    expect(body.b.length).to.be.eql(1)
    expect(body.b[0]).to.be.eql('badge2id')
  })

  // get & compare piece
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'n', 's', 'c', 'b', 'w', 'h'])
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(1)
    expect(body.a).to.be.eql('0d7424df')
    expect(body.w).to.be.eql(2)
    expect(body.h).to.be.eql(3)
    expect(body.x).to.be.eql(17)
    expect(body.y).to.be.eql(7)
    expect(body.z).to.be.eql(27)
    expect(body.n).to.be.eql(5)
    expect(body.s).to.be.eql(3)
    expect(body.c).to.be.an('array')
    expect(body.c.length).to.be.eql(1)
    expect(body.c[0]).to.be.eql(2)
    expect(body.b).to.be.an('array')
    expect(body.b.length).to.be.eql(1)
    expect(body.b[0]).to.be.eql('badge2id')
  })

  // update/replace piece (put)
  Test.jsonPut(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', () => {
    return {
      l: 4,
      a: '0d7424df',
      x: 11,
      y: 22,
      z: 33
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z'])
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('0d7424df')
    expect(body.x).to.be.eql(11)
    expect(body.y).to.be.eql(22)
    expect(body.z).to.be.eql(33)
  })

  // get & compare piece
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z'])
    expect(body.id).to.be.eql(data.id)
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('0d7424df')
    expect(body.x).to.be.eql(11)
    expect(body.y).to.be.eql(22)
    expect(body.z).to.be.eql(33)
  })

  // delete piece
  Test.jsonDelete(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/')

  // get - should be gone
  Test.jsonGet(api, () => `/rooms/${room}/tables/1/pieces/` + (data ? data.id : 'ID') + '/', body => {}, 404)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCrudPointer (api, room) {
  Test.openTestroom(api, room, 'RPG')

  // create pointer
  Test.jsonPost(api, () => `/rooms/${room}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'ZZZZZZZZ',
      l: 4,
      x: 100,
      y: 200,
      z: 300
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'expires'])
    expect(body.id).to.be.eql('ZZZZZZZZ')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('ZZZZZZZZ')
    expect(body.x).to.be.eql(100)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
    data = body
  }, 201)

  // one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ZZZZZZZZ')
  })

  // create again
  Test.jsonPost(api, () => `/rooms/${room}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'ZZZZZZZZ',
      l: 4,
      x: 100,
      y: 200,
      z: 300
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'expires'])
    expect(body.id).to.be.eql('ZZZZZZZZ')
  }, 201)

  // still one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ZZZZZZZZ')
  })

  // update piece (patch)
  Test.jsonPatch(api, () => `/rooms/${room}/tables/5/pieces/ZZZZZZZZ/`, () => {
    return {
      x: 1000
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'expires'])
    expect(body.id).to.be.eql('ZZZZZZZZ')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('ZZZZZZZZ')
    expect(body.x).to.be.eql(1000)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  })

  // still one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ZZZZZZZZ')
  })

  // delete piece
  Test.jsonDelete(api, () => `/rooms/${room}/tables/5/pieces/ZZZZZZZZ/`)

  // still one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get - should be gone
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/pieces/ZZZZZZZZ/`, body => {}, 404)

  Test.closeTestroom(api, room)
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiCrudLos (api, room) {
  Test.openTestroom(api, room, 'RPG')

  // create pointer
  Test.jsonPost(api, () => `/rooms/${room}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'ZZZZZZZY',
      l: 4,
      x: 100,
      y: 200,
      z: 300,
      w: -400,
      h: -500
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'w', 'h', 'expires'])
    expect(body.id).to.be.eql('ZZZZZZZY')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('ZZZZZZZY')
    expect(body.x).to.be.eql(100)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.w).to.be.eql(-400)
    expect(body.h).to.be.eql(-500)
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
    data = body
  }, 201)

  // one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ZZZZZZZY')
  })

  // create again
  Test.jsonPost(api, () => `/rooms/${room}/tables/5/pieces/`, () => {
    return { // add letter-token
      a: 'ZZZZZZZY',
      l: 4,
      x: 100,
      y: 200,
      z: 300,
      w: -405,
      h: -505
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'w', 'h', 'expires'])
    expect(body.id).to.be.eql('ZZZZZZZY')
    expect(body.w).to.be.eql(-405)
    expect(body.h).to.be.eql(-505)
  }, 201)

  // still one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ZZZZZZZY')
  })

  // update piece (patch)
  Test.jsonPatch(api, () => `/rooms/${room}/tables/5/pieces/ZZZZZZZY/`, () => {
    return {
      x: 1000
    }
  }, body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['id', 'l', 'a', 'x', 'y', 'z', 'w', 'h', 'expires'])
    expect(body.id).to.be.eql('ZZZZZZZY')
    expect(body.l).to.be.eql(4)
    expect(body.a).to.be.eql('ZZZZZZZY')
    expect(body.x).to.be.eql(1000)
    expect(body.y).to.be.eql(200)
    expect(body.z).to.be.eql(300)
    expect(body.w).to.be.eql(-405)
    expect(body.h).to.be.eql(-505)
    expect(body.expires).to.be.gt(new Date().getTime() / 1000 - 60)
    expect(body.expires).to.be.lt(new Date().getTime() / 1000 + 60)
  })

  // still one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(1)
    expect(body[0].id).to.be.eql('ZZZZZZZY')
  })

  // delete piece
  Test.jsonDelete(api, () => `/rooms/${room}/tables/5/pieces/ZZZZZZZY/`)

  // still one piece on table
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/`, body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(0)
  })

  // get - should be gone
  Test.jsonGet(api, () => `/rooms/${room}/tables/5/pieces/ZZZZZZZY/`, body => {}, 404)

  Test.closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - CRUD roundtrips', function () {
    runner((api, version, room) => {
      describe('CRUD room', () => testApiCrudRoom(api, room))
      describe('CRUD setup', () => testApiCrudSetup(api, room))
      describe('CRUD table', () => testApiCrudTable(api, room))
      describe('CRUD piece', () => testApiCrudPiece(api, room))
      describe('CRUD pointer', () => testApiCrudPointer(api, room))
      describe('CRUD los', () => testApiCrudLos(api, room))
    })
  })
}
