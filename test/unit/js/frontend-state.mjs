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

import { expect } from 'chai'

import { _setMock } from '../../../src/js/api/index.mjs'

import {
  LAYER,
  populatePieceDefaults
} from '../../../src/js/view/room/tabletop/tabledata.mjs'

import {
  _test,
  setServerInfo,
  getServerInfo,
  getTable,
  getTableNo,
  setTableNo,
  getRoom,
  getSetup,
  getMaterialMedia,
  getLibrary,
  isTabActive,
  setTabActive,
  setServerPreference,
  getServerPreference,
  setRoomPreference,
  getRoomPreference,
  setTablePreference,
  getTablePreference,
  colorPiece,
  patchSetup,
  movePiece,
  rotatePiece,
  numberPiece,
  editPiece,
  deletePiece,
  deletePieces,
  updateTable,
  updatePieces,
  addAsset,
  undo,
  deleteRoom
} from '../../../src/js/state/index.mjs'

_setMock(1) // disable server calls, enable request-mirroring

/**
 * Split mock server reply for easier testing.
 *
 * @param {object} request Request object.
 * @returns {object} Split properties path, method, body, headers and expectedStatus.
 */
function splitRequest (request) {
  return {
    path: request.path,
    method: request.data?.method,
    body: request.data?.body ? JSON.parse(request.data.body) : undefined,
    headers: request.data?.headers,
    expectedStatus: request.expectedStatus
  }
}

/**
 * Initialize table+room data for tests.
 */
function setupTestData () {
  setTableNo(1, false)
}

describe('Frontend - state.mjs - basics', function () {
  beforeEach(function () {
    setupTestData()
  })

  it('getServerInfo()', function () {
    setServerInfo(undefined)
    expect(getServerInfo()).to.be.eql(undefined)

    setServerInfo(JSON.parse(serverJSON))
    const serverInfo = getServerInfo()
    expect(serverInfo).to.be.an('object')
    expect(serverInfo.version).to.be.eql('0.13.0')
    expect(serverInfo.engine).to.be.eql('2.0.0')
    expect(serverInfo.ttl).to.be.eql(48)
    expect(serverInfo.defaultSnapshot).to.be.eql('Tutorial')
    expect(serverInfo.snapshotUploads).to.be.eql(true)
    expect(serverInfo.freeRooms).to.be.eql(127)
    expect(serverInfo.root).to.be.eql('/api')
    expect(serverInfo.backgrounds).to.be.an('array')
    expect(serverInfo.backgrounds.length).to.be.gte(5)
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1]).to.be.an('object')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].name).to.be.eql('Wood')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].color).to.be.eql('#57514d')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].scroller).to.be.eql('#3E3935')
    expect(serverInfo.backgrounds[serverInfo.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
  })

  it('getMaterialMedia()', function () {
    _test.setRoom(undefined)
    expect(getMaterialMedia('wood')).to.match(/^api\/data\/rooms\/undefined\/assets\/material\/none.png$/)
    _test.setRoom(JSON.parse(roomJSON))
    expect(getMaterialMedia('wood')).to.match(/^api\/data\/rooms\/testroom\/assets\/material\/wood.png$/)
    expect(getMaterialMedia('none')).to.match(/^api\/data\/rooms\/testroom\/assets\/material\/none.png$/)
    expect(getMaterialMedia('blah')).to.match(/^api\/data\/rooms\/testroom\/assets\/material\/none.png$/)
  })

  it('getRoom() getSetup() getLibrary()', function () {
    _test.setRoom(undefined)
    expect(getRoom()).to.be.eql(undefined)
    expect(getSetup()).to.be.eql(undefined)

    _test.setRoom(JSON.parse(roomJSON))
    expect(getRoom()).to.be.an('object')
    expect(getRoom().id).to.be.eql('f9d05a1e')
    expect(getSetup()).to.be.an('object')
    expect(getSetup().type).to.be.eql('grid-square')
    expect(getLibrary()).to.be.an('object')
    expect(getLibrary().sticker).to.be.an('array')
    expect(getLibrary().tile).to.be.an('array')
    expect(getLibrary().other).to.be.an('array')
    expect(getLibrary().token).to.be.an('array')
  })

  it('getTable()', function () {
    _test.setTable(1, [JSON.parse(pieceJSON)])

    expect(getTable(1)).to.be.an('array')
    expect(getTable(1).length).to.be.eql(1)
    expect(getTable(1)[0].id).to.be.eql('fe008a4d')

    expect(getTable(2)).to.be.eql([])
  })

  it('getTableNo() setTableNo()', function () {
    _test.setTable(1, [JSON.parse(pieceJSON)])
    _test.setRoom(JSON.parse(roomJSON))

    expect(getTableNo()).to.be.eql(1)

    expect(getTable()).to.be.an('array')
    expect(getTable().length).to.be.eql(1)
    expect(getTable()[0].id).to.be.eql('fe008a4d')

    setTableNo(2, false)
    expect(getTableNo()).to.be.eql(2)

    expect(getTable()).to.be.eql([])

    setTableNo(1, false)
    expect(getTableNo()).to.be.eql(1)
  })

  it('set...Preference', function () {
    const PREF = { name: 'my', default: 1 }

    // we can only test in-memory fallback behavior here
    expect(getServerPreference(PREF)).to.be.eql(1)
    setServerPreference(PREF, 'value')
    expect(getServerPreference(PREF)).to.be.eql('value')

    expect(getRoomPreference(PREF)).to.be.eql(1)
    setRoomPreference(PREF, 'value')
    expect(getRoomPreference(PREF)).to.be.eql('value')

    expect(getTablePreference(PREF)).to.be.eql(1)
    setTablePreference(PREF, 'value')
    expect(getTablePreference(PREF)).to.be.eql('value')
  })

  it('setTabActive() isTabActive', function () {
    _test.setTable(1, [JSON.parse(pieceJSON)])

    expect(isTabActive()).to.be.eql(true)
    setTabActive(false, false)
    expect(isTabActive()).to.be.eql(false)
  })
})

