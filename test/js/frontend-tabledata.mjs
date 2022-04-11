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
} from '../../src/js/state/index.mjs'

import {
  findPiece,
  findAsset,
  findAssetByAlias,
  getTopLeftPx,
  getPieceBounds,
  findPiecesWithin,
  findExpiredPieces,
  populateTemplateDefaults,
  populatePieceDefaults,
  populatePiecesDefaults,
  sortZ,
  getMinZ,
  getMaxZ,
  getContentRect,
  clampToTableSize,
  createPieceFromAsset,
  splitAssetFilename,
  getAssetURL,
  sanitizePiecePatch,
  snap,
  getSetupCenter
} from '../../src/js/view/room/tabletop/tabledata.mjs'

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

function nowEpoch () {
  return Math.floor(new Date().getTime() / 1000)
}

function headers () {
  return new Map([
    ['servertime', nowEpoch()]
  ])
}

describe('Frontend - tabledata.mjs', function () {
  beforeEach(function () {
    setupTestData()
  })

  it('findPiece()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(findPiece()).to.be.eql(null)
        expect(findPiece('f45f27b57498c3be')).to.be.eql(null)
        expect(findPiece('fe008a4da3b2511e')).to.be.an('object')
        expect(findPiece('fe008a4da3b2511e').id).to.be.eql('fe008a4da3b2511e')
      } else {
        setTableNo(i, false)
        expect(findPiece()).to.be.eql(null)
        expect(findPiece('f45f27b57498c3be')).to.be.eql(null)
        expect(findPiece('fe008a4da3b2511e')).to.be.eql(null)
      }
    }
  })

  it('findAsset()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)

      // invalid searches
      expect(findAsset()).to.be.eql(null)
      expect(findAsset('f9d05a1ecec3ecb8')).to.be.eql(null)

      // valid default searches
      expect(findAsset('f45f27b57498c3be')).to.be.an('object')
      expect(findAsset('f45f27b57498c3be').id).to.be.eql('f45f27b57498c3be')

      // valid limited searches
      expect(findAsset('f45f27b57498c3be', 'other')).to.be.an('object')
      expect(findAsset('f45f27b57498c3be', 'other').id).to.be.eql('f45f27b57498c3be')

      // invalid limited searches
      expect(findAsset('f45f27b57498c3be', 'tile')).to.be.eql(null)
      expect(findAsset('f45f27b57498c3be', 'token')).to.be.eql(null)
      expect(findAsset('f45f27b57498c3be', 'overlay')).to.be.eql(null)
    }
  })

  it('findAssetByAlias()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)

      // invalid searches
      expect(findAssetByAlias()).to.be.eql(null)
      expect(findAssetByAlias('f9d05a1ecec3ecb8')).to.be.eql(null)
      expect(findAssetByAlias('f45f27b57498c3be')).to.be.eql(null)
      expect(findAssetByAlias('f45f27b57498c3be', 'nolayer')).to.be.eql(null)

      // valid default searches
      expect(findAssetByAlias('classic.a')).to.be.an('object')
      expect(findAssetByAlias('classic.a').id).to.be.eql('f45f27b57498c3be')

      // valid limited searches
      expect(findAssetByAlias('classic.a', 'other')).to.be.an('object')
      expect(findAssetByAlias('classic.a', 'other').id).to.be.eql('f45f27b57498c3be')

      // invalid limited searches
      expect(findAssetByAlias('classic.a', 'tile')).to.be.eql(null)
      expect(findAssetByAlias('classic.a', 'token')).to.be.eql(null)
      expect(findAssetByAlias('classic.a', 'overlay')).to.be.eql(null)
      expect(findAssetByAlias('classic.a', 'nolayer')).to.be.eql(null)
    }
  })

  it('getAssetURL()', function () {
    const asset = findAsset('f45f27b57498c3be')

    expect(getAssetURL(asset, -1)).to.be.eql(
      'api/data/rooms/testroom/assets/other/classic.a.1x1x0.png'
    )
    expect(getAssetURL(asset, 0)).to.be.eql(
      'api/data/rooms/testroom/assets/other/classic.a.1x1x1.svg'
    )
    expect(getAssetURL(asset, 1)).to.be.eql(
      'api/data/rooms/testroom/assets/other/classic.a.1x1x2.svg'
    )
  })

  it('getTopLeftPx()', function () {
    const piece = populatePieceDefaults(JSON.parse(pieceJSON))
    const xy = getTopLeftPx(piece)
    expect(xy.left).to.be.eql((256 - 0 * 64 - 64 / 2) + 'px')
    expect(xy.top).to.be.eql((192 - 0 * 64 - 64 / 2) + 'px')
  })

  it('getPieceBounds()', function () {
    const piece = populatePieceDefaults(JSON.parse(pieceJSON))
    const bonds = getPieceBounds(piece)
    expect(bonds.left).to.be.eql(256 - 0 * 64 - 64 / 2)
    expect(bonds.right).to.be.eql(256 + 0 * 64 + 64 / 2 - 1)
    expect(bonds.top).to.be.eql(192 - 0 * 64 - 64 / 2)
    expect(bonds.bottom).to.be.eql(192 + 0 * 64 + 64 / 2 - 1)
  })

  it('findPiecesWithin()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)

      // always invalid searches
      expect(findPiecesWithin({ left: 0, top: 0, right: 0, bottom: 0 }).length).to.be.eql(0)
      expect(findPiecesWithin({ left: 0, top: 0, right: 100, bottom: 100 }).length).to.be.eql(0)
      expect(findPiecesWithin({ left: 100, top: 100, right: -100, bottom: -100 }).length).to.be.eql(0)

      if (i === TEST_STATE) {
        // all layers
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 256 - 32, top: 192 - 32, right: 256 + 31, bottom: 192 + 31 }, 'all', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'all', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 32, bottom: 192 - 32 }, 'all', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 33, bottom: 192 - 33 }, 'all', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 31, top: 192 + 31, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 256 + 32, top: 192 + 32, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(0)

        // correct layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'other', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'other', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 32, bottom: 192 - 32 }, 'other', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 33, bottom: 192 - 33 }, 'other', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 31, top: 192 + 31, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eql(1)
        expect(findPiecesWithin({ left: 256 + 32, top: 192 + 32, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eql(0)

        // wrong layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 32, bottom: 192 - 32 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 33, bottom: 192 - 33 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 31, top: 192 + 31, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 32, top: 192 + 32, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eql(0)
      } else {
        // all layers
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'all', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'all', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(0)

        // 'correct' layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'other', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'other', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'other', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'other', i).length).to.be.eql(0)

        // wrong layer
        expect(findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'tile', i).length).to.be.eql(0)
        expect(findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'tile', i).length).to.be.eql(0)
      }
    }
  })

  it('findExpiredPieces()', function () {
    // no expiration
    let piece = JSON.parse(pieceJSON)
    piece = populatePieceDefaults(piece, headers())
    _setTable(TEST_STATE, [piece])
    expect(findExpiredPieces(1).length).to.be.eql(0)
    expect(findExpiredPieces(TEST_STATE).length).to.be.eql(0)
    expect(findExpiredPieces().length).to.be.eql(0)

    // past expiration
    piece = JSON.parse(pieceJSON)
    piece.expires = nowEpoch() - 10
    piece = populatePieceDefaults(piece, headers())
    _setTable(TEST_STATE, [piece])
    expect(findExpiredPieces(1).length).to.be.eql(0)
    expect(findExpiredPieces(TEST_STATE).length).to.be.eql(1)
    setTableNo(2, false)
    expect(findExpiredPieces().length).to.be.eql(0)
    setTableNo(TEST_STATE, false)
    expect(findExpiredPieces().length).to.be.eql(1)

    // future expiration
    piece = JSON.parse(pieceJSON)
    piece.expires = nowEpoch() + 10
    piece = populatePieceDefaults(piece, headers())
    _setTable(TEST_STATE, [piece])
    expect(findExpiredPieces(1).length).to.be.eql(0)
    expect(findExpiredPieces(TEST_STATE).length).to.be.eql(0)
    expect(findExpiredPieces().length).to.be.eql(0)
  })

  it('sanitizePiecePatch()', function () {
    const expires = nowEpoch()
    setTableNo(TEST_STATE, false)

    let patch = {}
    expect(sanitizePiecePatch(patch)).to.be.eql({})
    expect(sanitizePiecePatch(patch, 'fe008a4da3b2511e')).to.be.eql({})

    patch = { unknown: 1, another: 2 }
    expect(sanitizePiecePatch(patch)).to.be.eql({})
    expect(sanitizePiecePatch(patch, 'fe008a4da3b2511e')).to.be.eql({})

    patch = {
      id: 'fe008a4da3b2511e',
      a: 'f45f27b57498c3be',
      b: 'blind',
      c: [1, 2],
      x: 111,
      y: 222,
      z: 333,
      r: 180,
      w: 3,
      h: 4,
      l: 1,
      s: 0,
      n: 8,
      t: ['one', 'more', 'time'],
      expires: expires
    }
    expect(sanitizePiecePatch(patch)).not.to.be.eq(patch) // check for new object
    expect(sanitizePiecePatch(patch)).to.be.eql(patch)
    expect(sanitizePiecePatch(patch, 'invalid')).not.to.be.eq(patch) // check for new object
    expect(sanitizePiecePatch(patch, 'invalid')).to.be.eql(patch)
    expect(sanitizePiecePatch(patch, 'fe008a4da3b2511e')).not.to.be.eq(patch) // check for new object
    expect(sanitizePiecePatch(patch, 'fe008a4da3b2511e')).to.be.eql(patch)

    // check too low values
    patch = {
      id: 'fe008a4da3b2511e',
      a: 'f45f27b57498c3be',
      b: 'blind',
      c: [-1, -9], // 3 colors in template
      x: -111,
      y: -222,
      z: -333,
      r: -180,
      w: -3,
      h: -4,
      l: -1,
      s: -1, // asset has 3 sides
      n: -1,
      t: ['one', 'more', 'time'],
      expires: -expires
    }
    expect(sanitizePiecePatch(patch, 'fe008a4da3b2511e')).to.be.eql({
      id: 'fe008a4da3b2511e',
      a: 'f45f27b57498c3be',
      b: 'blind',
      c: [3, 3],
      x: 0,
      y: 0,
      z: -333,
      r: 180,
      w: 1,
      h: 1,
      l: -1,
      s: 2,
      n: 15,
      t: ['one', 'more', 'time'],
      expires: -expires
    })

    // check too high values
    patch = {
      id: 'fe008a4da3b2511e',
      a: 'f45f27b57498c3be',
      b: 'blind',
      c: [4, 10], // 3 colors in template
      x: 11111,
      y: 22222,
      z: 33333,
      r: 180 + 360,
      w: 36,
      h: 37,
      l: 99,
      s: 4, // asset has 3 sides
      n: 17,
      t: ['one', 'more', 'time'],
      f: 0b100000101,
      expires: expires
    }
    expect(sanitizePiecePatch(patch, 'fe008a4da3b2511e')).to.be.eql({
      id: 'fe008a4da3b2511e',
      a: 'f45f27b57498c3be',
      b: 'blind',
      c: [0, 2],
      x: 3071,
      y: 2047,
      z: 33333,
      r: 180,
      w: 32,
      h: 32,
      l: 99,
      s: 1,
      n: 1,
      t: ['one', 'more', 'time'],
      f: 0b00000101,
      expires: expires
    })
  })

  it('populateTemplateDefaults()', function () {
    const t1 = populateTemplateDefaults({})
    expect(Object.keys(t1)).to.have.members(['borders', '_meta'])
    expect(t1.borders).to.be.an('array')
    expect(t1._meta).to.be.an('object')
  })

  it('populatePieceDefaults()', function () {
    const p1 = populatePieceDefaults({})
    expect(Object.keys(p1)).to.have.members(['l', 'w', 'h', 's', 'c', 'r', 'n', 't', 'b', 'f', '_meta'])
    expect(p1.w).to.be.eql(1)
    expect(p1.h).to.be.eql(1)
    expect(p1.s).to.be.eql(0)
    expect(p1.c.length).to.be.eql(2)
    expect(p1.c[0]).to.be.eql(0)
    expect(p1.c[1]).to.be.eql(0)
    expect(p1.r).to.be.eql(0)
    expect(p1.n).to.be.eql(0)
    expect(p1.f).to.be.eql(0)
    expect(p1.t.length).to.be.eql(0)
    expect(p1.b.length).to.be.eql(0)
    expect(p1._meta.widthPx).to.be.eql(64)
    expect(p1._meta.heightPx).to.be.eql(64)
    expect(p1._meta.originWidthPx).to.be.eql(64)
    expect(p1._meta.originHeightPx).to.be.eql(64)
    expect(p1._meta.originOffsetXPx).to.be.eql(0)
    expect(p1._meta.originOffsetYPx).to.be.eql(0)
    expect(p1._meta.mask).to.be.eql(undefined)
    expect(p1._meta.feature).to.be.eql(undefined)
    expect(p1._meta.expires).to.be.eql(undefined)

    const p2 = populatePieceDefaults(JSON.parse(pieceJSON2), headers())
    expect(p2.w).to.be.eql(2)
    expect(p2.h).to.be.eql(1)
    expect(p2.s).to.be.eql(4)
    expect(p2.c.length).to.be.eql(2)
    expect(p2.c[0]).to.be.eql(0)
    expect(p2.c[1]).to.be.eql(0)
    expect(p2.r).to.be.eql(90)
    expect(p2.n).to.be.eql(0)
    expect(p2.b.length).to.be.eql(0)
    expect(p2.t.length).to.be.eql(0)
    expect(p2._meta.originWidthPx).to.be.eql(128)
    expect(p2._meta.originHeightPx).to.be.eql(64)
    expect(p2._meta.widthPx).to.be.eql(64)
    expect(p2._meta.heightPx).to.be.eql(128)
    expect(p2._meta.originOffsetXPx).to.be.eql(32)
    expect(p2._meta.originOffsetYPx).to.be.eql(-32)
    expect(p2._meta.mask).to.be.eql(undefined)
    expect(p2._meta.feature).to.be.eql('DISCARD')
    expect(p2._meta.expires).to.be.gte(new Date())

    const p3 = populatePieceDefaults({ a: 'dd07ac49818bc000' })
    expect(p3._meta.feature).to.be.eql('DISCARD')

    const p4 = populatePieceDefaults({ a: 'bb07ac49818bc000' })
    expect(p4._meta.feature).to.be.eql('DICEMAT')
  })

  it('populatePiecesDefaults()', function () {
    let p = populatePiecesDefaults([{ w: 1 }, { w: 2 }, { w: 3 }])
    for (let i = 0; i <= 1; i++) {
      expect(p[i].w).to.be.eql(i + 1)
      expect(p[i].h).to.be.eql(i + 1)
      expect(p[i].s).to.be.eql(0)
      expect(p[i].c[0]).to.be.eql(0)
      expect(p[i].r).to.be.eql(0)
      expect(p[i].n).to.be.eql(0)
      expect(p[i].t.length).to.be.eql(0)
      expect(p[i]._meta.feature).to.be.eql(undefined)
    }

    // autoremoves expired
    p = populatePiecesDefaults([{}], headers())
    expect(p.length).to.be.eql(1)
    p = populatePiecesDefaults([{ expires: nowEpoch() - 10 }], headers())
    expect(p.length).to.be.eql(0)
    p = populatePiecesDefaults([{ expires: nowEpoch() + 10 }], headers())
    expect(p.length).to.be.eql(1)
  })

  it('getMinZ()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(getMinZ('tile')).to.be.eql(56)
        expect(getMinZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(58)
        expect(getMinZ('token')).to.be.eql(34)
        expect(getMinZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ('overlay')).to.be.eql(0)
        expect(getMinZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ('other')).to.be.eql(0)
        expect(getMinZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ()).to.be.eql(34)
      } else {
        expect(getMinZ('tile')).to.be.eql(0)
        expect(getMinZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ('token')).to.be.eql(0)
        expect(getMinZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ('overlay')).to.be.eql(0)
        expect(getMinZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ('other')).to.be.eql(0)
        expect(getMinZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMinZ()).to.be.eql(0)
      }
    }
  })

  it('sortZ()', function () {
    const pieces = [
      JSON.parse(pieceJSON),
      JSON.parse(pieceJSON),
      JSON.parse(pieceJSON),
      JSON.parse(pieceJSON)
    ]
    pieces[0].z = 2
    pieces[1].z = -1
    pieces[2].z = 3
    pieces[3].z = 1
    const b = sortZ(pieces)
    expect(b[0].z).to.be.eql(3)
    expect(b[1].z).to.be.eql(2)
    expect(b[2].z).to.be.eql(1)
    expect(b[3].z).to.be.eql(-1)
  })

  it('getMaxZ()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(getMaxZ('tile')).to.be.eql(65)
        expect(getMaxZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(58)
        expect(getMaxZ('token')).to.be.eql(35)
        expect(getMaxZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ('overlay')).to.be.eql(0)
        expect(getMaxZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ('other')).to.be.eql(0)
        expect(getMaxZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ()).to.be.eql(65)
      } else {
        expect(getMaxZ('tile')).to.be.eql(0)
        expect(getMaxZ('tile', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ('token')).to.be.eql(0)
        expect(getMaxZ('token', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ('overlay')).to.be.eql(0)
        expect(getMaxZ('overlay', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ('other')).to.be.eql(0)
        expect(getMaxZ('other', { left: 961, top: 129, right: 961, bottom: 129 })).to.be.eql(0)
        expect(getMaxZ()).to.be.eql(0)
      }
    }
  })

  it('getContentRect()', function () {
    _setTable(TEST_STATE, populatePiecesDefaults(JSON.parse(tableJSON)))

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        const r1 = getContentRect()
        expect(r1.left).to.be.eql(704)
        expect(r1.top).to.be.eql(64)
        expect(r1.right).to.be.eql(1375)
        expect(r1.bottom).to.be.eql(767)
        expect(r1.width).to.be.eql(672)
        expect(r1.height).to.be.eql(704)
      } else {
        const r1 = getContentRect()
        expect(r1.left).to.be.eql(0)
        expect(r1.top).to.be.eql(0)
        expect(r1.right).to.be.eql(0)
        expect(r1.bottom).to.be.eql(0)
        expect(r1.width).to.be.eql(0)
        expect(r1.height).to.be.eql(0)
      }

      const r2 = getContentRect(2)
      expect(r2.left).to.be.eql(0)
      expect(r2.top).to.be.eql(0)
      expect(r2.right).to.be.eql(0)
      expect(r2.bottom).to.be.eql(0)
      expect(r2.width).to.be.eql(0)
      expect(r2.height).to.be.eql(0)

      const r3 = getContentRect(TEST_STATE)
      expect(r3.left).to.be.eql(704)
      expect(r3.top).to.be.eql(64)
      expect(r3.right).to.be.eql(1375)
      expect(r3.bottom).to.be.eql(767)
      expect(r3.width).to.be.eql(672)
      expect(r3.height).to.be.eql(704)
    }
  })

  it('createPieceFromAsset()', function () {
    const piece = createPieceFromAsset('bb07ac49818bc000')
    expect(piece.a).to.be.eql('bb07ac49818bc000')
    expect(piece.l).to.be.eql('other')
    expect(piece.w).to.be.eql(4)
    expect(piece.h).to.be.eql(4)
    expect(piece.x).to.be.eql(0)
    expect(piece.y).to.be.eql(0)
    expect(piece.z).to.be.eql(1)
    expect(piece.s).to.be.eql(0)
    expect(piece.c[0]).to.be.eql(0)
    expect(piece.r).to.be.eql(0)
    expect(piece.n).to.be.eql(0)
    expect(piece.t.length).to.be.eql(0)
    expect(piece._meta.sides).to.be.eql(2)
    expect(piece._meta.feature).to.be.eql('DICEMAT')
  })

  it('clampToTableSize()', function () {
    const piece1 = populatePieceDefaults(JSON.parse(pieceJSON))
    clampToTableSize(piece1)
    expect(piece1.x).to.be.eql(256)
    expect(piece1.y).to.be.eql(192)

    const piece2 = populatePieceDefaults(JSON.parse(pieceJSON))
    piece2.x = -10
    piece2.y = -20
    clampToTableSize(piece2)
    expect(piece2.x).to.be.eql(0)
    expect(piece2.y).to.be.eql(0)

    const piece3 = populatePieceDefaults(JSON.parse(pieceJSON))
    piece3.x = 50000
    piece3.y = 60000
    clampToTableSize(piece3)
    expect(piece3.x).to.be.eql(47 * 64)
    expect(piece3.y).to.be.eql(31 * 64)

    const piece4 = populatePieceDefaults(JSON.parse(pieceJSON))
    piece4.x = 50000
    piece4.y = 60000
    piece4.w = 3
    piece4.h = 2
    clampToTableSize(piece4)
    expect(piece4.x).to.be.eql((47 - 2) * 64)
    expect(piece4.y).to.be.eql((31 - 1) * 64)
  })

  it('snap()', function () { // hint - more in-depth snapping tests in utils-test
    const room = JSON.parse(roomJSON)

    // grid-room snapping
    room.template.type = 'grid-square'
    _setRoom(room)
    expect(snap(31, -1).x).to.be.eql(32)
    expect(snap(31, -1).y).to.be.eql(0)

    // hex-room snapping
    room.template.type = 'grid-hex'
    _setRoom(room)
    expect(snap(31, -1).x).to.be.eql(37)
    expect(snap(31, -1).y).to.be.eql(0)
  })

  it('getSetupCenter()', function () {
    // current table
    expect(getSetupCenter().x).to.be.eql(1536)
    expect(getSetupCenter().y).to.be.eql(1024)

    // empty table
    expect(getSetupCenter(2).x).to.be.eql(1536)
    expect(getSetupCenter(2).y).to.be.eql(1024)

    // full table
    expect(getSetupCenter(TEST_STATE).x).to.be.eql(255)
    expect(getSetupCenter(TEST_STATE).y).to.be.eql(191)
  })

  it('splitAssetFilename()', function () {
    const a1 = splitAssetFilename('door.1x2x3.jpg')
    expect(a1.name).to.be.eql('door')
    expect(a1.w).to.be.eql(1)
    expect(a1.h).to.be.eql(2)
    expect(a1.s).to.be.eql(3)
    expect(a1.bg).to.be.eql(undefined)

    const b1 = splitAssetFilename('door.1x2x3.123456.jpg')
    expect(b1.name).to.be.eql('door')
    expect(b1.w).to.be.eql(1)
    expect(b1.h).to.be.eql(2)
    expect(b1.s).to.be.eql(3)
    expect(b1.bg).to.be.eql('123456')

    const a2 = splitAssetFilename('dungeon.doorOpen.3x2x1.png')
    expect(a2.name).to.be.eql('dungeon.doorOpen')
    expect(a2.w).to.be.eql(3)
    expect(a2.h).to.be.eql(2)
    expect(a2.s).to.be.eql(1)
    expect(a2.bg).to.be.eql(undefined)

    const b2 = splitAssetFilename('dungeon.doorOpen.3x2x1.transparent.png')
    expect(b2.name).to.be.eql('dungeon.doorOpen')
    expect(b2.w).to.be.eql(3)
    expect(b2.h).to.be.eql(2)
    expect(b2.s).to.be.eql(1)
    expect(b2.bg).to.be.eql('transparent')

    const c1 = splitAssetFilename('tile.svg')
    expect(c1.name).to.be.eql('tile')
    expect(c1.w).to.be.eql(undefined)
    expect(c1.h).to.be.eql(undefined)
    expect(c1.s).to.be.eql(undefined)
    expect(c1.bg).to.be.eql(undefined)

    const a0 = splitAssetFilename('invalid')
    expect(a0.name).to.be.eql(undefined)
    expect(a0.w).to.be.eql(undefined)
    expect(a0.h).to.be.eql(undefined)
    expect(a0.s).to.be.eql(undefined)
    expect(a0.bg).to.be.eql(undefined)
  })
})

