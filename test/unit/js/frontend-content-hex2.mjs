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
import Selection from '../../../src/js/view/room/tabletop/selection.mjs'

const pieceJSON = `
{
  "id": "fe008a4d",
  "l": 4,
  "a": "U0kg8300",
  "w": 4,
  "h": 2,
  "x": 512,
  "y": 256
}`

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

describe('Frontend - content.mjs (hex2)', function () {
  beforeEach(function () {
    Test.setupTestData([{ ...JSON.parse(pieceJSON), r: 60 }], Test.data.roomHex2())
  })

  it('snap()', function () { // hint - more in-depth snapping tests in util-test
    expect(Content.snap(-1, 31).x).to.be.eql(0)
    expect(Content.snap(-1, 31).y).to.be.eql(37)
  })

  it('moveTiles() hex2', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: '7', x: 32, y: 55 },
      { ...Test.data.pieceMinimal(), id: '8', x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_MOVE },
      { ...Test.data.pieceMinimal(), id: '9', x: 128, y: 110 }
    ]
    Test.setupTestData(pieces, Test.data.roomHex2())

    expect(Test.mock(await Content.moveTiles([pieces[1]], 1, 1, false))).to.be.eql({})

    const move1 = Test.mock(await Content.moveTiles([pieces[0]], 0, 1, false)).body
    expect(move1.length).to.be.eql(1)
    expect(move1[0].id).to.be.eql('7')
    expect(move1[0].x).to.be.eql(32 + 32)
    expect(move1[0].y).to.be.eql(55 + 55)

    const move2 = Test.mock(await Content.moveTiles([pieces[0]], 1, 0, false)).body
    expect(move2.length).to.be.eql(1)
    expect(move2[0].id).to.be.eql('7')
    expect(move2[0].x).to.be.eql(32 + 64)
    expect(move2[0].y).to.be.eql(55)

    const move3 = Test.mock(await Content.moveTiles([pieces[2]], 0, 1, false)).body
    expect(move3.length).to.be.eql(1)
    expect(move3[0].id).to.be.eql('9')
    expect(move3[0].x).to.be.eql(128 - 32)
    expect(move3[0].y).to.be.eql(110 + 55)
    const move4 = Test.mock(await Content.moveTiles([pieces[2]], -1, 0, false)).body
    expect(move4.length).to.be.eql(1)
    expect(move4[0].id).to.be.eql('9')
    expect(move4[0].x).to.be.eql(128 - 64)
    expect(move4[0].y).to.be.eql(110)

    const move5 = Test.mock(await Content.moveTiles(pieces, 0, 1, false)).body
    expect(move5.length).to.be.eql(2)
    expect(move5[0].id).to.be.eql('9')
    expect(move5[0].x).to.be.eql(128 + 32)
    expect(move5[0].y).to.be.eql(110 + 55)
    expect(move5[1].id).to.be.eql('7')
    expect(move5[1].x).to.be.eql(32 + 32)
    expect(move5[1].y).to.be.eql(55 + 55)
    const move6 = Test.mock(await Content.moveTiles(pieces, 1, 0, false)).body
    expect(move6.length).to.be.eql(2)
    expect(move6[0].id).to.be.eql('9')
    expect(move6[0].x).to.be.eql(128 + 64)
    expect(move6[0].y).to.be.eql(110)
    expect(move6[1].id).to.be.eql('7')
    expect(move6[1].x).to.be.eql(32 + 64)
    expect(move6[1].y).to.be.eql(55)
  })

  it('populatePieceDefaults()', function () {
    const p0 = Content.populatePieceDefaults(JSON.parse(pieceJSON), headers())
    expect(p0.w).to.be.eql(4)
    expect(p0.h).to.be.eql(2)
    expect(p0.r).to.be.eql(0)
    expect(p0._meta.originWidthPx).to.be.eql(256)
    expect(p0._meta.originHeightPx).to.be.eql(128)
    expect(p0._meta.widthPx).to.be.eql(256)
    expect(p0._meta.heightPx).to.be.eql(128)
    expect(p0._meta.originOffsetXPx).to.be.eql(0)
    expect(p0._meta.originOffsetYPx).to.be.eql(0)

    const p60 = Content.populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 60 }, headers())
    expect(p60.w).to.be.eql(4)
    expect(p60.h).to.be.eql(2)
    expect(p60.r).to.be.eql(60)
    expect(p60._meta.originWidthPx).to.be.eql(256)
    expect(p60._meta.originHeightPx).to.be.eql(128)
    expect(p60._meta.widthPx).to.be.eql(239)
    expect(p60._meta.heightPx).to.be.eql(286)
    expect(p60._meta.originOffsetXPx).to.be.eql(9)
    expect(p60._meta.originOffsetYPx).to.be.eql(-79)

    const p120 = Content.populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 120 }, headers())
    expect(p120.w).to.be.eql(4)
    expect(p120.h).to.be.eql(2)
    expect(p120.r).to.be.eql(120)
    expect(p120._meta.originWidthPx).to.be.eql(256)
    expect(p120._meta.originHeightPx).to.be.eql(128)
    expect(p120._meta.widthPx).to.be.eql(239)
    expect(p120._meta.heightPx).to.be.eql(286)
    expect(p120._meta.originOffsetXPx).to.be.eql(9)
    expect(p120._meta.originOffsetYPx).to.be.eql(-79)

    const p180 = Content.populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 180 }, headers())
    expect(p180.w).to.be.eql(4)
    expect(p180.h).to.be.eql(2)
    expect(p180.r).to.be.eql(180)
    expect(p180._meta.originWidthPx).to.be.eql(256)
    expect(p180._meta.originHeightPx).to.be.eql(128)
    expect(p180._meta.widthPx).to.be.eql(256)
    expect(p180._meta.heightPx).to.be.eql(128)
    expect(p180._meta.originOffsetXPx).to.be.eql(0)
    expect(p180._meta.originOffsetYPx).to.be.eql(0)

    const p240 = Content.populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 240 }, headers())
    expect(p240.w).to.be.eql(4)
    expect(p240.h).to.be.eql(2)
    expect(p240.r).to.be.eql(240)
    expect(p240._meta.originWidthPx).to.be.eql(256)
    expect(p240._meta.originHeightPx).to.be.eql(128)
    expect(p240._meta.widthPx).to.be.eql(239)
    expect(p240._meta.heightPx).to.be.eql(286)
    expect(p240._meta.originOffsetXPx).to.be.eql(9)
    expect(p240._meta.originOffsetYPx).to.be.eql(-79)

    const p300 = Content.populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 300 }, headers())
    expect(p300.w).to.be.eql(4)
    expect(p300.h).to.be.eql(2)
    expect(p300.r).to.be.eql(300)
    expect(p300._meta.originWidthPx).to.be.eql(256)
    expect(p300._meta.originHeightPx).to.be.eql(128)
    expect(p300._meta.widthPx).to.be.eql(239)
    expect(p300._meta.heightPx).to.be.eql(286)
    expect(p300._meta.originOffsetXPx).to.be.eql(9)
    expect(p300._meta.originOffsetYPx).to.be.eql(-79)
  })

  it('Selection.getFeatures()', function () {
    Selection.select('fe008a4d') // barbarian

    const features = Selection.getFeatures()
    expect(features.edit).to.be.eql(true)
    expect(features.rotate).to.be.eql(true)
    expect(features.flip).to.be.eql(true)
    expect(features.random).to.be.eql(false)
    expect(features.top).to.be.eql(true)
    expect(features.bottom).to.be.eql(true)
    expect(features.clone).to.be.eql(true)
    expect(features.delete).to.be.eql(true)
    expect(features.color).to.be.eql(true)
    expect(features.border).to.be.eql(true)
    expect(features.number).to.be.eql(true)
    expect(features.boundingBox.top).to.be.eql(113)
    expect(features.boundingBox.left).to.be.eql(393)
    expect(features.boundingBox.bottom).to.be.eql(398)
    expect(features.boundingBox.right).to.be.eql(631)
    expect(features.boundingBox.center.x).to.be.eql(512)
    expect(features.boundingBox.center.y).to.be.eql(256)
    expect(features.boundingBox.w).to.be.eql(239)
    expect(features.boundingBox.h).to.be.eql(286)
  })
})
