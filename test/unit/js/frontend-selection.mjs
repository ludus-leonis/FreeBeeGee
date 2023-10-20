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
  _test,
  setTableNo
} from '../../../src/js/state/index.mjs'

import {
  populatePiecesDefaults
} from '../../../src/js/view/room/tabletop/tabledata.mjs'

import {
  selectionGetIds,
  selectionAdd,
  isSelectedId,
  selectNode,
  selectionClear,
  selectionGetFeatures,
  selectionGetPieces,
  _private as testSelection
} from '../../../src/js/view/room/tabletop/selection.mjs'

const TEST_STATE = 5

/**
 * Initialize table+room data for tests.
 */
function setupTestData () {
  testSelection.selectionReset()
  _test.setRoom(JSON.parse(roomJSON))
  for (let i = 1; i <= 9; i++) {
    if (i === TEST_STATE) {
      _test.setTable(i, populatePiecesDefaults(JSON.parse(tableJSON)))
    } else if (i === 9) {
      _test.setTable(i, populatePiecesDefaults(JSON.parse(tableJSON)))
      setTableNo(9, false)
      selectionAdd('0e13b377')
    } else {
      _test.setTable(i, [])
    }
  }
  setTableNo(1, false)
}

describe('Frontend - selectionGetIds.mjs', function () {
  beforeEach(function () {
    setupTestData()
  })

  it('selectionGetIds()', function () {
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
    setTableNo(TEST_STATE, false)
    selectionAdd('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['49d045e1'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
  })

  it('selectionAdd()', function () {
    setTableNo(TEST_STATE - 1, false)
    selectionAdd('49d045e1')
    selectionAdd('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql([])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    setTableNo(TEST_STATE, false)
    selectionAdd('49d045e1')
    selectionAdd('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['49d045e1'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    setTableNo(TEST_STATE + 1, false)
    selectionAdd('49d045e1')
    selectionAdd('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['49d045e1'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
  })

  it('selectionRemove()', function () {
    setTableNo(TEST_STATE, false)
    selectionAdd('49d045e1')
    selectionAdd('437e26b9')

    setTableNo(TEST_STATE - 1, false)
    testSelection.selectionRemove('49d045e1')
    testSelection.selectionRemove('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['49d045e1', '437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    setTableNo(TEST_STATE, false)
    testSelection.selectionRemove('49d045e1')
    testSelection.selectionRemove('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    setTableNo(TEST_STATE + 1, false)
    testSelection.selectionRemove('49d045e1')
    testSelection.selectionRemove('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
  })

  it('isSelectedId()', function () {
    setTableNo(TEST_STATE, false)
    selectionAdd('437e26b9')

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(isSelectedId('49d045e1')).to.be.eql(false)
        expect(isSelectedId('437e26b9')).to.be.eql(true)
      } else if (i === 9) {
        expect(isSelectedId('0e13b377')).to.be.eql(true)
      } else {
        expect(isSelectedId('49d045e1')).to.be.eql(false)
        expect(isSelectedId('437e26b9')).to.be.eql(false)
      }
    }
  })

  it('selectionClear()', function () {
    setTableNo(TEST_STATE, false)
    selectionAdd('437e26b9')

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // clear empty table = no change
    setTableNo(TEST_STATE - 1, false)
    selectionClear()
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // clear full table = change
    setTableNo(TEST_STATE, false)
    selectionClear()
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql([])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
  })

  it('selectNode(..., true)', function () { // toggle mode
    setTableNo(TEST_STATE, false)
    selectionAdd('437e26b9')

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on tabletop = no change
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: 'tabletop' }), true)
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on no-piece = no change
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '437e26b9' }), true)
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on non-existing piece = no change
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '12345678', piece: { id: '12345678' } }), true)
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on existing piece = toggle
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '49d045e1', piece: { id: '49d045e1' } }), true)
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9', '49d045e1'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on existing piece = toggle
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '49d045e1', piece: { id: '49d045e1' } }), true)
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
  })

  it('selectNode(..., false)', function () { // no-toggle mode
    setTableNo(TEST_STATE, false)
    selectionAdd('437e26b9')

    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on nothing = deselect all
    setTableNo(TEST_STATE, false)
    selectNode(null)
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql([])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on piece = single select
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '49d045e1', piece: { id: '49d045e1' } }))
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['49d045e1'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on sampe piece = still single select
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '49d045e1', piece: { id: '49d045e1' } }))
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['49d045e1'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on other piece = single select
    setTableNo(TEST_STATE, false)
    selectNode(node({ id: '437e26b9', piece: { id: '437e26b9' } }))
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on unkown id = no change
    setTableNo(TEST_STATE, false)
    selectNode({ id: 'unknown' })
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql(['437e26b9'])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }

    // toggle mode: click on tabletop id = deselect
    setTableNo(TEST_STATE, false)
    selectNode({ id: 'tabletop' })
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetIds()).to.be.eql([])
      } else if (i === 9) {
        expect(selectionGetIds()).to.be.eql(['0e13b377'])
      } else {
        expect(selectionGetIds()).to.be.eql([])
      }
    }
  })

  it('selectionGetPieces()', function () {
    setTableNo(TEST_STATE, false)
    selectionAdd('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        expect(selectionGetPieces().length).to.be.eql(1)
        expect(selectionGetPieces()[0].id).to.be.eql('49d045e1')
        expect(selectionGetPieces('all').length).to.be.eql(1)
        expect(selectionGetPieces('all')[0].id).to.be.eql('49d045e1')
        expect(selectionGetPieces('token').length).to.be.eql(1)
        expect(selectionGetPieces('token')[0].id).to.be.eql('49d045e1')
        expect(selectionGetPieces('tile').length).to.be.eql(0)
      } else if (i === 9) {
        expect(selectionGetPieces().length).to.be.eql(1)
        expect(selectionGetPieces()[0].id).to.be.eql('0e13b377')
      } else {
        expect(selectionGetPieces().length).to.be.eql(0)
      }
    }
  })

  it('selectionGetFeatures()', function () {
    // select a single token
    setTableNo(TEST_STATE, false)
    selectionAdd('49d045e1')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        const features = selectionGetFeatures()
        expect(features.edit).to.be.eql(true)
        expect(features.rotate).to.be.eql(true)
        expect(features.flip).to.be.eql(false)
        expect(features.random).to.be.eql(false)
        expect(features.top).to.be.eql(true)
        expect(features.bottom).to.be.eql(true)
        expect(features.clone).to.be.eql(true)
        expect(features.delete).to.be.eql(true)
        expect(features.color).to.be.eql(false)
        expect(features.border).to.be.eql(false)
        expect(features.number).to.be.eql(true)
        expect(features.boundingBox.top).to.be.eql(640)
        expect(features.boundingBox.left).to.be.eql(704)
        expect(features.boundingBox.bottom).to.be.eql(767)
        expect(features.boundingBox.right).to.be.eql(831)
        expect(features.boundingBox.center.x).to.be.eql(768)
        expect(features.boundingBox.center.y).to.be.eql(704)
        expect(features.boundingBox.w).to.be.eql(128)
        expect(features.boundingBox.h).to.be.eql(128)
      } else if (i === 9) {
        // ignore for test
      } else {
        const features = selectionGetFeatures()
        expect(features.edit).to.be.eql(false)
        expect(features.rotate).to.be.eql(false)
        expect(features.flip).to.be.eql(false)
        expect(features.random).to.be.eql(false)
        expect(features.top).to.be.eql(false)
        expect(features.bottom).to.be.eql(false)
        expect(features.clone).to.be.eql(false)
        expect(features.delete).to.be.eql(false)
        expect(features.color).to.be.eql(false)
        expect(features.border).to.be.eql(false)
        expect(features.number).to.be.eql(false)
        expect(features.boundingBox).to.be.eql({})
      }
    }

    // select a single tile
    setTableNo(TEST_STATE, false)
    testSelection.selectionRemove('49d045e1')
    selectionAdd('437e26b9')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        const features = selectionGetFeatures()
        expect(features.edit).to.be.eql(true)
        expect(features.rotate).to.be.eql(true)
        expect(features.flip).to.be.eql(false)
        expect(features.random).to.be.eql(false)
        expect(features.top).to.be.eql(true)
        expect(features.bottom).to.be.eql(true)
        expect(features.clone).to.be.eql(true)
        expect(features.delete).to.be.eql(true)
        expect(features.color).to.be.eql(false)
        expect(features.border).to.be.eql(false)
        expect(features.number).to.be.eql(false)
        expect(features.boundingBox.top).to.be.eql(64)
        expect(features.boundingBox.left).to.be.eql(864)
        expect(features.boundingBox.bottom).to.be.eql(191)
        expect(features.boundingBox.right).to.be.eql(1055)
        expect(features.boundingBox.center.x).to.be.eql(960)
        expect(features.boundingBox.center.y).to.be.eql(128)
        expect(features.boundingBox.w).to.be.eql(192)
        expect(features.boundingBox.h).to.be.eql(128)
      } else if (i === 9) {
        // ignore for test
      } else {
        const features = selectionGetFeatures()
        expect(features.edit).to.be.eql(false)
        expect(features.rotate).to.be.eql(false)
        expect(features.flip).to.be.eql(false)
        expect(features.random).to.be.eql(false)
        expect(features.top).to.be.eql(false)
        expect(features.bottom).to.be.eql(false)
        expect(features.clone).to.be.eql(false)
        expect(features.delete).to.be.eql(false)
        expect(features.color).to.be.eql(false)
        expect(features.border).to.be.eql(false)
        expect(features.number).to.be.eql(false)
        expect(features.boundingBox).to.be.eql({})
      }
    }

    // select a tile+token
    setTableNo(TEST_STATE, false)
    selectionAdd('49d045e1')
    selectionAdd('437e26b9')
    for (let i = 1; i <= 9; i++) {
      setTableNo(i, false)
      if (i === TEST_STATE) {
        const features = selectionGetFeatures()
        expect(features.edit).to.be.eql(false)
        expect(features.rotate).to.be.eql(true)
        expect(features.flip).to.be.eql(false)
        expect(features.random).to.be.eql(false)
        expect(features.top).to.be.eql(true)
        expect(features.bottom).to.be.eql(true)
        expect(features.clone).to.be.eql(true)
        expect(features.delete).to.be.eql(true)
        expect(features.color).to.be.eql(false)
        expect(features.border).to.be.eql(false)
        expect(features.number).to.be.eql(false)
        expect(features.boundingBox.top).to.be.eql(64)
        expect(features.boundingBox.left).to.be.eql(704)
        expect(features.boundingBox.bottom).to.be.eql(767)
        expect(features.boundingBox.right).to.be.eql(1055)
        expect(features.boundingBox.center.x).to.be.eql(880)
        expect(features.boundingBox.center.y).to.be.eql(416)
        expect(features.boundingBox.w).to.be.eql(352)
        expect(features.boundingBox.h).to.be.eql(704)
      } else if (i === 9) {
        // ignore for test
      } else {
        const features = selectionGetFeatures()
        expect(features.edit).to.be.eql(false)
        expect(features.rotate).to.be.eql(false)
        expect(features.flip).to.be.eql(false)
        expect(features.random).to.be.eql(false)
        expect(features.top).to.be.eql(false)
        expect(features.bottom).to.be.eql(false)
        expect(features.clone).to.be.eql(false)
        expect(features.delete).to.be.eql(false)
        expect(features.color).to.be.eql(false)
        expect(features.border).to.be.eql(false)
        expect(features.number).to.be.eql(false)
        expect(features.boundingBox).to.be.eql({})
      }
    }
  })

  it('findPiecesWithinBounds()', function () {
    // select a single token
    setTableNo(TEST_STATE, false)
    selectionAdd('9754d0c0') // 1x1 token

    // we find ourself if selection is in our space
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox)[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344, y: 192 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344, y: 192 })[0].id).to.be.eql('9754d0c0')

    // we still find ourself if selection is overlapping 1px
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 63, y: 192 - 63 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 63, y: 192 - 63 })[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 63, y: 192 + 63 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 63, y: 192 + 63 })[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 63, y: 192 + 63 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 63, y: 192 + 63 })[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 63, y: 192 - 63 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 63, y: 192 - 63 })[0].id).to.be.eql('9754d0c0')

    // we don't find ourself if selection is not overlapping ...
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 64, y: 192 - 64 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 64, y: 192 + 64 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 64, y: 192 + 64 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 64, y: 192 - 64 }).length).to.be.eql(0)

    // ... but we find ourself if selection is using padding
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 64, y: 192 - 64 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 64, y: 192 - 64 }, true)[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 64, y: 192 + 64 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 - 64, y: 192 + 64 }, true)[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 64, y: 192 + 64 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 64, y: 192 + 64 }, true)[0].id).to.be.eql('9754d0c0')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 64, y: 192 - 64 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 1344 + 64, y: 192 - 64 }, true)[0].id).to.be.eql('9754d0c0')

    // we find only a tile, if over there
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960, y: 128 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960, y: 128 })[0].id).to.be.eql('437e26b9')

    // we still find the tile when overlapping 1px
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 - 96 - 32 + 1, y: 128 - 64 - 32 + 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 - 96 - 32 + 1, y: 128 - 64 - 32 + 1 })[0].id).to.be.eql('437e26b9')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 - 96 - 32 + 1, y: 128 + 64 + 32 - 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 - 96 - 32 + 1, y: 128 + 64 + 32 - 1 })[0].id).to.be.eql('437e26b9')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 + 96 + 32 - 1, y: 128 + 64 + 32 - 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 + 96 + 32 - 1, y: 128 + 64 + 32 - 1 })[0].id).to.be.eql('437e26b9')
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 + 96 + 32 - 1, y: 128 - 64 - 32 + 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 + 96 + 32 - 1, y: 128 - 64 - 32 + 1 })[0].id).to.be.eql('437e26b9')

    // we dont find the tile when barely not overlapping
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 - 96 - 32, y: 128 - 64 - 32 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 - 96 - 32, y: 128 + 64 + 32 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 + 96 + 32, y: 128 + 64 + 32 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 960 + 96 + 32, y: 128 - 64 - 32 }).length).to.be.eql(0)
  })

  it('findPiecesWithinBounds(x, y, true)', function () { // use rotated pieces here
    // select a single token
    _test.setTable(8, populatePiecesDefaults(JSON.parse(`[
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
    ]`)))
    setTableNo(8, false)
    selectionAdd('00000002')

    // corner touching
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }).length).to.be.eql(0)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }).length).to.be.eql(0)

    // corner touching but padding
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 }, true).length).to.be.eql(1)

    // corner overlapping
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }).length).to.be.eql(1)

    // corner overlapping and padding
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 - 2 * 64 / 2 - 2 * 64 / 2 + 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 + 1 * 64 / 2 + 3 * 64 / 2 - 1 }, true).length).to.be.eql(1)
    expect(testSelection.findPiecesWithinBounds(selectionGetFeatures().boundingBox, { x: 2048 + 2 * 64 / 2 + 2 * 64 / 2 - 1, y: 1024 - 1 * 64 / 2 - 3 * 64 / 2 + 1 }, true).length).to.be.eql(1)
  })
})

/**
 * Create a partial HTMLElement/node good enough for tests.
 *
 * @param {object} obj Fake node object.
 * @returns {object} Improved obj for chaining.
 */
function node (obj) { //
  if (!obj.classList) obj.classList = []
  obj.classList.contains = function (item) { return this.includes(item) }
  return obj
}

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