describe('Frontend - state.mjs - API request JSON', function () {
  let r

  it('patchSetup()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    const r = splitRequest(await patchSetup({ test: 1 }, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/setup\/$/)
    expect(Object.keys(r.body)).to.have.members(['test'])
  })

  // it('addRoom()', async function () {}) // can't test due missing FormData()

  it('movePiece()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await movePiece('c0de', 3, 4, 5, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/c0de\/$/)
    expect(Object.keys(r.body)).to.have.members(['id', 'x', 'y', 'z'])
    expect(r.body.id).to.be.eql('c0de')
    expect(r.body.x).to.be.eql(3)
    expect(r.body.y).to.be.eql(4)
    expect(r.body.z).to.be.eql(5)

    r = splitRequest(await movePiece('c0de', 6, 7, undefined, false))
    expect(Object.keys(r.body)).to.have.members(['id', 'x', 'y'])
    expect(r.body.id).to.be.eql('c0de')
    expect(r.body.x).to.be.eql(6)
    expect(r.body.y).to.be.eql(7)

    r = splitRequest(await movePiece('c0de', undefined, undefined, 10, false))
    expect(Object.keys(r.body)).to.have.members(['id', 'z'])
    expect(r.body.id).to.be.eql('c0de')
    expect(r.body.z).to.be.eql(10)
  })

  it('rotatePiece()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await rotatePiece('c0de', 0, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/c0de\/$/)
    expect(Object.keys(r.body)).to.have.members(['r'])
    expect(r.body.r).to.be.eql(0)

    r = splitRequest(await rotatePiece('c0de', 90, false))
    expect(Object.keys(r.body)).to.have.members(['r'])
    expect(r.body.r).to.be.eql(90)

    r = splitRequest(await rotatePiece('c0de', -90, false))
    expect(Object.keys(r.body)).to.have.members(['r'])
    expect(r.body.r).to.be.eql(270)

    r = splitRequest(await rotatePiece('c0de', 360, false))
    expect(Object.keys(r.body)).to.have.members(['r'])
    expect(r.body.r).to.be.eql(0)

    r = splitRequest(await rotatePiece('c0de', undefined, false))
    expect(Object.keys(r.body)).to.have.members(['r'])
    expect(r.body.r).to.be.eql(0)
  })

  it('numberPiece()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await numberPiece('c0de', 0, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/c0de\/$/)
    expect(Object.keys(r.body)).to.have.members(['n'])
    expect(r.body.n).to.be.eql(0)

    r = splitRequest(await numberPiece('c0de', 5, false))
    expect(Object.keys(r.body)).to.have.members(['n'])
    expect(r.body.n).to.be.eql(5)

    r = splitRequest(await numberPiece('c0de', 40, false))
    expect(Object.keys(r.body)).to.have.members(['n'])
    expect(r.body.n).to.be.eql(4)

    r = splitRequest(await numberPiece('c0de', -2, false))
    expect(Object.keys(r.body)).to.have.members(['n'])
    expect(r.body.n).to.be.eql(34)

    r = splitRequest(await numberPiece('c0de', undefined, false))
    expect(Object.keys(r.body)).to.have.members(['n'])
    expect(r.body.n).to.be.eql(0)
  })

  it('colorPiece()', async function () {
    _test.setRoom(JSON.parse(roomJSON)) // room has 3 colors
    _test.setTable(2, [
      populatePieceDefaults(JSON.parse(pieceJSON)),
      populatePieceDefaults(JSON.parse(noteJSON))
    ])
    setTableNo(2, false)

    r = splitRequest(await colorPiece('c0de', 1, 2, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/c0de\/$/)
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(1)
    expect(r.body.c[1]).to.be.eql(2)

    r = splitRequest(await colorPiece('c1de', undefined, undefined, false))
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(0)
    expect(r.body.c[1]).to.be.eql(0)

    r = splitRequest(await colorPiece('c2de', 2, undefined, false))
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(2)
    expect(r.body.c[1]).to.be.eql(0)

    r = splitRequest(await colorPiece('c2de', 4, -1, false))
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(0)
    expect(r.body.c[1]).to.be.eql(3)

    // test on exisiting piece
    r = splitRequest(await colorPiece('c2de', 4, 5, false))
    expect(r.method).to.be.eql('PATCH')
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(0)
    expect(r.body.c[1]).to.be.eql(1)

    // test on exisiting note (0..4 colors)
    r = splitRequest(await colorPiece('00008a4d', 3, 4, false))
    expect(r.method).to.be.eql('PATCH')
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(3)
    expect(r.body.c[1]).to.be.eql(0)

    // test on exisiting piece (0..2 colors)
    r = splitRequest(await colorPiece('fe008a4d', 5, 6, false))
    expect(r.method).to.be.eql('PATCH')
    expect(Object.keys(r.body)).to.have.members(['c'])
    expect(r.body.c[0]).to.be.eql(1)
    expect(r.body.c[1]).to.be.eql(2)
  })

  it('editPiece()', async function () {
    _test.setRoom(JSON.parse(roomJSON)) // room has 3 colors
    setTableNo(2, false)

    r = splitRequest(await editPiece('c0de', {
      a: 'this',
      b: 'that',
      c: [99],
      r: -90
    }, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/c0de\/$/)
    expect(Object.keys(r.body)).to.have.members(['a', 'b', 'c', 'r'])
    expect(r.body.a).to.be.eql('this')
    expect(r.body.b).to.be.eql('that')
    expect(r.body.c[0]).to.be.eql(99 % 4)
    expect(r.body.r).to.be.eql(270)

    r = splitRequest(await editPiece('c0de', {}, false))
    expect(r.method).to.be.eql(undefined)
    expect(r.path).to.be.eql(undefined)
  })

  it('deletePiece()', async function () {
    _test.setRoom(JSON.parse(roomJSON)) // room has 3 colors
    setTableNo(2, false)

    r = splitRequest(await deletePiece('c0de', false))
    expect(r.method).to.be.eql('DELETE')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/c0de\/$/)
    expect(r.body).to.be.eql(undefined)

    r = splitRequest(await deletePiece('fe008a4d', false))
    expect(r.method).to.be.eql('DELETE')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/fe008a4d\/$/)
    expect(r.body).to.be.eql(undefined)
  })

  it('deletePieces()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await deletePieces(['c0de', 'c1de'], false))
    expect(r.method).to.be.eql('DELETE')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/$/)
    expect(r.body).to.be.an('array')
    expect(r.body.length).to.be.eql(2)
    expect(r.body[0]).to.be.eql('c0de')
    expect(r.body[1]).to.be.eql('c1de')
  })

  it('updateTable()', async function () {
    _test.setRoom(JSON.parse(roomJSON)) // room has 3 colors
    setTableNo(2, false)

    r = splitRequest(await updateTable({
      a: 'this',
      b: 'that'
    }, false))
    expect(r.method).to.be.eql('PUT')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/$/)
    expect(Object.keys(r.body)).to.have.members(['a', 'b'])
  })

  it('updatePieces()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await updatePieces([
      { id: 'c0de', r: -90 },
      { id: 'c1de', x: 3 }
    ], false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/$/)
    expect(r.body).to.be.an('array')
    expect(r.body.length).to.be.eql(2)
    expect(r.body[0]).to.be.eql({ id: 'c0de', r: 270 })
    expect(r.body[1]).to.be.eql({ id: 'c1de', x: 3 })
  })

  // it('createPieces()', async function () {}) // can't test

  it('undo()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await undo(2, false))
    expect(r.method).to.be.eql('POST')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/undo\/$/)
    expect(r.body).to.be.an('object')
  })

  it('addAsset()', async function () {
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await addAsset({
      name: 'room',
      format: 'png',
      type: LAYER.TOKEN,
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
    _test.setRoom(JSON.parse(roomJSON))
    setTableNo(2, false)

    r = splitRequest(await deleteRoom())
    expect(r.method).to.be.eql('DELETE')
    expect(r.path).to.match(/^api\/rooms\/testroom\/$/)
    expect(r.body).to.be.eql(undefined)
  })

  // it('fetchTable()', async function () {}) // can't test
})

