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
 * WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

/* global describe, it, beforeEach */

import { expect } from 'chai'
import {
  _setTable,
  _setRoom,
  setTableNo
} from '../src/js/state/index.mjs'
import {
  findPiece,
  findAsset,
  findPiecesWithin,
  populatePieceDefaults,
  populatePiecesDefaults,
  assetToPiece,
  getMinZ,
  getMaxZ,
  getContentRect,
  getContentRectGrid,
  getContentRectGridAll,
  clampToTableSize,
  createPieceFromAsset,
  splitAssetFilename
} from '../src/js/view/room/tabletop/tabledata.mjs'

const TEST_STATE = 5

function setupTestData () {
  _setRoom(JSON.parse(roomJSON))
  for (let i = 1; i <= 9; i++) {
    if (i === TEST_STATE) {
      _setTable(i, populatePiecesDefaults([JSON.parse(pieceJSON)]))
    } else {
      _setTable(i, [])
    }
  }
  setTableNo(1, false)
}

describe('Frontend - tabledata.mjs', function () {
  beforeEach(function () {
    setupTestData()
  })

  it('findPiece()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(findPiece()).to.be.eq(null)
        expect(findPiece('f45f27b57498c3be')).to.be.eq(null)
        expect(findPiece('fe008a4da3b2511e')).to.be.an('object')
        expect(findPiece('fe008a4da3b2511e').id).to.be.eq('fe008a4da3b2511e')
      } else {
        setTableNo(i, false)
        expect(findPiece()).to.be.eq(null)
        expect(findPiece('f45f27b57498c3be')).to.be.eq(null)
        expect(findPiece('fe008a4da3b2511e')).to.be.eq(null)
      }
    }
  })

  it('findAsset()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)

      // invalid searches
      expect(findAsset()).to.be.eq(null)
      expect(findAsset('f9d05a1ecec3ecb8')).to.be.eq(null)

      // valid default searches
      expect(findAsset('f45f27b57498c3be')).to.be.an('object')
      expect(findAsset('f45f27b57498c3be').id).to.be.eq('f45f27b57498c3be')

      // valid limited searches
      expect(findAsset('f45f27b57498c3be', 'other')).to.be.an('object')
      expect(findAsset('f45f27b57498c3be', 'other').id).to.be.eq('f45f27b57498c3be')

      // invalid limited searches
      expect(findAsset('f45f27b57498c3be', 'tile')).to.be.eq(null)
      expect(findAsset('f45f27b57498c3be', 'token')).to.be.eq(null)
      expect(findAsset('f45f27b57498c3be', 'overlay')).to.be.eq(null)
    }
  })

  it('findPiecesWithin()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)

      // always invalid searches
      expect(findPiecesWithin({ left: 0, top: 0, right: 0, bottom: 0 }).length).to.be.eq(0)
      expect(findPiecesWithin({ left: 0, top: 0, right: 100, bottom: 100 }).length).to.be.eq(0)
      expect(findPiecesWithin({ left: 100, top: 100, right: -100, bottom: -100 }).length).to.be.eq(0)

      if (i === TEST_STATE) {
        // all layers
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eq(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eq(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'all', i).length).to.be.eq(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'all', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eq(1)

        // correct layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'other', i).length).to.be.eq(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eq(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'other', i).length).to.be.eq(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'other', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eq(1)

        // wrong layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eq(0)
      } else {
        // all layers
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'all', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'all', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eq(0)

        // 'correct' layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'other', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'other', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'other', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eq(0)

        // wrong layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'tile', i).length).to.be.eq(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eq(0)
      }
    }
  })

  it('assetToPiece()', function () {
    const a0 = assetToPiece()
    expect(a0).to.be.an('object')
    expect(a0.asset).to.be.eq('0000000000000000')
    expect(a0.layer).to.be.eq('tile')
    expect(a0.x).to.be.eq(0)
    expect(a0.y).to.be.eq(0)
    expect(a0.z).to.be.eq(0)
    expect(a0.w).to.be.eq(1)
    expect(a0.h).to.be.eq(1)
    expect(a0._sides).to.be.eq(1)
    expect(a0.bg).to.be.eq('40bfbf')
    expect(a0.side).to.be.eq(0)
    expect(a0.color).to.be.eq(0)
    expect(a0.r).to.be.eq(0)
    expect(a0.n).to.be.eq(0)
    expect(a0.label).to.be.eq('')

    const a1 = assetToPiece('abc')
    expect(a1).to.be.an('object')
    expect(a1.asset).to.be.eq('0000000000000000')
    expect(a1.layer).to.be.eq('tile')
    expect(a1.x).to.be.eq(0)
    expect(a1.y).to.be.eq(0)
    expect(a1.z).to.be.eq(0)
    expect(a1.w).to.be.eq(1)
    expect(a1.h).to.be.eq(1)
    expect(a1._sides).to.be.eq(1)
    expect(a1.bg).to.be.eq('40bfbf')
    expect(a1.side).to.be.eq(0)
    expect(a1.color).to.be.eq(0)
    expect(a1.r).to.be.eq(0)
    expect(a1.n).to.be.eq(0)
    expect(a1.label).to.be.eq('')

    const a2 = assetToPiece('5b150d84cee577dc')
    expect(a2).to.be.an('object')
    expect(a2.asset).to.be.eq('5b150d84cee577dc')
    expect(a2.layer).to.be.eq('tile')
    expect(a2.x).to.be.eq(0)
    expect(a2.y).to.be.eq(0)
    expect(a2.z).to.be.eq(0)
    expect(a2.w).to.be.eq(3)
    expect(a2.h).to.be.eq(2)
    expect(a2._sides).to.be.eq(2)
    expect(a2.bg).to.be.eq('transparent')
    expect(a2.side).to.be.eq(0)
    expect(a2.color).to.be.eq(0)
    expect(a2.r).to.be.eq(0)
    expect(a2.n).to.be.eq(0)
    expect(a2.label).to.be.eq('')
  })

  it('populatePieceDefaults()', function () {
    const p1 = populatePieceDefaults({})
    expect(p1.w).to.be.eq(1)
    expect(p1.h).to.be.eq(1)
    expect(p1.side).to.be.eq(0)
    expect(p1.color).to.be.eq(0)
    expect(p1.r).to.be.eq(0)
    expect(p1.n).to.be.eq(0)
    expect(p1.label).to.be.eq('')
    expect(p1._feature).to.be.eq(undefined)

    const p2 = populatePieceDefaults(JSON.parse(pieceJSON))
    expect(p2.w).to.be.eq(1)
    expect(p2.h).to.be.eq(1)
    expect(p2.side).to.be.eq(4)
    expect(p2.color).to.be.eq(0)
    expect(p2.r).to.be.eq(0)
    expect(p2.n).to.be.eq(0)
    expect(p2.label).to.be.eq('')
    expect(p2._feature).to.be.eq(undefined)

    const p3 = populatePieceDefaults({ asset: 'dd07ac49818bc000' })
    expect(p3._feature).to.be.eq('DISCARD')

    const p4 = populatePieceDefaults({ asset: 'bb07ac49818bc000' })
    expect(p4._feature).to.be.eq('DICEMAT')
  })

  it('populatePiecesDefaults()', function () {
    const p = populatePiecesDefaults([{ w: 1 }, { w: 2 }, { w: 3 }])
    for (let i = 0; i <= 1; i++) {
      expect(p[i].w).to.be.eq(i + 1)
      expect(p[i].h).to.be.eq(1)
      expect(p[i].side).to.be.eq(0)
      expect(p[i].color).to.be.eq(0)
      expect(p[i].r).to.be.eq(0)
      expect(p[i].n).to.be.eq(0)
      expect(p[i].label).to.be.eq('')
      expect(p[i]._feature).to.be.eq(undefined)
    }
  })

  it('getMinZ()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(getMinZ('tile')).to.be.eq(56)
        expect(getMinZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(58)
        expect(getMinZ('token')).to.be.eq(34)
        expect(getMinZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ('overlay')).to.be.eq(0)
        expect(getMinZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ('other')).to.be.eq(0)
        expect(getMinZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ()).to.be.eq(34)
      } else {
        expect(getMinZ('tile')).to.be.eq(0)
        expect(getMinZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ('token')).to.be.eq(0)
        expect(getMinZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ('overlay')).to.be.eq(0)
        expect(getMinZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ('other')).to.be.eq(0)
        expect(getMinZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMinZ()).to.be.eq(0)
      }
    }
  })

  it('getMaxZ()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(getMaxZ('tile')).to.be.eq(65)
        expect(getMaxZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(58)
        expect(getMaxZ('token')).to.be.eq(35)
        expect(getMaxZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ('overlay')).to.be.eq(0)
        expect(getMaxZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ('other')).to.be.eq(0)
        expect(getMaxZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ()).to.be.eq(65)
      } else {
        expect(getMaxZ('tile')).to.be.eq(0)
        expect(getMaxZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ('token')).to.be.eq(0)
        expect(getMaxZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ('overlay')).to.be.eq(0)
        expect(getMaxZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ('other')).to.be.eq(0)
        expect(getMaxZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eq(0)
        expect(getMaxZ()).to.be.eq(0)
      }
    }
  })

  it('getContentRect()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        const r1 = getContentRect()
        expect(r1.left).to.be.eq(768)
        expect(r1.top).to.be.eq(128)
        expect(r1.right).to.be.eq(1407)
        expect(r1.bottom).to.be.eq(831)
      } else {
        const r1 = getContentRect()
        expect(r1.left).to.be.eq(0)
        expect(r1.top).to.be.eq(0)
        expect(r1.right).to.be.eq(0)
        expect(r1.bottom).to.be.eq(0)
      }

      const r2 = getContentRect(2)
      expect(r2.left).to.be.eq(0)
      expect(r2.top).to.be.eq(0)
      expect(r2.right).to.be.eq(0)
      expect(r2.bottom).to.be.eq(0)
    }
  })

  it('getContentRectGrid()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        const r1 = getContentRectGrid()
        expect(r1.left).to.be.eq(12)
        expect(r1.top).to.be.eq(2)
        expect(r1.right).to.be.eq(21)
        expect(r1.bottom).to.be.eq(12)
        expect(r1.width).to.be.eq(10)
        expect(r1.height).to.be.eq(11)
      } else {
        const r1 = getContentRectGrid()
        expect(r1.left).to.be.eq(0)
        expect(r1.top).to.be.eq(0)
        expect(r1.right).to.be.eq(0)
        expect(r1.bottom).to.be.eq(0)
        expect(r1.width).to.be.eq(0)
        expect(r1.height).to.be.eq(0)
      }

      const r2 = getContentRectGrid(2)
      expect(r2.left).to.be.eq(0)
      expect(r2.top).to.be.eq(0)
      expect(r2.right).to.be.eq(0)
      expect(r2.bottom).to.be.eq(0)
      expect(r2.width).to.be.eq(0)
      expect(r2.height).to.be.eq(0)
    }
  })

  it('getContentRectGridAll()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      const r1 = getContentRectGridAll()
      expect(r1.left).to.be.eq(12)
      expect(r1.top).to.be.eq(2)
      expect(r1.right).to.be.eq(21)
      expect(r1.bottom).to.be.eq(12)
    }
  })

  it('clampToTableSize()', function () {
    const piece1 = populatePieceDefaults(JSON.parse(pieceJSON))
    clampToTableSize(piece1)
    expect(piece1.x).to.be.eq(256)
    expect(piece1.y).to.be.eq(192)

    const piece2 = populatePieceDefaults(JSON.parse(pieceJSON))
    piece2.x = -10
    piece2.y = -20
    clampToTableSize(piece2)
    expect(piece2.x).to.be.eq(0)
    expect(piece2.y).to.be.eq(0)

    const piece3 = populatePieceDefaults(JSON.parse(pieceJSON))
    piece3.x = 50000
    piece3.y = 60000
    clampToTableSize(piece3)
    expect(piece3.x).to.be.eq(47 * 64)
    expect(piece3.y).to.be.eq(31 * 64)

    const piece4 = populatePieceDefaults(JSON.parse(pieceJSON))
    piece4.x = 50000
    piece4.y = 60000
    piece4.w = 3
    piece4.h = 2
    clampToTableSize(piece4)
    expect(piece4.x).to.be.eq((47 - 2) * 64)
    expect(piece4.y).to.be.eq((31 - 1) * 64)
  })

  it('createPieceFromAsset()', function () {
    const piece = createPieceFromAsset('bb07ac49818bc000')
    expect(piece.asset).to.be.eq('bb07ac49818bc000')
    expect(piece.layer).to.be.eq('other')
    expect(piece.w).to.be.eq(4)
    expect(piece.h).to.be.eq(4)
    expect(piece.x).to.be.eq(0)
    expect(piece.y).to.be.eq(0)
    expect(piece.z).to.be.eq(1)
    expect(piece.side).to.be.eq(0)
    expect(piece.color).to.be.eq(0)
    expect(piece.r).to.be.eq(0)
    expect(piece.n).to.be.eq(0)
    expect(piece.label).to.be.eq('')
    expect(piece._sides).to.be.eq(2)
    expect(piece._feature).to.be.eq('DICEMAT')
  })

  it('splitAssetFilename()', function () {
    const a1 = splitAssetFilename('door.1x2x3.jpg')
    expect(a1.alias).to.be.eql('door')
    expect(a1.w).to.be.eql(1)
    expect(a1.h).to.be.eql(2)
    expect(a1.side).to.be.eql(3)
    expect(a1.bg).to.be.eql('808080')

    const b1 = splitAssetFilename('door.1x2x3.123456.jpg')
    expect(b1.alias).to.be.eql('door')
    expect(b1.w).to.be.eql(1)
    expect(b1.h).to.be.eql(2)
    expect(b1.side).to.be.eql(3)
    expect(b1.bg).to.be.eql('123456')

    const a2 = splitAssetFilename('dungeon.doorOpen.3x2x1.png')
    expect(a2.alias).to.be.eql('dungeon.doorOpen')
    expect(a2.w).to.be.eql(3)
    expect(a2.h).to.be.eql(2)
    expect(a2.side).to.be.eql(1)
    expect(a2.bg).to.be.eql('808080')

    const b2 = splitAssetFilename('dungeon.doorOpen.3x2x1.transparent.png')
    expect(b2.alias).to.be.eql('dungeon.doorOpen')
    expect(b2.w).to.be.eql(3)
    expect(b2.h).to.be.eql(2)
    expect(b2.side).to.be.eql(1)
    expect(b2.bg).to.be.eql('transparent')

    const c1 = splitAssetFilename('tile.svg')
    expect(c1.alias).to.be.eql('tile')
    expect(c1.w).to.be.eql(1)
    expect(c1.h).to.be.eql(1)
    expect(c1.side).to.be.eql(1)
    expect(c1.bg).to.be.eql('808080')

    const a0 = splitAssetFilename('invalid')
    expect(a0.alias).to.be.eql('unknown')
    expect(a0.w).to.be.eql(1)
    expect(a0.h).to.be.eql(1)
    expect(a0.side).to.be.eql(1)
    expect(a0.bg).to.be.eql('808080')
  })
})

