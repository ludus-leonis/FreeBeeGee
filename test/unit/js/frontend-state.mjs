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
 * WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

/* global describe, it, beforeEach */

import * as Content from 'src/js/view/room/tabletop/content.mjs'
import * as State from 'src/js/state/index.mjs'

import * as Test from 'test/integration/utils/test.mjs'
const expect = Test.expect

describe('Frontend - state.mjs - basics', function () {
  beforeEach(function () {
    Test.setupTestData()
  })

  it('getServerInfo()', function () {
    const serverInfo = State.getServerInfo()
    expect(serverInfo).to.be.an('object')
    expect(serverInfo.version).to.be.eql('0.24.0')
    expect(serverInfo.engine).to.be.eql('2.6.1')
    expect(serverInfo.ttl).to.be.eql(48)
    expect(serverInfo.defaultSnapshot).to.be.eql('RPG')
    expect(serverInfo.snapshotUploads).to.be.eql(true)
    expect(serverInfo.freeRooms).to.be.eql(32)
    expect(serverInfo.root).to.be.eql('/api')
    expect(serverInfo.backgrounds).to.be.an('array')
    expect(serverInfo.backgrounds.length).to.be.gte(5)
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1]).to.be.an('object')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].name).to.be.eql('Wood')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].color).to.be.eql('#524A43')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].scroller).to.be.eql('#3E3935')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
  })

  it('getRoom() getSetup() getLibrary()', function () {
    expect(State.getRoom()).to.be.an('object')
    expect(State.getRoom().id).to.be.eql('gQAnH9I8')
    expect(State.getSetup()).to.be.an('object')
    expect(State.getSetup().type).to.be.eql('grid-square')
    expect(State.getLibrary()).to.be.an('object')
    expect(State.getLibrary().sticker).to.be.an('array')
    expect(State.getLibrary().tile).to.be.an('array')
    expect(State.getLibrary().other).to.be.an('array')
    expect(State.getLibrary().token).to.be.an('array')
  })

  it('getTable()', function () {
    expect(State.getTable(1)).to.be.eql([])

    expect(State.getTable(2)).to.be.an('array')
    expect(State.getTable(2).length).to.be.eql(1)
    expect(State.getTable(2)[0].id).to.be.eql('Ta3RTTni2')
  })

  it('getTableNo() setTableNo()', function () {
    State.setTableNo(3, false)
    expect(State.getTableNo()).to.be.eql(3)
    expect(State.getTable()).to.be.an('array')
    expect(State.getTable().length).to.be.eql(1)
    expect(State.getTable()[0].id).to.be.eql('Ta3RTTni3')

    State.setTableNo(1, false)
    expect(State.getTableNo()).to.be.eql(1)
    expect(State.getTable()).to.be.eql([])

    State.setTableNo(9, false)
    expect(State.getTableNo()).to.be.eql(9)
  })

  it('getLayer()', function () {
    expect(State.getLayer(Content.LAYER.OTHER).length).to.be.eql(1)
    expect(State.getLayer(Content.LAYER.TOKEN).length).to.be.eql(1)
    expect(State.getLayer(Content.LAYER.NOTE).length).to.be.eql(8)
    expect(State.getLayer(Content.LAYER.STICKER).length).to.be.eql(1)
    expect(State.getLayer(Content.LAYER.TILE).length).to.be.eql(1)

    State.setTableNo(1, false)
    expect(State.getLayer(Content.LAYER.OTHER).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TOKEN).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.NOTE).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.STICKER).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TILE).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.OTHER, 2).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TOKEN, 2).length).to.be.eql(1)
    expect(State.getLayer(Content.LAYER.NOTE, 2).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.STICKER, 2).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TILE, 2).length).to.be.eql(0)

    State.setTableNo(2, false)
    expect(State.getLayer(Content.LAYER.OTHER).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TOKEN).length).to.be.eql(1)
    expect(State.getLayer(Content.LAYER.NOTE).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.STICKER).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TILE).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.OTHER, 1).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TOKEN, 1).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.NOTE, 1).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.STICKER, 1).length).to.be.eql(0)
    expect(State.getLayer(Content.LAYER.TILE, 1).length).to.be.eql(0)
  })

  it('set...Preference', function () {
    const PREF = { name: 'my', default: 1 }

    // we can only test in-memory fallback behavior here
    expect(State.getServerPreference(PREF)).to.be.eql(1)
    State.setServerPreference(PREF, 'value')
    expect(State.getServerPreference(PREF)).to.be.eql('value')

    expect(State.getRoomPreference(PREF)).to.be.eql(1)
    State.setRoomPreference(PREF, 'value')
    expect(State.getRoomPreference(PREF)).to.be.eql('value')

    expect(State.getTablePreference(PREF)).to.be.eql(1)
    State.setTablePreference(PREF, 'value')
    expect(State.getTablePreference(PREF)).to.be.eql('value')
  })

  it('setTabActive() isTabActive', function () {
    expect(State.isTabActive()).to.be.eql(true)
    State.setTabActive(false, false)
    expect(State.isTabActive()).to.be.eql(false)
  })
})