const serverJSON = '{"version":"0.13.0","engine":"2.0.0","ttl":48,"snapshotUploads":true,"defaultSnapshot":"Tutorial","freeRooms":127,"root":"/api","backgrounds":[{"name":"Casino","image":"img/desktop-casino.jpg","color":"#2e5d3c","scroller":"#1b3c25"},{"name":"Concrete","image":"img/desktop-concrete.jpg","color":"#646260","scroller":"#494540"},{"name":"Marble","image":"img/desktop-marble.jpg","color":"#b4a999","scroller":"#80725e"},{"name":"Metal","image":"img/desktop-metal.jpg","color":"#515354","scroller":"#3e3e3e"},{"name":"Rock","image":"img/desktop-rock.jpg","color":"#5c5d5a","scroller":"#393930"},{"name":"Wood","image":"img/desktop-wood.jpg","color":"#57514d","scroller":"#3E3935"}]}'

const pieceJSON = '{"id":"fe008a4d","l":1,"a":"f45f27b5","x":256,"y":192,"z":13,"s":4}'

const noteJSON = '{"id":"00008a4d","l":3,"a":"f45f27b5","x":256,"y":192,"z":13,"s":4}'

const roomJSON = `
{
  "id": "f9d05a1e",
  "name": "testroom",
  "engine": "0.3.0",
  "background": {
    "color": "#423e3d",
    "scroller": "#2b2929",
    "image": "img/desktop-wood.jpg"
  },
  "library": {
    "sticker": [{
      "media": ["area.1x1.1x1x1.svg", "##BACK##"],
      "w": 1,
      "h": 1,
      "color": "#808080",
      "name": "area.1x1",
      "type": "sticker",
      "id": "7261fff0"
    }],
    "tile": [{
      "media": ["altar.3x2x1.transparent.png", "##BACK##"],
      "w": 3,
      "h": 2,
      "color": "transparent",
      "name": "altar",
      "type": "tile",
      "id": "5b150d84"
    }],
    "token": [{
      "media": ["aasimar.1x1x1.piece.svg", "##BACK##"],
      "w": 1,
      "h": 1,
      "color": "piece",
      "name": "aasimar",
      "type": "token",
      "id": "484d7d45"
    }],
    "other": [{
      "media": ["classic.a.1x1x1.svg", "classic.a.1x1x2.svg", "classic.a.1x1x3.svg"],
      "w": 1,
      "h": 1,
      "color": "#808080",
      "name": "classic.a",
      "type": "other",
      "id": "f45f27b5",
      "base": "classic.a.1x1x0.png"
    }],
    "material": [{
      "id": "MOevM100",
      "name": "none",
      "type": "material",
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "media": [
        "none.png"
      ]
    }, {
      "id": "Hb9tz200",
      "name": "paper",
      "type": "material",
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "media": [
        "paper.png"
      ]
    }, {
      "id": "wS-60300",
      "name": "wood",
      "type": "material",
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "media": [
        "wood.png"
      ]
    }],
    "note": []
  },
  "setup": {
    "type": "grid-square",
    "version": "0.9.0-dev",
    "engine": "^0.3.0",
    "gridSize": 64,
    "gridWidth": 48,
    "gridHeight": 32,
    "colors": [{
      "name": "black",
      "value": "#0d0d0d"
    }, {
      "name": "blue",
      "value": "#061862"
    }, {
      "name": "white",
      "value": "#ffffff"
    }],
    "borders": [{
      "name": "black",
      "value": "#0d0d0d"
    }, {
      "name": "blue",
      "value": "#061862"
    }, {
      "name": "white",
      "value": "#ffffff"
    }]
  },
  "credits": "test snapshot",
  "width": 3072,
  "height": 2048
}`