const pieceJSON = `
{
  "id": "fe008a4da3b2511e",
  "l": 5,
  "a": "f45f27b57498c3be",
  "x": 256,
  "y": 192,
  "z": 13,
  "s": 4
}`

const pieceJSON2 = `
{
  "id": "fe008a4da3b2511e",
  "l": 5,
  "a": "dd07ac49818bc000",
  "x": 256,
  "y": 192,
  "w": 2,
  "h": 1,
  "r": 90,
  "z": 13,
  "s": 4,
  "expires": ${nowEpoch() + 10}
}` // discard item

const tableJSON = `
[{
  "l": 1,
  "a": "c065574908de7702",
  "w": 3,
  "h": 2,
  "x": 960,
  "y": 128,
  "z": 58,
  "id": "437e26b90281e34e"
}, {
  "id": "0e13b377e39574bc",
  "l": 1,
  "a": "da30d95f34341fc0",
  "x": 768,
  "y": 256,
  "z": 65,
  "r": 90
}, {
  "l": 1,
  "a": "89bd84cc218186eb",
  "x": 1344,
  "y": 192,
  "z": 56,
  "id": "9754d0c014e39cd9",
  "r": 90
}, {
  "l": 4,
  "a": "b7662212e5f3c6f9",
  "x": 768,
  "y": 704,
  "z": 35,
  "w": 2,
  "h": 2,
  "id": "49d045e1712c4148"
}, {
  "l": 4,
  "a": "b7662212e5f3c6f9",
  "x": 960,
  "y": 640,
  "z": 34,
  "id": "b785cb505677f977"
}]`