describe('Frontend - state.mjs - API request JSON', function () {
  let r

  beforeEach(function () {
    Test.setupTestData()
  })

  it('patchSetup()', async function () {
    const r = Test.mock(await State.patchSetup({ test: 1 }, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/setup\/$/)
    expect(Object.keys(r.body)).to.have.members(['test'])
  })

  // it('addRoom()', async function () {}) // can't test due missing FormData()

  it('editPiece()', async function () {
    r = Test.mock(await State.editPiece('c0de', {
      a: 'this',
      b: 'that',
      c: [99],
      r: -90
    }, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/5\/pieces\/c0de\/$/)
    expect(Object.keys(r.body)).to.have.members(['a', 'b', 'c', 'r'])
    expect(r.body.a).to.be.eql('this')
    expect(r.body.b).to.be.eql('that')
    expect(r.body.c[0]).to.be.eql(99 % 14) // room has 14 colors
    expect(r.body.r).to.be.eql(270)

    r = Test.mock(await State.editPiece('c0de', {}, false))
    expect(r.method).to.be.eql(undefined)
    expect(r.path).to.be.eql(undefined)
  })

  it('remove()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'Z1', x: 64, y: 64, z: 10, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z2', x: 64, y: 64, z: 11, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z3', x: 64, y: 64, z: 21, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z4', x: 64, y: 64, z: 22, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z5', x: 64, y: 64, z: 25, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z6', x: 512, y: 512, z: 26, l: 1 } // far away
    ]
    Test.setupTestData(pieces)

    r = Test.mock(await State.remove([pieces[1], pieces[3]], false))
    expect(r.method).to.be.eql('DELETE')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/5\/pieces\/$/)
    expect(r.body).to.be.an('array')
    expect(r.body.length).to.be.eql(2)
    expect(r.body).to.be.eql(['Z2', 'Z4'])
  })

  it('updateTable()', async function () {
    r = Test.mock(await State.updateTable({
      a: 'this',
      b: 'that'
    }, false))
    expect(r.method).to.be.eql('PUT')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/5\/$/)
    expect(Object.keys(r.body)).to.have.members(['a', 'b'])
  })

  it('updatePieces()', async function () {
    r = Test.mock(await State.updatePieces([
      { id: 'c0de', r: -90 },
      { id: 'c1de', x: 3 }
    ], false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/5\/pieces\/$/)
    expect(r.body).to.be.an('array')
    expect(r.body.length).to.be.eql(2)
    expect(r.body[0]).to.be.eql({ id: 'c0de', r: 270 })
    expect(r.body[1]).to.be.eql({ id: 'c1de', x: 3 })
  })

  it('createPieces()', async function () {
    r = Test.mock(await State.createPieces([{
      l: 'token',
      x: 100,
      y: 200,
      z: 300
    }], false, false))
    expect(r.method).to.be.eql('POST')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/5\/pieces\/$/)
    expect(r.body).to.be.an('array')
    expect(r.body[0]).to.be.an('object')
    expect(r.body[0]).to.have.keys('l', 'x', 'y', 'z')
    expect(r.body[0].l).to.be.eql(4)
    expect(r.body[0].x).to.be.eql(100)
    expect(r.body[0].y).to.be.eql(200)
    expect(r.body[0].z).to.be.eql(300)
  })

  it('undo()', async function () {
    r = Test.mock(await State.undo(2, false))
    expect(r.method).to.be.eql('POST')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/undo\/$/)
    expect(r.body).to.be.an('object')
  })

  it('addAsset()', async function () {
    r = Test.mock(await State.addAsset({
      name: 'room',
      format: 'png',
      type: Content.LAYER.TOKEN,
      w: 1,
      h: 2,
      base64: '...content...',
      bg: 'transparent'
    }, false))
    expect(r.method).to.be.eql('POST')
    expect(r.path).to.match(/^api\/rooms\/testroom\/assets\/$/)
    expect(Object.keys(r.body)).to.have.members([
      'name',
      'format',
      'type',
      'w',
      'h',
      'base64',
      'bg'
    ])
  })

  it('deleteRoom()', async function () {
    r = Test.mock(await State.deleteRoom())
    expect(r.method).to.be.eql('DELETE')
    expect(r.path).to.match(/^api\/rooms\/testroom\/$/)
    expect(r.body).to.be.eql(undefined)
  })

  // it('fetchTable()', async function () {}) // can't test
})
