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

import Test, { expect } from '../../integration/utils/test.mjs'

import Content from '../../../src/js/view/room/tabletop/content.mjs'
import State from '../../../src/js/state/index.mjs'

/**
 * Get current seconds.
 *
 * @returns {number} Seconds since epoch.
 */
function nowEpoch () {
  return Math.floor(new Date().getTime() / 1000)
}

/**
 * Create mocked HTTP headers.
 *
 * @returns {[[string, *]]} Array of string->string headers.
 */
function headers () {
  return new Map([
    ['servertime', nowEpoch()]
  ])
}

describe('Frontend - content.mjs', function () {
  beforeEach(function () {
    Test.setupTestData()
  })

  it('findPiece()', function () {
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Content.findPiece()).to.be.eql(null)
        expect(Content.findPiece('U0kg8300')).to.be.eql(null) // asset id
        expect(Content.findPiece('Ta3RTTni')).to.be.an('object')
        expect(Content.findPiece('Ta3RTTni').id).to.be.eql('Ta3RTTni')
      } else if (i === 1) {
        expect(Content.findPiece('Ta3RTTni' + i)).to.be.eql(null)
      } else {
        State.setTableNo(i, false)
        expect(Content.findPiece()).to.be.eql(null)
        expect(Content.findPiece('Ta3RTTni')).to.be.eql(null)
        expect(Content.findPiece('Ta3RTTni' + i)).to.be.an('object')
      }
    }
  })

  it('findAsset()', function () {
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)

      // invalid searches
      expect(Content.findAsset()).to.be.eql(null)
      expect(Content.findAsset('Ta3RTTni' + i)).to.be.eql(null) // piece ID

      // valid default searches
      expect(Content.findAsset('U0kg8300')).to.be.an('object')
      expect(Content.findAsset('U0kg8300').id).to.be.eql('U0kg8300')

      // valid limited searches
      expect(Content.findAsset('U0kg8300', Content.LAYER.TOKEN)).to.be.an('object')
      expect(Content.findAsset('U0kg8300', Content.LAYER.TOKEN).id).to.be.eql('U0kg8300')

      // invalid limited searches
      expect(Content.findAsset('U0kg8300', Content.LAYER.TILE)).to.be.eql(null)
      expect(Content.findAsset('U0kg8300', Content.LAYER.OTHER)).to.be.eql(null)
      expect(Content.findAsset('U0kg8300', Content.LAYER.STICKER)).to.be.eql(null)
    }
  })

  it('getTopLeft()', function () {
    const piece = Content.populatePieceDefaults({ ...Test.data.pieceMinimal(), x: 256, y: 192 })
    const xy = Content.getTopLeft(piece)
    expect(xy.left).to.be.eql(256 - 0 * 64 - 64 / 2)
    expect(xy.top).to.be.eql(192 - 0 * 64 - 64 / 2)
  })

  it('getPieceBounds()', function () {
    const piece = Content.populatePieceDefaults({ ...Test.data.pieceMinimal(), x: 256, y: 192 })
    const bonds = Content._private.getPieceBounds(piece)
    expect(bonds.left).to.be.eql(256 - 0 * 64 - 64 / 2)
    expect(bonds.right).to.be.eql(256 + 0 * 64 + 64 / 2 - 1)
    expect(bonds.top).to.be.eql(192 - 0 * 64 - 64 / 2)
    expect(bonds.bottom).to.be.eql(192 + 0 * 64 + 64 / 2 - 1)
  })

  it('findPiecesWithin()', function () {
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)

      if (i === 1) {
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 0, bottom: 0 }).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 100, bottom: 100 }).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: 100, top: 100, right: -100, bottom: -100 }).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eql(0)
      } else if (i === Test.TEST_STATE) {
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eql(12)
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, Content.LAYER.TILE, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, Content.LAYER.STICKER, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, Content.LAYER.TOKEN, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, Content.LAYER.OTHER, i).length).to.be.eql(1)
      } else {
        // all layers
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, 'all', i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, 'all', i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, 'all', i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, 'all', i).length).to.be.eql(0)

        // 'correct' layer
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, Content.LAYER.TOKEN, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, Content.LAYER.TOKEN, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, Content.LAYER.TOKEN, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, Content.LAYER.TOKEN, i).length).to.be.eql(1)
        expect(Content._private.findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, Content.LAYER.TOKEN, i).length).to.be.eql(0)

        // wrong layer
        expect(Content._private.findPiecesWithin({ left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }, Content.LAYER.TILE, i).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 1000, bottom: 1000 }, Content.LAYER.TILE, i).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 256 + 10, bottom: 192 + 10 }, Content.LAYER.TILE, i).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: 0, top: 0, right: 256 - 10, bottom: 192 - 10 }, Content.LAYER.TILE, i).length).to.be.eql(0)
        expect(Content._private.findPiecesWithin({ left: 256 + 64 - 10, top: 192 + 64 - 10, right: 1000, bottom: 1000 }, Content.LAYER.TILE, i).length).to.be.eql(0)
      }
    }
  })

  it('findPiecesExpired()', function () {
    // no expiration
    let piece = JSON.parse(pieceJSON)
    piece = Content.populatePieceDefaults(piece, headers())
    State._private.setTable(Test.TEST_STATE, [piece])
    expect(Content.findPiecesExpired(1).length).to.be.eql(0)
    expect(Content.findPiecesExpired(Test.TEST_STATE).length).to.be.eql(0)
    expect(Content.findPiecesExpired().length).to.be.eql(0)

    // past expiration
    piece = JSON.parse(pieceJSON)
    piece.expires = nowEpoch() - 10
    piece = Content.populatePieceDefaults(piece, headers())
    State._private.setTable(Test.TEST_STATE, [piece])
    expect(Content.findPiecesExpired(1).length).to.be.eql(0)
    expect(Content.findPiecesExpired(Test.TEST_STATE).length).to.be.eql(1)
    State.setTableNo(2, false)
    expect(Content.findPiecesExpired().length).to.be.eql(0)
    State.setTableNo(Test.TEST_STATE, false)
    expect(Content.findPiecesExpired().length).to.be.eql(1)

    // future expiration
    piece = JSON.parse(pieceJSON)
    piece.expires = nowEpoch() + 10
    piece = Content.populatePieceDefaults(piece, headers())
    State._private.setTable(Test.TEST_STATE, [piece])
    expect(Content.findPiecesExpired(1).length).to.be.eql(0)
    expect(Content.findPiecesExpired(Test.TEST_STATE).length).to.be.eql(0)
    expect(Content.findPiecesExpired().length).to.be.eql(0)
  })

  it('sanitizePiecePatch()', function () {
    const expires = nowEpoch()
    State.setTableNo(Test.TEST_STATE, false)

    let patch = {}
    expect(Content.sanitizePiecePatch(patch)).to.be.eql({})
    expect(Content.sanitizePiecePatch(patch, 'fe008a4d')).to.be.eql({})

    patch = { unknown: 1, another: 2 }
    expect(Content.sanitizePiecePatch(patch)).to.be.eql({})
    expect(Content.sanitizePiecePatch(patch, 'fe008a4d')).to.be.eql({})

    patch = {
      id: 'fe008a4d',
      a: 'U0kg8300',
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
      expires
    }
    expect(Content.sanitizePiecePatch(patch)).not.to.be.eq(patch) // check for new object
    expect(Content.sanitizePiecePatch(patch)).to.be.eql(patch)
    expect(Content.sanitizePiecePatch(patch, 'invalid')).not.to.be.eq(patch) // check for new object
    expect(Content.sanitizePiecePatch(patch, 'invalid')).to.be.eql(patch)
    expect(Content.sanitizePiecePatch(patch, 'fe008a4d')).not.to.be.eq(patch) // check for new object
    expect(Content.sanitizePiecePatch(patch, 'fe008a4d')).to.be.eql(patch)

    // check too low values
    patch = {
      id: 'fe008a4d',
      a: 'U0kg8300',
      b: 'blind',
      c: [-1, -9], // 13 colors in setup
      x: -111,
      y: -222,
      z: -333,
      r: -180,
      w: -3,
      h: -4,
      l: -1,
      s: -1,
      n: -1,
      t: ['one', 'more', 'time'],
      expires: -expires
    }
    expect(Content.sanitizePiecePatch(patch, 'fe008a4d')).to.be.eql({
      id: 'fe008a4d',
      a: 'U0kg8300',
      b: 'blind',
      c: [13, 5],
      x: 0,
      y: 0,
      z: -333,
      r: 180,
      w: 1,
      h: 1,
      l: -1,
      s: 0,
      n: 35,
      t: ['one', 'more', 'time'],
      expires: -expires
    })

    // check too high values
    patch = {
      id: 'fe008a4d',
      a: 'U0kg8300',
      b: 'blind',
      c: [4, 14], // 13 colors in setup
      x: 11111,
      y: 22222,
      z: 33333,
      r: 180 + 360,
      w: 36,
      h: 37,
      l: 99,
      s: 4,
      n: 37,
      t: ['one', 'more', 'time'],
      f: 0b100000101,
      expires
    }
    expect(Content.sanitizePiecePatch(patch, 'fe008a4d')).to.be.eql({
      id: 'fe008a4d',
      a: 'U0kg8300',
      b: 'blind',
      c: [4, 0],
      x: 3071,
      y: 2047,
      z: 33333,
      r: 180,
      w: 32,
      h: 32,
      l: 99,
      s: 0,
      n: 1,
      t: ['one', 'more', 'time'],
      f: 0b00000101,
      expires
    })
  })

  it('populateSetupDefaults()', function () {
    const t1 = Content.populateSetupDefaults({})
    expect(Object.keys(t1)).to.have.members(['borders', '_meta'])
    expect(t1.borders).to.be.an('array')
    expect(t1._meta).to.be.an('object')
  })

  it('populateAssetDefaults()', function () {
    const t1 = Content._private.populateAssetDefaults({ type: 'token' })
    expect(Object.keys(t1)).to.have.members(['_hash', 'type', 'w', 'h', 'd'])
    expect(t1.w).to.be.eql(1)
    expect(t1.h).to.be.eql(1)
    expect(t1.d).to.be.eql(2)
    expect(t1._hash).to.be.eql(752053024)

    const t2 = Content._private.populateAssetDefaults({ type: 'tile' })
    expect(Object.keys(t2)).to.have.members(['_hash', 'type', 'w', 'h', 'd'])
    expect(t2.w).to.be.eql(1)
    expect(t2.h).to.be.eql(1)
    expect(t2.d).to.be.eql(2)

    const t3 = Content._private.populateAssetDefaults({ type: 'sticker' })
    expect(Object.keys(t3)).to.have.members(['_hash', 'type', 'w', 'h', 'd'])
    expect(t3.w).to.be.eql(1)
    expect(t3.h).to.be.eql(1)
    expect(t3.d).to.be.eql(0)

    const t4 = Content._private.populateAssetDefaults({ type: 'other' })
    expect(Object.keys(t4)).to.have.members(['_hash', 'type', 'w', 'h', 'd'])
    expect(t4.w).to.be.eql(1)
    expect(t4.h).to.be.eql(1)
    expect(t4.d).to.be.eql(2)

    const t5 = Content._private.populateAssetDefaults({ w: 1 })
    expect(Object.keys(t5)).to.have.members(['_hash', 'w', 'h', 'd'])
    expect(t5.w).to.be.eql(1)
    expect(t5.h).to.be.eql(1)

    const t6 = Content._private.populateAssetDefaults({ h: 5 })
    expect(Object.keys(t6)).to.have.members(['_hash', 'w', 'h', 'd'])
    expect(t6.w).to.be.eql(1)
    expect(t6.h).to.be.eql(5)

    const t7 = Content._private.populateAssetDefaults({ w: 5 })
    expect(Object.keys(t7)).to.have.members(['_hash', 'w', 'h', 'd'])
    expect(t7.w).to.be.eql(5)
    expect(t7.h).to.be.eql(5)

    const t8 = Content._private.populateAssetDefaults({ w: 5, h: 2 })
    expect(Object.keys(t8)).to.have.members(['_hash', 'w', 'h', 'd'])
    expect(t8.w).to.be.eql(5)
    expect(t8.h).to.be.eql(2)
  })

  it('populatePieceDefaults()', function () {
    const p1 = Content.populatePieceDefaults({})
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

    const p2 = Content.populatePieceDefaults({ ...Test.data.pieceMinimal(), a: 'XXXXXXXX' }, headers())
    expect(p2.w).to.be.eql(1)
    expect(p2.h).to.be.eql(1)
    expect(p2.s).to.be.eql(0)
    expect(p2.c.length).to.be.eql(2)
    expect(p2.c[0]).to.be.eql(0)
    expect(p2.c[1]).to.be.eql(0)
    expect(p2.r).to.be.eql(0)
    expect(p2.n).to.be.eql(0)
    expect(p2.b.length).to.be.eql(0)
    expect(p2.t.length).to.be.eql(0)
    expect(p2._meta.originWidthPx).to.be.eql(64)
    expect(p2._meta.originHeightPx).to.be.eql(64)
    expect(p2._meta.widthPx).to.be.eql(64)
    expect(p2._meta.heightPx).to.be.eql(64)
    expect(p2._meta.originOffsetXPx).to.be.eql(0)
    expect(p2._meta.originOffsetYPx).to.be.eql(0)
    expect(p2._meta.feature).to.be.eql('DISCARD')
  })

  it('populatePiecesDefaults()', function () {
    let p = Content.populatePiecesDefaults([{ w: 1 }, { w: 2 }, { w: 3 }])
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
    p = Content.populatePiecesDefaults([{}], headers())
    expect(p.length).to.be.eql(1)
    p = Content.populatePiecesDefaults([{ expires: nowEpoch() - 10 }], headers())
    expect(p.length).to.be.eql(0)
    p = Content.populatePiecesDefaults([{ expires: nowEpoch() + 10 }], headers())
    expect(p.length).to.be.eql(1)
  })

  it('findPiecesWithinBounds()', function () {
    // select a single token
    State.setTableNo(Test.TEST_STATE, false)
    State._private.setTable(Test.TEST_STATE, Content.populatePiecesDefaults(JSON.parse(tableJSON)))
    const pieces = [Content.findPiece('9754d0c0')] // 1x1 token

    // we find ourself if selection is in our space
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox)[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344, y: 192 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344, y: 192 })[0].id).to.be.eql('9754d0c0')

    // we still find ourself if selection is overlapping 1px
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 63, y: 192 - 63 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 63, y: 192 - 63 })[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 63, y: 192 + 63 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 63, y: 192 + 63 })[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 63, y: 192 + 63 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 63, y: 192 + 63 })[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 63, y: 192 - 63 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 63, y: 192 - 63 })[0].id).to.be.eql('9754d0c0')

    // we don't find ourself if selection is not overlapping ...
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 64, y: 192 - 64 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 64, y: 192 + 64 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 64, y: 192 + 64 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 64, y: 192 - 64 }).length).to.be.eql(0)

    // ... but we find ourself if selection is using padding
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 64, y: 192 - 64 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 64, y: 192 - 64 }, true)[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 64, y: 192 + 64 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 - 64, y: 192 + 64 }, true)[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 64, y: 192 + 64 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 64, y: 192 + 64 }, true)[0].id).to.be.eql('9754d0c0')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 64, y: 192 - 64 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 1344 + 64, y: 192 - 64 }, true)[0].id).to.be.eql('9754d0c0')

    // we find only a tile, if over there
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960, y: 128 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960, y: 128 })[0].id).to.be.eql('437e26b9')

    // we still find the tile when overlapping 1px
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 - 96 - 32 + 1, y: 128 - 64 - 32 + 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 - 96 - 32 + 1, y: 128 - 64 - 32 + 1 })[0].id).to.be.eql('437e26b9')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 - 96 - 32 + 1, y: 128 + 64 + 32 - 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 - 96 - 32 + 1, y: 128 + 64 + 32 - 1 })[0].id).to.be.eql('437e26b9')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 + 96 + 32 - 1, y: 128 + 64 + 32 - 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 + 96 + 32 - 1, y: 128 + 64 + 32 - 1 })[0].id).to.be.eql('437e26b9')
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 + 96 + 32 - 1, y: 128 - 64 - 32 + 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 + 96 + 32 - 1, y: 128 - 64 - 32 + 1 })[0].id).to.be.eql('437e26b9')

    // we dont find the tile when barely not overlapping
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 - 96 - 32, y: 128 - 64 - 32 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 - 96 - 32, y: 128 + 64 + 32 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 + 96 + 32, y: 128 + 64 + 32 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures(pieces).boundingBox, { x: 960 + 96 + 32, y: 128 - 64 - 32 }).length).to.be.eql(0)
  })

  it('findPiecesWithinBounds(x, y, true)', function () { // use rotated pieces here
    // select a single token
    const pieces = Content.populatePiecesDefaults(JSON.parse(`[
      {
        "l": 4,
        "a": "c0655749",
        "w": 1,
        "h": 2,
        "x": 2048,
        "y": 1024,
        "r": 270,
        "id": "00000001"
      }, {
        "l": 1,
        "a": "c0655749",
        "w": 3,
        "h": 2,
        "x": 1024,
        "y": 2048,
        "r": 90,
        "id": "00000002"
      }
    ]`))
    State._private.setTable(8, pieces)
    State.setTableNo(8, false)

    // corner touching
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }).length).to.be.eql(0)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }).length).to.be.eql(0)

    // corner touching but padding
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }, true).length).to.be.eql(1)

    // corner overlapping
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }).length).to.be.eql(1)

    // corner overlapping and padding
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }, true).length).to.be.eql(1)
    expect(Content._private.findPiecesWithinBounds(Content.getFeatures([pieces[1]]).boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }, true).length).to.be.eql(1)
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
    const b = Content._private.sortZ(pieces)
    expect(b[0].z).to.be.eql(3)
    expect(b[1].z).to.be.eql(2)
    expect(b[2].z).to.be.eql(1)
    expect(b[3].z).to.be.eql(-1)
  })

  it('createPieceFromAsset()', function () {
    const piece = Content.createPieceFromAsset('XXXXXXXX')
    expect(piece.a).to.be.eql('XXXXXXXX')
    expect(piece.l).to.be.eql(Content.LAYER.OTHER)
    expect(piece.w).to.be.eql(4)
    expect(piece.h).to.be.eql(4)
    expect(piece.x).to.be.eql(0)
    expect(piece.y).to.be.eql(0)
    expect(piece.z).to.be.eql(41)
    expect(piece.s).to.be.eql(0)
    expect(piece.c[0]).to.be.eql(0)
    expect(piece.r).to.be.eql(0)
    expect(piece.n).to.be.eql(0)
    expect(piece.t.length).to.be.eql(0)
    expect(piece._meta.sides).to.be.eql(1)
    expect(piece._meta.feature).to.be.eql('DISCARD')

    const piece2 = Content.createPieceFromAsset('U0kg8300')
    expect(piece2.z).to.be.eql(38)
  })

  it('clampToTableSize()', function () {
    const piece1 = Content.populatePieceDefaults(JSON.parse(pieceJSON))
    Content.clampToTableSize(piece1)
    expect(piece1.x).to.be.eql(256)
    expect(piece1.y).to.be.eql(192)

    const piece2 = Content.populatePieceDefaults(JSON.parse(pieceJSON))
    piece2.x = -10
    piece2.y = -20
    Content.clampToTableSize(piece2)
    expect(piece2.x).to.be.eql(0)
    expect(piece2.y).to.be.eql(0)

    const piece3 = Content.populatePieceDefaults(JSON.parse(pieceJSON))
    piece3.x = 50000
    piece3.y = 60000
    Content.clampToTableSize(piece3)
    expect(piece3.x).to.be.eql(3071)
    expect(piece3.y).to.be.eql(2047)

    const piece4 = Content.populatePieceDefaults(JSON.parse(pieceJSON))
    piece4.x = 50000
    piece4.y = 60000
    piece4.w = 3
    piece4.h = 2
    Content.clampToTableSize(piece4)
    expect(piece4.x).to.be.eql(3071)
    expect(piece4.y).to.be.eql(2047)
  })

  it('snap()', function () { // hint - more in-depth snapping tests in util-test
    expect(Content.snap(31, -1).x).to.be.eql(32)
    expect(Content.snap(31, -1).y).to.be.eql(0)
  })

  it('getSetupCenter()', function () {
    // current table
    expect(Content.getSetupCenter().x).to.be.eql(1984)
    expect(Content.getSetupCenter().y).to.be.eql(2032)

    // single token
    expect(Content.getSetupCenter(2).x).to.be.eql(11)
    expect(Content.getSetupCenter(2).y).to.be.eql(22)

    // full table
    expect(Content.getSetupCenter(Test.TEST_STATE).x).to.be.eql(1984)
    expect(Content.getSetupCenter(Test.TEST_STATE).y).to.be.eql(2032)
  })

  it('splitAssetFilename()', function () {
    let asset

    asset = Content.splitAssetFilename('door.1x2x3.jpg')
    expect(asset.name).to.be.eql('door')
    expect(asset.w).to.be.eql(1)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(3)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('door.1x2.jpg')
    expect(asset.name).to.be.eql('door')
    expect(asset.w).to.be.eql(1)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('door.1x2x3.123456.jpg')
    expect(asset.name).to.be.eql('door')
    expect(asset.w).to.be.eql(1)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(3)
    expect(asset.bg).to.be.eql('123456')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('door.1x2.123456.jpg')
    expect(asset.name).to.be.eql('door')
    expect(asset.w).to.be.eql(1)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('123456')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('dungeon.doorOpen.3x2x1.png')
    expect(asset.name).to.be.eql('dungeon.doorOpen')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('dungeon.doorOpen.3x2.png')
    expect(asset.name).to.be.eql('dungeon.doorOpen')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('dungeon.doorOpen.3x2x1.transparent.png')
    expect(asset.name).to.be.eql('dungeon.doorOpen')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('transparent')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('dungeon.doorOpen.3x2.transparent.png')
    expect(asset.name).to.be.eql('dungeon.doorOpen')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('transparent')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('asdf.svg')
    expect(asset.name).to.be.eql('asdf')
    expect(asset.w).to.be.eql(undefined)
    expect(asset.h).to.be.eql(undefined)
    expect(asset.s).to.be.eql(undefined)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(undefined)

    asset = Content.splitAssetFilename('invalid')
    expect(asset.name).to.be.eql(undefined)
    expect(asset.w).to.be.eql(undefined)
    expect(asset.h).to.be.eql(undefined)
    expect(asset.s).to.be.eql(undefined)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(undefined)

    asset = Content.splitAssetFilename('dungeon.doorOpen.3x2x1.transparent.png')
    expect(asset.name).to.be.eql('dungeon.doorOpen')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('transparent')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('dungeon.doorOpen.3x2.transparent.png')
    expect(asset.name).to.be.eql('dungeon.doorOpen')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('transparent')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('monster.1x1x1.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(1)
    expect(asset.h).to.be.eql(1)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('monster.1x1.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(1)
    expect(asset.h).to.be.eql(1)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql(undefined)
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('monster.2x2x1.abcdef.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(2)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('abcdef')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('monster.2x2.abcdef.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(2)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('abcdef')
    expect(asset.tx).to.be.eql(undefined)
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('tile.4x8x2.abcdef-wood.jpg')
    expect(asset.name).to.be.eql('tile')
    expect(asset.w).to.be.eql(4)
    expect(asset.h).to.be.eql(8)
    expect(asset.s).to.be.eql(2)
    expect(asset.bg).to.be.eql('abcdef')
    expect(asset.tx).to.be.eql('wood')
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('tile.4x8.abcdef-wood.jpg')
    expect(asset.name).to.be.eql('tile')
    expect(asset.w).to.be.eql(4)
    expect(asset.h).to.be.eql(8)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('abcdef')
    expect(asset.tx).to.be.eql('wood')
    expect(asset.type).to.be.eql(Content.LAYER.TILE)

    asset = Content.splitAssetFilename('monster.2x2x1.1-paper.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(2)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('1')
    expect(asset.tx).to.be.eql('paper')
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('monster.2x2.1-paper.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(2)
    expect(asset.h).to.be.eql(2)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('1')
    expect(asset.tx).to.be.eql('paper')
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('monster.3x3x1.transparent.wood.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(3)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('transparent')
    expect(asset.tx).to.be.eql('wood')
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)

    asset = Content.splitAssetFilename('monster.3x3.transparent.wood.jpg')
    expect(asset.name).to.be.eql('monster')
    expect(asset.w).to.be.eql(3)
    expect(asset.h).to.be.eql(3)
    expect(asset.s).to.be.eql(1)
    expect(asset.bg).to.be.eql('transparent')
    expect(asset.tx).to.be.eql('wood')
    expect(asset.type).to.be.eql(Content.LAYER.TOKEN)
  })

  it('clone()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'Z1', x: 64, y: 64, z: 10, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z2', x: 64, y: 64, z: 11, l: 2, f: Content.FLAG.NO_CLONE },
      { ...Test.data.pieceFull(), id: 'Z3', x: 64, y: 64, z: 21, l: 1, f: Content.FLAG.TILE_GRID_MAJOR },
      { ...Test.data.pieceFull(), id: 'Z4', x: 64, y: 64, z: 22, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z5', x: 64, y: 64, z: 25, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z6', x: 512, y: 512, z: 26, l: 1 } // far away
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.clone([], { x: 256, y: 256 }, 1, false))).to.be.eql({})
    expect(Test.mock(await Content.clone([pieces[1]], { x: 256, y: 256 }, 1, false))).to.be.eql({})

    expect(Test.mock(await Content.clone([pieces[1], pieces[2]], { x: 256, y: 256 }, 1, false)).body).to.be.eql([{
      ...Test.data.pieceFull(), id: 'Z3', x: 256, y: 256, z: 26, l: 1, n: pieces[2].n + 1, f: Content.FLAG.TILE_GRID_MAJOR
    }])

    expect(Test.mock(await Content.clone([pieces[1], pieces[2]], { x: 512, y: 512 }, 0, false)).body).to.be.eql([{
      ...Test.data.pieceFull(), id: 'Z3', x: 512, y: 512, z: 27, l: 1, n: pieces[2].n, f: Content.FLAG.TILE_GRID_MAJOR
    }])
    expect(Test.mock(await Content.clone([pieces[1], pieces[2]], { x: 512, y: 512 }, 1, false)).body).to.be.eql([{
      ...Test.data.pieceFull(), id: 'Z3', x: 512, y: 512, z: 27, l: 1, n: pieces[2].n + 1, f: Content.FLAG.TILE_GRID_MAJOR
    }])
    expect(Test.mock(await Content.clone([pieces[1], pieces[2]], { x: 512, y: 512 }, 2, false)).body).to.be.eql([{
      ...Test.data.pieceFull(), id: 'Z3', x: 512, y: 512, z: 27, l: 1, n: pieces[2].n + 2, f: Content.FLAG.TILE_GRID_MAJOR
    }])

    Test.setupTestData([
      { ...JSON.parse(pieceJSON), id: 'A', x: 64, y: 64 },
      { ...JSON.parse(pieceJSON), id: 'B', x: 32, y: 32, f: Content.FLAG.NO_CLONE },
      { ...JSON.parse(pieceJSON), id: 'C', x: 256, y: 128 }
    ])

    const a = Content.findPiece('A')
    const b = Content.findPiece('B')
    const c = Content.findPiece('C')

    const clone1 = Test.mock(await Content.clone([a], { x: 64 + 64 * 10, y: 64 + 64 * 8 }, 1, false)).body // will snap!
    expect(clone1.length).to.be.eql(1)
    expect(clone1[0].id).to.be.eql('A')
    expect(clone1[0].x).to.be.eql(64 + 64 * 10)
    expect(clone1[0].y).to.be.eql(64 + 64 * 8)
    expect(Content.getFeatures([a]).clone).to.be.eql(true)

    const clone2 = Test.mock(await Content.clone([a, b], { x: 64 + 64 * 10, y: 64 + 64 * 8 }, 1, false)).body // will snap!
    expect(clone2.length).to.be.eql(1)
    expect(clone2[0].id).to.be.eql('A')
    expect(clone2[0].x).to.be.eql(64 + 64 * 10)
    expect(clone2[0].y).to.be.eql(64 + 64 * 8)
    expect(Content.getFeatures([a, b]).clone).to.be.eql(true)

    const clone3 = Test.mock(await Content.clone([a, b, c], { x: 64 * 10, y: 64 * 8 }, 1, false)).body // will snap!
    expect(clone3.length).to.be.eql(2)
    expect(clone3[0].id).to.be.eql('A')
    expect(clone3[0].x).to.be.eql(64 * 10 - (256 - 64) / 2)
    expect(clone3[0].y).to.be.eql(64 * 8 - (128 - 64) / 2)
    expect(clone3[1].id).to.be.eql('C')
    expect(clone3[1].x).to.be.eql(64 * 10 + (256 - 64) / 2)
    expect(clone3[1].y).to.be.eql(64 * 8 + (128 - 64) / 2)
    expect(Content.getFeatures([a, b, c]).clone).to.be.eql(true)
  })

  it('move()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: '1', w: 1, h: 1, x: 32 + 64 * 0, y: 32 + 64 * 0 },
      { ...Test.data.pieceMinimal(), id: '2', w: 1, h: 1, x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_MOVE },
      { ...Test.data.pieceMinimal(), id: '3', w: 1, h: 1, x: 32 + 64 * 2, y: 32 + 64 * 2 }
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content._private.move([], 1, 1, 4, false))).to.be.eql({})
    expect(Test.mock(await Content._private.move([pieces[1]], 1, 1, 4, false))).to.be.eql({})

    const move1 = Test.mock(await Content._private.move([pieces[2]], 1, 1, 3, false)).body
    expect(move1.length).to.be.eql(1)
    expect(move1[0].id).to.be.eql('3')
    expect(move1[0].x).to.be.eql(32 + 64 * 2) // snap
    expect(move1[0].y).to.be.eql(32 + 64 * 2) // snap

    const move2 = Test.mock(await Content._private.move([pieces[2]], 1, 1, 4, false)).body
    expect(move2.length).to.be.eql(1)
    expect(move2[0].id).to.be.eql('3')
    expect(move2[0].x).to.be.eql(32 + 64 * 2 + 1) // no snap
    expect(move2[0].y).to.be.eql(32 + 64 * 2 + 1) // no snap
  })

  it('moveTiles()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: '1', w: 1, h: 1, x: 32 + 64 * 0, y: 32 + 64 * 0 },
      { ...Test.data.pieceMinimal(), id: '2', w: 1, h: 1, x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_MOVE },
      { ...Test.data.pieceMinimal(), id: '3', w: 1, h: 1, x: 32 + 64 * 2, y: 32 + 64 * 2 }
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.moveTiles([], 1, 1, false))).to.be.eql({})
    expect(Test.mock(await Content.moveTiles([pieces[1]], 1, 1, false))).to.be.eql({})

    expect(Content.getFeatures([pieces[2]]).move).to.be.eql(true)
    const move1 = Test.mock(await Content.moveTiles([pieces[2]], 1, 2, false)).body
    expect(move1.length).to.be.eql(1)
    expect(move1[0].id).to.be.eql('3')
    expect(move1[0].x).to.be.eql(32 + 64 * 3 + 0 * 64)
    expect(move1[0].y).to.be.eql(32 + 64 * 3 + 1 * 64)

    expect(Content.getFeatures([pieces[0], pieces[1]]).move).to.be.eql(true)
    const move2 = Test.mock(await Content.moveTiles([pieces[0]], 2, 1, false)).body
    expect(move2.length).to.be.eql(1)
    expect(move2[0].id).to.be.eql('1')
    expect(move2[0].x).to.be.eql(32 + 64 * 1 + 1 * 64)
    expect(move2[0].y).to.be.eql(32 + 64 * 1 + 0 * 64)

    // move out of table
    const move4 = Test.mock(await Content.moveTiles(pieces, 1, 2, false)).body
    expect(move4.length).to.be.eql(2)
    expect(Test.mock(await Content.moveTiles(pieces, -1, 0, false))).to.be.eql({})
    expect(Test.mock(await Content.moveTiles(pieces, 0, -1, false))).to.be.eql({})
    expect(Test.mock(await Content.moveTiles(pieces, 200, 0, false))).to.be.eql({})
    expect(Test.mock(await Content.moveTiles(pieces, 0, 200, false))).to.be.eql({})
  })

  it('toTop()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'Z1', x: 64, y: 64, z: 10, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z2', x: 64, y: 64, z: 11, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z3', x: 64, y: 64, z: 21, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z4', x: 64, y: 64, z: 22, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z5', x: 64, y: 64, z: 25, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z6', x: 512, y: 512, z: 26, l: 1 } // far away
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.toTop([], false))).to.be.eql({})
    expect(Test.mock(await Content.toTop([pieces[1]], false))).to.be.eql({})
    expect(Test.mock(await Content.toTop([pieces[0]], false)).body).to.be.eql([{
      id: 'Z1',
      z: 12
    }])

    expect(Test.mock(await Content.toTop([pieces[2], pieces[3], pieces[4]], false)).body).to.be.eql([
      {
        id: 'Z3',
        z: 1
      }, {
        id: 'Z4',
        z: 2
      }, {
        id: 'Z5',
        z: 3
      }
    ])
    expect(Test.mock(await Content.toTop([pieces[2], pieces[3]], false)).body).to.be.eql([{
      id: 'Z3',
      z: 26
    }, {
      id: 'Z4',
      z: 27
    }])

    expect(Test.mock(await Content.toTop([pieces[0], pieces[2]], false)).body).to.be.eql([{
      id: 'Z1',
      z: 12
    }, {
      id: 'Z3',
      z: 26
    }])
  })

  it('toBottom()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'Z1', x: 64, y: 64, z: 10, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z2', x: 64, y: 64, z: 11, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z3', x: 64, y: 64, z: 21, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z4', x: 64, y: 64, z: 22, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z5', x: 64, y: 64, z: 25, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z6', x: 512, y: 512, z: 2, l: 1 } // far away
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.toBottom([], false))).to.be.eql({})
    expect(Test.mock(await Content.toBottom([pieces[0]], false))).to.be.eql({})
    expect(Test.mock(await Content.toBottom([pieces[1]], false)).body).to.be.eql([{
      id: 'Z2',
      z: 9
    }])

    expect(Test.mock(await Content.toBottom([pieces[2], pieces[3], pieces[4]], false)).body).to.be.eql([
      {
        id: 'Z5',
        z: -1
      }, {
        id: 'Z4',
        z: -2
      }, {
        id: 'Z3',
        z: -3
      }
    ])
    expect(Test.mock(await Content.toBottom([pieces[3], pieces[4]], false)).body).to.be.eql([{
      id: 'Z5',
      z: 20
    }, {
      id: 'Z4',
      z: 19
    }])

    expect(Test.mock(await Content.toBottom([pieces[1], pieces[3]], false)).body).to.be.eql([{
      id: 'Z4',
      z: 20
    }, {
      id: 'Z2',
      z: 9
    }])
  })

  it('findMaxZs()', function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'Z1', x: 64, y: 64, z: 10, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z2', x: 64, y: 64, z: 11, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z3', x: 64, y: 64, z: 21, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z4', x: 64, y: 64, z: 22, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z5', x: 512, y: 512, z: 5, l: 1 }
    ]
    Test.setupTestData(pieces)

    expect(Content.findMaxZs([])).to.be.eql({})
    expect(Content.findMaxZs(pieces)).to.be.eql({
      sticker: 11,
      tile: 22
    })
    expect(Content.findMaxZs(pieces, [pieces[0], pieces[3]])).to.be.eql({
      sticker: 11,
      tile: 21
    })
    expect(Content.findMaxZs([pieces[0], pieces[1]], [pieces[1]])).to.be.eql({
      sticker: 10
    })
    expect(Content.findMaxZs([pieces[0], pieces[1]], [])).to.be.eql({
      sticker: 11
    })
    expect(Content.findMaxZs([pieces[0], pieces[1]], [], { x: 512, y: 512 })).to.be.eql({
      tile: 5
    })
  })

  it('findMinZs()', function () {
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'Z1', z: 10, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z2', z: 11, l: 2 },
      { ...Test.data.pieceFull(), id: 'Z3', z: 21, l: 1 },
      { ...Test.data.pieceFull(), id: 'Z4', z: 22, l: 1 }
    ])

    expect(Content.findMaxZs([])).to.be.eql({})
    expect(Content.findMaxZs(pieces)).to.be.eql({
      sticker: 11,
      tile: 22
    })
    expect(Content.findMaxZs(pieces, [pieces[0], pieces[3]])).to.be.eql({
      sticker: 11,
      tile: 21
    })
  })

  it('remove()', async function () {
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'D1' },
      { ...Test.data.pieceFull(), id: 'D2', f: Content.FLAG.NO_DELETE | Content.FLAG.NO_MOVE },
      { ...Test.data.pieceFull(), id: 'D3' },
      { ...Test.data.pieceFull(), id: 'D4', f: Content.FLAG.NO_DELETE }
    ])

    expect(Test.mock(await Content.remove([], false))).to.be.eql({})
    expect(Test.mock(await Content.remove([pieces[1]], false))).to.be.eql({})
    expect(Test.mock(await Content.remove([pieces[1], pieces[3]], false))).to.be.eql({})
    expect(Test.mock(await Content.remove([pieces[0], pieces[1], pieces[3], pieces[2]], false)).body).to.be.eql([pieces[0].id, pieces[2].id])
  })

  it('rotate()', async function () {
    State.setRoomPreference(State.PREF.PIECE_ROTATE, 45)

    expect(Test.mock(await Content.rotate([], false))).to.be.eql({})

    expect(Test.mock(await Content.rotate([
      { ...Test.data.pieceFull(), id: 'R1', r: 0 },
      { ...Test.data.pieceFull(), id: 'R2', r: 10 },
      { ...Test.data.pieceFull(), id: 'R3', r: 360 - 45 },
      { ...Test.data.pieceFull(), id: 'R4', r: 350 }
    ], true, false)).body).to.be.eql([
      { id: 'R1', r: 45 },
      { id: 'R2', r: 55 },
      { id: 'R3', r: 0 },
      { id: 'R4', r: 35 }
    ])

    expect(Test.mock(await Content.rotate([
      { ...Test.data.pieceFull(), id: 'R1', r: 0 },
      { ...Test.data.pieceFull(), id: 'R2', r: 45 },
      { ...Test.data.pieceFull(), id: 'R3', r: 44 },
      { ...Test.data.pieceFull(), id: 'R4', r: 350 }
    ], false, false)).body).to.be.eql([
      { id: 'R1', r: 315 },
      { id: 'R2', r: 0 },
      { id: 'R3', r: 359 },
      { id: 'R4', r: 305 }
    ])
  })

  it('rotateRandom()', async function () {
    expect(Test.mock(await Content.rotateRandom([], false))).to.be.eql({})

    expect(Test.mock(await Content.rotateRandom([
      { ...Test.data.pieceFull(), id: 'R1', r: 0 }
    ], true, false)).body[0]).to.have.all.keys('id', 'r')
  })

  it('flip()', async function () { // set room + asset
    const pieces = [
      { ...Test.data.pieceFull(), id: 'F1', s: 0, l: 1 },
      { ...Test.data.pieceFull(), id: 'F2', s: 1, l: 2 },
      { ...Test.data.pieceFull(), id: 'F3', s: 1, l: 3, a: 'i_6yU100' }, // glass, 1sided
      { ...Test.data.pieceFull(), id: 'F4', s: 1, l: 4 },
      { ...Test.data.pieceFull(), id: 'F5', s: 10, l: 5 },
      { ...Test.data.noteFull(), id: 'F6', l: 3 }
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.flip([], false))).to.be.eql({})

    expect(Test.mock(await Content.flip(pieces, true, false)).body).to.be.eql([
      { id: 'F1', s: 1 },
      { id: 'F2', s: 2 },
      { id: 'F4', s: 2 },
      { id: 'F5', s: 1 }
    ])

    expect(Test.mock(await Content.flip(pieces, false, false)).body).to.be.eql([
      { id: 'F1', s: 9 },
      { id: 'F2', s: 0 },
      { id: 'F4', s: 0 },
      { id: 'F5', s: 9 }
    ])

    expect(Test.mock(await Content.flip([pieces[5]], true, false))).to.be.eql({}) // can't flip notes
  })

  it('grid()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'S1', l: 1 },
      { ...Test.data.pieceFull(), id: 'S2', l: 1, f: Content.FLAG.NO_MOVE },
      { ...Test.data.pieceFull(), id: 'S3', l: 1, f: Content.FLAG.TILE_GRID_MINOR },
      { ...Test.data.pieceFull(), id: 'S4', l: 1, f: Content.FLAG.TILE_GRID_MAJOR | Content.FLAG.NO_CLONE },
      { ...Test.data.pieceFull(), id: 'S5', l: 2 }
    ]
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.grid([], false))).to.be.eql({})
    expect(Test.mock(await Content.grid([pieces[4]], false))).to.be.eql({})

    expect(Test.mock(await Content.grid([pieces[0]], false)).body).to.be.eql([{
      id: 'S1',
      f: Content.FLAG.TILE_GRID_MINOR
    }])
    expect(Test.mock(await Content.grid([pieces[1]], false)).body).to.be.eql([{
      id: 'S2',
      f: Content.FLAG.NO_MOVE | Content.FLAG.TILE_GRID_MINOR
    }])
    expect(Test.mock(await Content.grid([pieces[2]], false)).body).to.be.eql([{
      id: 'S3',
      f: Content.FLAG.TILE_GRID_MAJOR
    }])
    expect(Test.mock(await Content.grid([pieces[3]], false)).body).to.be.eql([{
      id: 'S4',
      f: Content.FLAG.NO_CLONE
    }])
  })

  it('number()', async function () { // set room + asset
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'F1', l: 1, n: 3 },
      { ...Test.data.pieceFull(), id: 'F2', l: 2, n: 3 },
      { ...Test.data.pieceFull(), id: 'F3', l: 3, n: 3 },
      { ...Test.data.pieceFull(), id: 'F4', l: 4, n: 3 },
      { ...Test.data.pieceFull(), id: 'F5', l: 5, n: 3 }
    ])

    expect(Test.mock(await Content.number(pieces, 1, false)).body).to.be.eql([
      { id: 'F4', n: 4 }
    ])
    expect(Test.mock(await Content.number(pieces, -1, false)).body).to.be.eql([
      { id: 'F4', n: 2 }
    ])
    expect(Test.mock(await Content.number(pieces, -4, false)).body).to.be.eql([
      { id: 'F4', n: 35 }
    ])

    State._private.setRoom(JSON.parse(roomJSON))
    State.setTableNo(2, false)

    let r = Test.mock(await Content.number([pieces[3]], -3, false))
    expect(r.method).to.be.eql('PATCH')
    expect(r.path).to.match(/^api\/rooms\/testroom\/tables\/2\/pieces\/$/)
    expect(r.body).to.be.eql([{ id: 'F4', n: 0 }])

    r = Test.mock(await Content.number([pieces[3]], 5, false))
    expect(r.body).to.be.eql([{ id: 'F4', n: 8 }])

    r = Test.mock(await Content.number([pieces[3]], 40, false))
    expect(r.body).to.be.eql([{ id: 'F4', n: 7 }])

    r = Test.mock(await Content.number([pieces[3]], -4, false))
    expect(r.body).to.be.eql([{ id: 'F4', n: 35 }])

    expect(Test.mock(await Content.number([pieces[3]], undefined, false))).to.be.eql({})
    expect(Test.mock(await Content.number([pieces[3]], 0, false))).to.be.eql({})
  })

  it('pile()', async function () { // set room + asset
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'P1', x: 32, y: 32, z: 1 },
      { ...Test.data.pieceFull(), id: 'P2', x: 32, y: 32, z: 2, f: Content.FLAG.NO_MOVE },
      { ...Test.data.pieceFull(), id: 'P3', x: 96, y: 96, z: 3 },
      { ...Test.data.pieceFull(), id: 'P4', x: 32, y: 32, z: 4 },
      { ...Test.data.pieceFull(), id: 'P5', x: 32, y: 32, z: 5 },
      { ...Test.data.noteFull(), id: 'P6', x: 32, y: 32, z: 5, l: 3 }
    ])
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.pile([], false))).to.be.eql({})
    expect(Test.mock(await Content.pile([pieces[2]], false))).to.be.eql({})

    expect(Test.mock(await Content.pile(pieces, false, false)).body).to.be.eql([
      { id: 'P1', x: 64, y: 64 },
      { id: 'P3', x: 64, y: 64 },
      { id: 'P4', x: 64, y: 64 },
      { id: 'P5', x: 64, y: 64 },
      { id: 'P6', x: 64, y: 64 }
    ])

    expect(Test.mock(await Content.pile([pieces[2], pieces[3]], false, false)).body).to.be.eql([
      { id: 'P3', x: 64, y: 64 },
      { id: 'P4', x: 64, y: 64 }
    ])
  })

  it('flipRandom() dice', async function () {
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'F1', l: 4 },
      { ...Test.data.pieceFull(), id: 'F2', l: 4 },
      { ...Test.data.pieceFull(), id: 'F3', l: 4 },
      { ...Test.data.pieceFull(), id: 'F4', l: 4 },
      { ...Test.data.pieceFull(), id: 'F5', l: 4 }
    ])
    Test.setupTestData(pieces)

    expect(Test.mock(await Content.flipRandom([], false))).to.be.eql({})

    const r = Test.mock(await Content.flipRandom([pieces[0], pieces[1]], false)).body
    expect(r[0]).to.have.all.keys('id', 'x', 'y', 's', 'r')
    expect(r[1]).to.have.all.keys('id', 'x', 'y', 's', 'r')
  })

  it('flipRandom() dicemat', async function () {
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'F1', z: 1, l: 5 },
      { ...Test.data.pieceFull(), id: 'F2', z: 2, l: 5 },
      { ...Test.data.pieceFull(), id: 'F3', z: 3, l: 5, a: 'rEH5X200' },
      { ...Test.data.pieceFull(), id: 'F4', z: 4, l: 5 },
      { ...Test.data.pieceFull(), id: 'F5', z: 5, l: 5 }
    ])
    Test.setupTestData(pieces)

    const r = Test.mock(await Content.flipRandom([pieces[2]], false)).body
    expect(r.length).to.be.eql(2)
    expect(r[0].id).to.be.eql('F4')
    expect(r[0]).to.have.all.keys('id', 'x', 'y', 's', 'r')
    expect(r[1].id).to.be.eql('F5')
    expect(r[1]).to.have.all.keys('id', 'x', 'y', 's', 'r')
  })

  it('flipRandom() discard', async function () {
    const pieces = Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'F1', z: 1, l: 5 },
      { ...Test.data.pieceFull(), id: 'F2', z: 2, l: 5 },
      { ...Test.data.pieceFull(), id: 'F3', z: 3, l: 5, a: 'XXXXXXXX' },
      { ...Test.data.pieceFull(), id: 'F4', z: 4, l: 5 },
      { ...Test.data.pieceFull(), id: 'F5', z: 5, l: 5 }
    ])
    Test.setupTestData(pieces)

    const r = Test.mock(await Content.flipRandom([pieces[2]], false)).body
    expect(r.length).to.be.eql(2)
    expect(r[0].id).to.be.eql('F4')
    expect(r[0]).to.have.all.keys('id', 'x', 'y', 'z', 's')
    expect(r[1].id).to.be.eql('F5')
    expect(r[1]).to.have.all.keys('id', 'x', 'y', 'z', 's')
  })

  it('toggleColor()', async function () { // set room + asset
    State._private.setRoom(Test.data.room())

    expect(Test.mock(await Content.toggleColor([], false))).to.be.eql({})

    expect(Test.mock(await Content.toggleColor(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C1', l: 1 },
      { ...Test.data.pieceFull(), id: 'C2', l: 2 },
      { ...Test.data.pieceFull(), id: 'C3', l: 3 },
      { ...Test.data.pieceFull(), id: 'C4', l: 4 },
      { ...Test.data.pieceFull(), id: 'C5', l: 5 }
    ]), false)).body).to.be.eql([
      { id: 'C1', c: [2, 2] },
      { id: 'C2', c: [2, 2] },
      { id: 'C3', c: [2, 2] },
      { id: 'C4', c: [2, 2] },
      { id: 'C5', c: [2, 2] }
    ])

    expect(Test.mock(await Content.toggleColor(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C1', l: 1, c: [13, 2] },
      { ...Test.data.pieceFull(), id: 'C2', l: 1, c: [13, 2], a: '12345_78x' }, // #rrggbb -> no cycle
      { ...Test.data.pieceFull(), id: 'C3', l: 3, c: [13, 2], a: '12345_78y' }, // transparent -> no cycle
      { ...Test.data.pieceFull(), id: 'C4', l: 4, c: [13, 2] },
      { ...Test.data.pieceFull(), id: 'C5', l: 5, c: [13, 2], a: 'none' } // invalid asset -> no cycle
    ]), false)).body).to.be.eql([
      { id: 'C1', c: [0, 2] },
      { id: 'C4', c: [0, 2] }
    ])
  })

  it('toggleBorder()', async function () { // set room + asset
    State._private.setRoom(Test.data.room())

    expect(Test.mock(await Content.toggleBorder([], false))).to.be.eql({})

    expect(Test.mock(await Content.toggleBorder(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C1', l: 1 }, // tile
      { ...Test.data.pieceFull(), id: 'C2', l: 2 }, // sticker
      { ...Test.data.pieceFull(), id: 'C3', l: 3 }, // note
      { ...Test.data.pieceFull(), id: 'C4', l: 4 }, // token
      { ...Test.data.pieceFull(), id: 'C5', l: 5 } // other
    ]), false)).body).to.be.eql([
      { id: 'C4', c: [1, 3] }
    ])

    expect(Test.mock(await Content.toggleBorder(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C4', l: 4, c: [1, 0] }
    ]), false)).body).to.be.eql([
      { id: 'C4', c: [1, 1] }
    ])

    expect(Test.mock(await Content.toggleBorder(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C4', l: 4, c: [1, 1] }
    ]), false)).body).to.be.eql([
      { id: 'C4', c: [1, 2] }
    ])

    expect(Test.mock(await Content.toggleBorder(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C4', l: 4, c: [1, 13] }
    ]), false)).body).to.be.eql([
      { id: 'C4', c: [1, 0] }
    ])

    expect(Test.mock(await Content.toggleBorder(Content.populatePiecesDefaults([
      { ...Test.data.pieceFull(), id: 'C1', l: 4, c: [2, 13] },
      { ...Test.data.pieceFull(), id: 'C2', l: 4, c: [2, 13], a: 'MqEu1100' }, // #rrggbb
      { ...Test.data.pieceFull(), id: 'C3', l: 4, c: [2, 13], a: 'rjjxI200' }, // transparent
      { ...Test.data.pieceFull(), id: 'C4', l: 4, c: [2, 13] },
      { ...Test.data.pieceFull(), id: 'C5', l: 4, c: [2, 13], a: 'none' } // invalid asset -> no cycle
    ]), false)).body).to.be.eql([
      { id: 'C1', c: [2, 0] },
      { id: 'C2', c: [2, 0] },
      { id: 'C3', c: [2, 0] },
      { id: 'C4', c: [2, 0] }
    ])
  })
})