const roomJSON = `
{
  "id": "f9d05a1ecec3ecb8",
  "name": "testroom",
  "engine": "0.3.0",
  "background": {
    "color": "#423e3d",
    "scroller": "#2b2929",
    "image": "img/desktop-wood.jpg"
  },
  "library": {
    "overlay": [{
      "media": ["area.1x1.1x1x1.svg", "##BACK##"],
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "name": "area.1x1",
      "type": "overlay",
      "id": "7261fff0158e27bc"
    }],
    "tile": [{
      "media": ["altar.3x2x1.transparent.png", "##BACK##"],
      "w": 3,
      "h": 2,
      "bg": "transparent",
      "name": "altar",
      "type": "tile",
      "id": "5b150d84cee577dc"
    }],
    "token": [{
      "media": ["aasimar.1x1x1.piece.svg", "##BACK##"],
      "w": 1,
      "h": 1,
      "bg": "piece",
      "name": "aasimar",
      "type": "token",
      "id": "484d7d45fdc27afa"
    }],
    "other": [{
      "media": ["classic.a.1x1x1.svg", "classic.a.1x1x2.svg", "classic.a.1x1x3.svg"],
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "name": "classic.a",
      "type": "other",
      "id": "f45f27b57498c3be",
      "base": "classic.a.1x1x0.png"
    }, {
      "media": ["_.dicemat.4x4x1.jpg", "##BACK##"],
      "w": 4,
      "h": 4,
      "bg": "#808080",
      "name": "_.dicemat",
      "type": "other",
      "id": "bb07ac49818bc000"
    }, {
      "media": ["_.discard.4x4x1.png"],
      "w": 4,
      "h": 4,
      "bg": "#808080",
      "name": "_.discard",
      "type": "other",
      "id": "dd07ac49818bc000"
    }],
    "badge": []
  },
  "template": {
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
  "credits": "test template",
  "width": 3072,
  "height": 2048
}
`
