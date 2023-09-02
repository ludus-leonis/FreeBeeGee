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
  _setTable,
  _setRoom,
  setTableNo
} from '../../../src/js/state/index.mjs'

import {
  populatePieceDefaults,
  populatePiecesDefaults,
  snap
} from '../../../src/js/view/room/tabletop/tabledata.mjs'

import {
  selectionAdd,
  selectionGetFeatures
} from '../../../src/js/view/room/tabletop/selection.mjs'

const TEST_STATE = 5

function setupTestData () {
  _setRoom(JSON.parse(roomJSON))
  for (let i = 1; i <= 9; i++) {
    if (i === TEST_STATE) {
      _setTable(i, populatePiecesDefaults([{ ...JSON.parse(pieceJSON), r: 60 }]))
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

  it('snap()', function () { // hint - more in-depth snapping tests in utils-test
    expect(snap(31, -1).x).to.be.eql(37)
    expect(snap(31, -1).y).to.be.eql(0)
  })

  it('populatePieceDefaults()', function () {
    const p0 = populatePieceDefaults(JSON.parse(pieceJSON), headers())
    expect(p0.w).to.be.eql(4)
    expect(p0.h).to.be.eql(2)
    expect(p0.r).to.be.eql(0)
    expect(p0._meta.originWidthPx).to.be.eql(256)
    expect(p0._meta.originHeightPx).to.be.eql(128)
    expect(p0._meta.widthPx).to.be.eql(256)
    expect(p0._meta.heightPx).to.be.eql(128)
    expect(p0._meta.originOffsetXPx).to.be.eql(0)
    expect(p0._meta.originOffsetYPx).to.be.eql(0)

    const p60 = populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 60 }, headers())
    expect(p60.w).to.be.eql(4)
    expect(p60.h).to.be.eql(2)
    expect(p60.r).to.be.eql(60)
    expect(p60._meta.originWidthPx).to.be.eql(256)
    expect(p60._meta.originHeightPx).to.be.eql(128)
    expect(p60._meta.widthPx).to.be.eql(239)
    expect(p60._meta.heightPx).to.be.eql(286)
    expect(p60._meta.originOffsetXPx).to.be.eql(9)
    expect(p60._meta.originOffsetYPx).to.be.eql(-79)

    const p120 = populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 120 }, headers())
    expect(p120.w).to.be.eql(4)
    expect(p120.h).to.be.eql(2)
    expect(p120.r).to.be.eql(120)
    expect(p120._meta.originWidthPx).to.be.eql(256)
    expect(p120._meta.originHeightPx).to.be.eql(128)
    expect(p120._meta.widthPx).to.be.eql(239)
    expect(p120._meta.heightPx).to.be.eql(286)
    expect(p120._meta.originOffsetXPx).to.be.eql(9)
    expect(p120._meta.originOffsetYPx).to.be.eql(-79)

    const p180 = populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 180 }, headers())
    expect(p180.w).to.be.eql(4)
    expect(p180.h).to.be.eql(2)
    expect(p180.r).to.be.eql(180)
    expect(p180._meta.originWidthPx).to.be.eql(256)
    expect(p180._meta.originHeightPx).to.be.eql(128)
    expect(p180._meta.widthPx).to.be.eql(256)
    expect(p180._meta.heightPx).to.be.eql(128)
    expect(p180._meta.originOffsetXPx).to.be.eql(0)
    expect(p180._meta.originOffsetYPx).to.be.eql(0)

    const p240 = populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 240 }, headers())
    expect(p240.w).to.be.eql(4)
    expect(p240.h).to.be.eql(2)
    expect(p240.r).to.be.eql(240)
    expect(p240._meta.originWidthPx).to.be.eql(256)
    expect(p240._meta.originHeightPx).to.be.eql(128)
    expect(p240._meta.widthPx).to.be.eql(239)
    expect(p240._meta.heightPx).to.be.eql(286)
    expect(p240._meta.originOffsetXPx).to.be.eql(9)
    expect(p240._meta.originOffsetYPx).to.be.eql(-79)

    const p300 = populatePieceDefaults({ ...JSON.parse(pieceJSON), r: 300 }, headers())
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

  it('selectionGetFeatures()', function () {
    // select a single token
    setTableNo(TEST_STATE, false)
    selectionAdd('fe008a4d')

    const features = selectionGetFeatures()
    expect(features.edit).to.be.eql(true)
    expect(features.rotate).to.be.eql(true)
    expect(features.flip).to.be.eql(true)
    expect(features.random).to.be.eql(true)
    expect(features.top).to.be.eql(true)
    expect(features.bottom).to.be.eql(true)
    expect(features.clone).to.be.eql(true)
    expect(features.delete).to.be.eql(true)
    expect(features.color).to.be.eql(false)
    expect(features.border).to.be.eql(false)
    expect(features.number).to.be.eql(false)
    expect(features.boundingBox.top).to.be.eql(113)
    expect(features.boundingBox.left).to.be.eql(393)
    expect(features.boundingBox.bottom).to.be.eql(398)
    expect(features.boundingBox.right).to.be.eql(631)
    expect(features.boundingBox.x).to.be.eql(512)
    expect(features.boundingBox.y).to.be.eql(256)
    expect(features.boundingBox.w).to.be.eql(239)
    expect(features.boundingBox.h).to.be.eql(286)
  })
})

const pieceJSON = `
{
  "id": "fe008a4d",
  "l": 1,
  "a": "f45f27b5",
  "w": 4,
  "h": 2,
  "x": 512,
  "y": 256
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
    "overlay": [{
      "media": ["area.1x1.1x1x1.svg", "##BACK##"],
      "w": 1,
      "h": 1,
      "bg": "#808080",
      "name": "area.1x1",
      "type": "overlay",
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
    "type": "grid-hex",
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