const pieceJSON = `
{
  "id": "fe008a4d",
  "l": 5,
  "a": "U0kg8300",
  "x": 256,
  "y": 192,
  "z": 13,
  "s": 4
}`

const tableJSON = `
[{
  "l": 1,
  "a": "c0655749",
  "w": 3,
  "h": 2,
  "x": 960,
  "y": 128,
  "z": 58,
  "id": "437e26b9"
}, {
  "id": "0e13b377",
  "l": 1,
  "a": "da30d95f",
  "x": 768,
  "y": 256,
  "z": 65,
  "r": 90
}, {
  "l": 1,
  "a": "89bd84cc",
  "x": 1344,
  "y": 192,
  "z": 56,
  "id": "9754d0c0",
  "r": 90
}, {
  "l": 4,
  "a": "b7662212",
  "x": 768,
  "y": 704,
  "z": 35,
  "w": 2,
  "h": 2,
  "id": "49d045e1"
}, {
  "l": 4,
  "a": "b7662212",
  "x": 960,
  "y": 640,
  "z": 34,
  "id": "b785cb50"
}]`

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
      "media": ["barbarian.1x1x1.svg", "barbarian.1x1x2.svg", "barbarian.1x1x3.svg"],
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "name": "barbarian",
      "type": "other",
      "id": "U0kg8300",
      "base": "barbarian.1x1x0.png"
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