const pieceJSON = '{"id":"fe008a4da3b2511e","layer":"other","asset":"f45f27b57498c3be","x":256,"y":192,"z":13,"side":4}'

const tableJSON = '[{"layer":"tile","asset":"c065574908de7702","w":3,"h":2,"x":960,"y":128,"z":58,"id":"437e26b90281e34e"},{"id":"0e13b377e39574bc","layer":"tile","asset":"da30d95f34341fc0","x":768,"y":256,"z":65,"r":90},{"layer":"tile","asset":"89bd84cc218186eb","x":1344,"y":192,"z":56,"id":"9754d0c014e39cd9","r":90},{"layer":"token","asset":"b7662212e5f3c6f9","x":768,"y":704,"z":35,"w":2,"h":2,"id":"49d045e1712c4148"},{"layer":"token","asset":"b7662212e5f3c6f9","x":960,"y":640,"z":34,"id":"b785cb505677f977"}]'

const roomJSON = '{"id":"f9d05a1ecec3ecb8","name":"selfishExaminingBaboon","engine":"0.3.0","background":{"color":"#423e3d","scroller":"#2b2929","image":"img/desktop-wood.jpg"},"library":{"overlay":[{"media":["area.1x1.1x1x1.svg","##BACK##"],"w":1,"h":1,"bg":"#808080","alias":"area.1x1","type":"overlay","id":"7261fff0158e27bc"}],"tile":[{"media":["altar.3x2x1.transparent.png","##BACK##"],"w":3,"h":2,"bg":"transparent","alias":"altar","type":"tile","id":"5b150d84cee577dc"}],"token":[{"media":["aasimar.1x1x1.piece.svg","##BACK##"],"w":1,"h":1,"bg":"piece","alias":"aasimar","type":"token","id":"484d7d45fdc27afa"}],"other":[{"media":["classic.a.1x1x1.svg","classic.a.1x1x2.svg","classic.a.1x1x3.svg"],"w":1,"h":1,"bg":"#808080","alias":"classic.a","type":"other","id":"f45f27b57498c3be","base":"classic.a.1x1x0.png"},{"media":["dicemat.4x4x1.jpg","##BACK##"],"w":4,"h":4,"bg":"#808080","alias":"dicemat","type":"other","id":"bb07ac49818bc000"},{"media":["discard.4x4x1.jpg"],"w":4,"h":4,"bg":"#808080","alias":"discard","type":"other","id":"dd07ac49818bc000"}],"tag":[]},"template":{"type":"grid-square","version":"0.9.0-dev","engine":"^0.3.0","gridSize":64,"gridWidth":48,"gridHeight":32,"snapSize":32,"colors":[{"name":"black","value":"#0d0d0d"},{"name":"blue","value":"#061862"},{"name":"white","value":"#ffffff"}]},"credits":"test template","width":3072,"height":2048}'
