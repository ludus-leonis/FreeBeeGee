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

import {
  _test as testState,
  setTableNo,
  getSetup,
  FLAGS
} from '../../../src/js/state/index.mjs'

import {
  TYPE_SQUARE,
  TYPE_HEX,
  TYPE_HEX2,
  getFeatures,
  populatePiecesDefaults,
  findPiece
} from '../../../src/js/view/room/tabletop/tabledata.mjs'

import {
  selectionAdd,
  selectionClear,
  selectionGetFeatures,
  selectionGetPieces
} from '../../../src/js/view/room/tabletop/selection.mjs'

import {
  _test,
  pileSelected,
  moveSelected,
  deleteSelected
} from '../../../src/js/view/room/tabletop/index.mjs'

/**
 * Initialize table+room data for tests.
 */
function setupTestData () {
  testState.setRoom(JSON.parse(roomJSON))
  for (let i = 1; i <= 9; i++) {
    testState.setTable(i, [])
  }
  setTableNo(1, false)
}

describe('Frontend - tabletop.mjs', function () {
  beforeEach(function () {
    setupTestData()
  })

  it('moveSelected() square', function () {
    getSetup().type = TYPE_SQUARE
    testState.setTable(1, populatePiecesDefaults([
      { ...JSON.parse(pieceJSON), id: '1', x: 32 + 64 * 0, y: 32 + 64 * 0 },
      { ...JSON.parse(pieceJSON), id: '2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: FLAGS.NO_MOVE },
      { ...JSON.parse(pieceJSON), id: '3', x: 32 + 64 * 2, y: 32 + 64 * 2 }
    ]))
    expect(moveSelected(1, 2, false)).to.be.eql([])
    expect(selectionGetPieces().length).to.be.eql(0)
    expect(selectionGetFeatures().move).to.be.eql(false)

    selectionAdd('3')
    const move1 = moveSelected(1, 2, false)
    expect(move1.length).to.be.eql(1)
    expect(move1[0].id).to.be.eql('3')
    expect(move1[0].x).to.be.eql(32 + 64 * 2 + 1 * 64)
    expect(move1[0].y).to.be.eql(32 + 64 * 2 + 2 * 64)
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()

    // dont move protected
    selectionAdd('2') // protected
    const move2 = moveSelected(1, 2, false)
    expect(move2.length).to.be.eql(0)
    selectionAdd('1')
    const move3 = moveSelected(1, 2, false)
    expect(move3.length).to.be.eql(1)
    expect(move3[0].id).to.be.eql('1')
    expect(move3[0].x).to.be.eql(32 + 64 * 0 + 1 * 64)
    expect(move3[0].y).to.be.eql(32 + 64 * 0 + 2 * 64)
    expect(selectionGetPieces().length).to.be.eql(2)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()

    // move out of table
    selectionAdd('1')
    selectionAdd('2')
    selectionAdd('3')
    const move4 = moveSelected(1, 2, false)
    expect(move4.length).to.be.eql(2)
    const move5 = moveSelected(-1, 0, false)
    expect(move5.length).to.be.eql(0)
    const move6 = moveSelected(0, -1, false)
    expect(move6.length).to.be.eql(0)
    const move7 = moveSelected(200, 0, false)
    expect(move7.length).to.be.eql(0)
    const move8 = moveSelected(0, 200, false)
    expect(move8.length).to.be.eql(0)
    const move9 = moveSelected(1, 2, false)
    expect(move9.length).to.be.eql(2)
    expect(selectionGetPieces().length).to.be.eql(3)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()
  })

  it('moveSelected() hex', function () {
    getSetup().type = TYPE_HEX
    testState.setTable(1, populatePiecesDefaults([
      { ...JSON.parse(pieceJSON), id: '4', x: 55, y: 32 },
      { ...JSON.parse(pieceJSON), id: '5', x: 32 + 64 * 1, y: 32 + 64 * 1, f: FLAGS.NO_MOVE },
      { ...JSON.parse(pieceJSON), id: '6', x: 110, y: 128 }
    ]))
    expect(moveSelected(1, 2, false)).to.be.eql([])
    expect(selectionGetPieces().length).to.be.eql(0)
    expect(selectionGetFeatures().move).to.be.eql(false)

    selectionAdd('4')
    const move1 = moveSelected(1, 0, false)
    expect(move1.length).to.be.eql(1)
    expect(move1[0].id).to.be.eql('4')
    expect(move1[0].x).to.be.eql(55 + 55)
    expect(move1[0].y).to.be.eql(32 + 32)
    const move2 = moveSelected(0, 1, false)
    expect(move2.length).to.be.eql(1)
    expect(move2[0].id).to.be.eql('4')
    expect(move2[0].x).to.be.eql(55)
    expect(move2[0].y).to.be.eql(32 + 64)
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()

    selectionAdd('6')
    const move3 = moveSelected(1, 0, false)
    expect(move3.length).to.be.eql(1)
    expect(move3[0].id).to.be.eql('6')
    expect(move3[0].x).to.be.eql(110 + 55)
    expect(move3[0].y).to.be.eql(128 - 32)
    const move4 = moveSelected(0, -1, false)
    expect(move4.length).to.be.eql(1)
    expect(move4[0].id).to.be.eql('6')
    expect(move4[0].x).to.be.eql(110)
    expect(move4[0].y).to.be.eql(128 - 64)
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()

    selectionAdd('4')
    selectionAdd('5')
    selectionAdd('6')
    const move5 = moveSelected(1, 0, false)
    expect(move5.length).to.be.eql(2)
    expect(move5[0].id).to.be.eql('6')
    expect(move5[0].x).to.be.eql(110 + 55)
    expect(move5[0].y).to.be.eql(128 + 32)
    expect(move5[1].id).to.be.eql('4')
    expect(move5[1].x).to.be.eql(55 + 55)
    expect(move5[1].y).to.be.eql(32 + 32)
    const move6 = moveSelected(0, 1, false)
    expect(move6.length).to.be.eql(2)
    expect(move6[0].id).to.be.eql('6')
    expect(move6[0].x).to.be.eql(110)
    expect(move6[0].y).to.be.eql(128 + 64)
    expect(move6[1].id).to.be.eql('4')
    expect(move6[1].x).to.be.eql(55)
    expect(move6[1].y).to.be.eql(32 + 64)
    expect(selectionGetPieces().length).to.be.eql(3)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()
  })

  it('moveSelected() hex2', function () {
    getSetup().type = TYPE_HEX2
    testState.setTable(1, populatePiecesDefaults([
      { ...JSON.parse(pieceJSON), id: '7', x: 32, y: 55 },
      { ...JSON.parse(pieceJSON), id: '8', x: 32 + 64 * 1, y: 32 + 64 * 1, f: FLAGS.NO_MOVE },
      { ...JSON.parse(pieceJSON), id: '9', x: 128, y: 110 }
    ]))
    expect(moveSelected(1, 2, false)).to.be.eql([])
    expect(selectionGetPieces().length).to.be.eql(0)
    expect(selectionGetFeatures().move).to.be.eql(false)

    selectionAdd('8')
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().move).to.be.eql(false)
    selectionClear()

    selectionAdd('7')
    const move1 = moveSelected(0, 1, false)
    expect(move1.length).to.be.eql(1)
    expect(move1[0].id).to.be.eql('7')
    expect(move1[0].x).to.be.eql(32 + 32)
    expect(move1[0].y).to.be.eql(55 + 55)
    const move2 = moveSelected(1, 0, false)
    expect(move2.length).to.be.eql(1)
    expect(move2[0].id).to.be.eql('7')
    expect(move2[0].x).to.be.eql(32 + 64)
    expect(move2[0].y).to.be.eql(55)
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()

    selectionAdd('9')
    const move3 = moveSelected(0, 1, false)
    expect(move3.length).to.be.eql(1)
    expect(move3[0].id).to.be.eql('9')
    expect(move3[0].x).to.be.eql(128 - 32)
    expect(move3[0].y).to.be.eql(110 + 55)
    const move4 = moveSelected(-1, 0, false)
    expect(move4.length).to.be.eql(1)
    expect(move4[0].id).to.be.eql('9')
    expect(move4[0].x).to.be.eql(128 - 64)
    expect(move4[0].y).to.be.eql(110)
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()

    selectionAdd('7')
    selectionAdd('8')
    selectionAdd('9')
    const move5 = moveSelected(0, 1, false)
    expect(move5.length).to.be.eql(2)
    expect(move5[0].id).to.be.eql('9')
    expect(move5[0].x).to.be.eql(128 + 32)
    expect(move5[0].y).to.be.eql(110 + 55)
    expect(move5[1].id).to.be.eql('7')
    expect(move5[1].x).to.be.eql(32 + 32)
    expect(move5[1].y).to.be.eql(55 + 55)
    const move6 = moveSelected(1, 0, false)
    expect(move6.length).to.be.eql(2)
    expect(move6[0].id).to.be.eql('9')
    expect(move6[0].x).to.be.eql(128 + 64)
    expect(move6[0].y).to.be.eql(110)
    expect(move6[1].id).to.be.eql('7')
    expect(move6[1].x).to.be.eql(32 + 64)
    expect(move6[1].y).to.be.eql(55)
    expect(selectionGetPieces().length).to.be.eql(3)
    expect(selectionGetFeatures().move).to.be.eql(true)
    selectionClear()
  })

  it('clonePieces()', function () {
    testState.setTable(1, populatePiecesDefaults([
      { ...JSON.parse(pieceJSON), id: 'A', x: 64, y: 64 },
      { ...JSON.parse(pieceJSON), id: 'B', x: 32, y: 32, f: FLAGS.NO_CLONE },
      { ...JSON.parse(pieceJSON), id: 'C', x: 256, y: 128 }
    ]))

    const a = findPiece('A')
    const b = findPiece('B')
    const c = findPiece('C')

    expect(_test.clonePieces([], { x: 64, y: 64 }, false)).to.be.eql([])
    expect(getFeatures([]).clone).to.be.eql(false)

    const clone1 = _test.clonePieces([a], { x: 64 + 64 * 10, y: 64 + 64 * 8 }, false) // will snap!
    expect(clone1.length).to.be.eql(1)
    expect(clone1[0].id).to.be.eql('A')
    expect(clone1[0].x).to.be.eql(64 + 64 * 10)
    expect(clone1[0].y).to.be.eql(64 + 64 * 8)
    expect(getFeatures([a]).clone).to.be.eql(true)

    const clone2 = _test.clonePieces([a, b], { x: 64 + 64 * 10, y: 64 + 64 * 8 }, false) // will snap!
    expect(clone2.length).to.be.eql(1)
    expect(clone2[0].id).to.be.eql('A')
    expect(clone2[0].x).to.be.eql(64 + 64 * 10)
    expect(clone2[0].y).to.be.eql(64 + 64 * 8)
    expect(getFeatures([a, b]).clone).to.be.eql(true)

    const clone3 = _test.clonePieces([a, b, c], { x: 64 * 10, y: 64 * 8 }, false) // will snap!
    expect(clone3.length).to.be.eql(2)
    expect(clone3[0].id).to.be.eql('A')
    expect(clone3[0].x).to.be.eql(64 * 10 - (256 - 64) / 2)
    expect(clone3[0].y).to.be.eql(64 * 8 - (128 - 64) / 2)
    expect(clone3[1].id).to.be.eql('C')
    expect(clone3[1].x).to.be.eql(64 * 10 + (256 - 64) / 2)
    expect(clone3[1].y).to.be.eql(64 * 8 + (128 - 64) / 2)
    expect(getFeatures([a, b, c]).clone).to.be.eql(true)

    selectionClear()
  })

  it('pileSelected()', function () {
    testState.setTable(1, populatePiecesDefaults([
      { ...JSON.parse(pieceJSON), id: 'P1', x: 64, y: 64 },
      { ...JSON.parse(pieceJSON), id: 'P2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: FLAGS.NO_MOVE },
      { ...JSON.parse(pieceJSON), id: 'P3', x: 256, y: 128 }
    ]))
    expect(selectionGetPieces().length).to.be.eql(0)
    expect(selectionGetFeatures().pile).to.be.eql(false)
    expect(pileSelected(undefined, false)).to.be.eql([])

    selectionAdd('P1')
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().pile).to.be.eql(false)
    expect(pileSelected(undefined, false)).to.be.eql([])
    selectionClear()

    selectionAdd('P1')
    selectionAdd('P2')
    expect(selectionGetPieces().length).to.be.eql(2)
    expect(selectionGetFeatures().pile).to.be.eql(false)
    expect(pileSelected(undefined, false)).to.be.eql([])
    selectionClear()

    selectionAdd('P1')
    selectionAdd('P2')
    selectionAdd('P3')
    expect(selectionGetPieces().length).to.be.eql(3)
    expect(selectionGetFeatures().pile).to.be.eql(true)
    const pile1 = pileSelected(undefined, false)
    expect(pile1.length).to.be.eql(2)
    expect(pile1[0].id).to.be.eql('P1')
    expect(pile1[0].x).to.be.eql(160)
    expect(pile1[0].y).to.be.eql(96)
    expect(pile1[1].id).to.be.eql('P3')
    expect(pile1[1].x).to.be.eql(160)
    expect(pile1[1].y).to.be.eql(96)
    selectionClear()
  })

  it('deleteSelected()', function () {
    testState.setTable(1, populatePiecesDefaults([
      { ...JSON.parse(pieceJSON), id: 'P1', x: 64, y: 64 },
      { ...JSON.parse(pieceJSON), id: 'P2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: FLAGS.NO_DELETE },
      { ...JSON.parse(pieceJSON), id: 'P3', x: 256, y: 128 },
      { ...JSON.parse(pieceJSON), id: 'P4', x: 1256, y: 1128 }
    ]))
    expect(selectionGetPieces().length).to.be.eql(0)
    expect(selectionGetFeatures().delete).to.be.eql(false)
    expect(deleteSelected(false)).to.be.eql([])

    selectionAdd('P2')
    expect(selectionGetPieces().length).to.be.eql(1)
    expect(selectionGetFeatures().delete).to.be.eql(false)
    expect(deleteSelected(false)).to.be.eql([])
    selectionClear()

    selectionAdd('P1')
    selectionAdd('P2')
    expect(selectionGetPieces().length).to.be.eql(2)
    expect(selectionGetFeatures().delete).to.be.eql(true)
    expect(deleteSelected(false)).to.be.eql(['P1'])
    selectionClear()

    selectionAdd('P2')
    selectionAdd('P3')
    selectionAdd('P4')
    expect(selectionGetPieces().length).to.be.eql(3)
    expect(selectionGetFeatures().delete).to.be.eql(true)
    expect(deleteSelected(false)).to.be.eql(['P3', 'P4'])
    selectionClear()
  })
})

// -----------------------------------------------------------------------------

const pieceJSON = `
{
  "id": "fe008a4d",
  "l": 5,
  "a": "f45f27b5",
  "x": 256,
  "y": 192,
  "z": 13,
  "s": 4
}`

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
      "bg": "#808080",
      "name": "area.1x1",
      "type": "sticker",
      "id": "7261fff0"
    }],
    "tile": [{
      "media": ["altar.3x2x1.transparent.png", "##BACK##"],
      "w": 3,
      "h": 2,
      "bg": "transparent",
      "name": "altar",
      "type": "tile",
      "id": "5b150d84"
    }],
    "token": [{
      "media": ["aasimar.1x1x1.piece.svg", "##BACK##"],
      "w": 1,
      "h": 1,
      "bg": "piece",
      "name": "aasimar",
      "type": "token",
      "id": "484d7d45"
    }],
    "other": [{
      "media": ["classic.a.1x1x1.svg", "classic.a.1x1x2.svg", "classic.a.1x1x3.svg"],
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "name": "classic.a",
      "type": "other",
      "id": "f45f27b5",
      "base": "classic.a.1x1x0.png"
    }, {
      "media": ["_.dicemat.4x4x1.jpg", "##BACK##"],
      "w": 4,
      "h": 4,
      "bg": "#808080",
      "name": "_.dicemat",
      "type": "other",
      "id": "bb07ac49"
    }, {
      "media": ["_.discard.4x4x1.png"],
      "w": 4,
      "h": 4,
      "bg": "#808080",
      "name": "_.discard",
      "type": "other",
      "id": "dd07ac49"
    }],
    "badge": []
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
}
`
