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
import * as Selection from 'src/js/view/room/tabletop/selection.mjs'
import * as State from 'src/js/state/index.mjs'

import * as Test from 'test/integration/utils/test.mjs'
const expect = Test.expect

describe('Frontend - selection.mjs', function () {
  beforeEach(function () {
    Test.setupTestData()
    State.setTableNo(9, false)
    expect(Selection.select('Ta3RTTni9')).to.be.eql(true)
    State.setTableNo(Test.TEST_STATE, false)
  })

  it('getIds()', function () {
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
    State.setTableNo(Test.TEST_STATE, false)
    expect(Selection.select('Ta3RTTni')).to.be.eql(true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
  })

  it('select()', function () {
    State.setTableNo(Test.TEST_STATE - 1, false)
    expect(Selection.select('Ta3RTTni4')).to.be.eql(true)
    expect(Selection.select('Ta3RTTni4')).to.be.eql(false)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql([])
      } else if (i === Test.TEST_STATE - 1) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni4'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    State.setTableNo(Test.TEST_STATE, false)
    expect(Selection.select('Ta3RTTni')).to.be.eql(true)
    expect(Selection.select('Ta3RTTni')).to.be.eql(false)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni'])
      } else if (i === Test.TEST_STATE - 1) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni4'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    State.setTableNo(Test.TEST_STATE + 1, false)
    expect(Selection.select('Ta3RTTni6')).to.be.eql(true)
    expect(Selection.select('Ta3RTTni6')).to.be.eql(false)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni'])
      } else if (i === Test.TEST_STATE - 1) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni4'])
      } else if (i === Test.TEST_STATE + 1) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni6'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
  })

  it('unselect()', function () {
    expect(Selection.select('Ta3RTTni')).to.be.eql(true)
    expect(Selection.select('mDn9tNzX')).to.be.eql(true)

    State.setTableNo(Test.TEST_STATE - 1, false)
    expect(Selection.select('Ta3RTTni4')).to.be.eql(true)
    expect(Selection.unselect('Ta3RTTni4')).to.be.eql(true)
    expect(Selection.unselect('Ta3RTTni4')).to.be.eql(false)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni', 'mDn9tNzX']) // <-------
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    State.setTableNo(Test.TEST_STATE, false)
    expect(Selection.unselect('Ta3RTTni')).to.be.eql(true)
    expect(Selection.unselect('Ta3RTTni')).to.be.eql(false)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    State.setTableNo(Test.TEST_STATE + 1, false)
    expect(Selection.select('Ta3RTTni6')).to.be.eql(true)
    expect(Selection.unselect('Ta3RTTni6')).to.be.eql(true)
    expect(Selection.unselect('Ta3RTTni6')).to.be.eql(false)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
  })

  it('isSelectedId()', function () {
    expect(Selection.select('mDn9tNzX')).to.be.eql(true)

    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.isSelectedId('Ta3RTTni')).to.be.eql(false)
        expect(Selection.isSelectedId('mDn9tNzX')).to.be.eql(true)
      } else if (i === 9) {
        expect(Selection.isSelectedId('Ta3RTTni9')).to.be.eql(true)
      } else {
        expect(Selection.isSelectedId('Ta3RTTni')).to.be.eql(false)
        expect(Selection.isSelectedId('mDn9tNzX')).to.be.eql(false)
      }
    }
  })

  it('clear()', function () {
    expect(Selection.select('mDn9tNzX')).to.be.eql(true)

    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // clear other table = no change
    State.setTableNo(Test.TEST_STATE - 1, false)
    Selection.clear()
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // clear main table = change
    State.setTableNo(Test.TEST_STATE, false)
    Selection.clear()
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql([])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
  })

  it('selectNode(..., true)', function () { // toggle mode
    expect(Selection.select('mDn9tNzX')).to.be.eql(true)

    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on tabletop = no change
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'tabletop' }), true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on no-piece = no change
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'mDn9tNzX' }), true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on non-existing piece = no change
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: '12345678', piece: { id: '12345678' } }), true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on existing piece = toggle
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'Ta3RTTni', piece: { id: 'Ta3RTTni' } }), true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX', 'Ta3RTTni'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on existing piece = toggle
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'Ta3RTTni', piece: { id: 'Ta3RTTni' } }), true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX']) // << ----
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
  })

  it('selectNode(..., false)', function () { // no-toggle mode
    expect(Selection.select('mDn9tNzX')).to.be.eql(true)

    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on nothing = deselect all
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(null)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql([])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on piece = single select
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'Ta3RTTni', piece: { id: 'Ta3RTTni' } }))
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on sampe piece = still single select
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'Ta3RTTni', piece: { id: 'Ta3RTTni' } }))
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on other piece = single select
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode(node({ id: 'mDn9tNzX', piece: { id: 'mDn9tNzX' } }))
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on unkown id = no change
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode({ id: 'unknown' })
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql(['mDn9tNzX'])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }

    // toggle mode: click on tabletop id = deselect
    State.setTableNo(Test.TEST_STATE, false)
    Selection.selectNode({ id: 'tabletop' })
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getIds()).to.be.eql([])
      } else if (i === 9) {
        expect(Selection.getIds()).to.be.eql(['Ta3RTTni9'])
      } else {
        expect(Selection.getIds()).to.be.eql([])
      }
    }
  })

  it('getPieces()', function () {
    expect(Selection.select('Ta3RTTni')).to.be.eql(true)

    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        expect(Selection.getPieces().length).to.be.eql(1)
        expect(Selection.getPieces()[0].id).to.be.eql('Ta3RTTni')
        expect(Selection.getPieces('all').length).to.be.eql(1)
        expect(Selection.getPieces('all')[0].id).to.be.eql('Ta3RTTni')
        expect(Selection.getPieces('token').length).to.be.eql(1)
        expect(Selection.getPieces('token')[0].id).to.be.eql('Ta3RTTni')
        expect(Selection.getPieces('tile').length).to.be.eql(0)
      } else if (i === 9) {
        expect(Selection.getPieces().length).to.be.eql(1)
        expect(Selection.getPieces()[0].id).to.be.eql('Ta3RTTni9')
      } else {
        expect(Selection.getPieces().length).to.be.eql(0)
      }
    }
  })

  it('getFeatures()', function () {
    const emptyBoudingBox = {
      bottom: 0,
      center: {
        x: 0,
        y: 0
      },
      h: 1,
      left: 0,
      right: 0,
      top: 0,
      w: 1
    }

    // select a single token
    State.setTableNo(Test.TEST_STATE, false)
    expect(Selection.select('Ta3RTTni')).to.be.eql(true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) { // babarian token
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
        expect(features.boundingBox.top).to.be.eql(2080)
        expect(features.boundingBox.left).to.be.eql(1824)
        expect(features.boundingBox.bottom).to.be.eql(2143)
        expect(features.boundingBox.right).to.be.eql(1887)
        expect(features.boundingBox.center.x).to.be.eql(1856)
        expect(features.boundingBox.center.y).to.be.eql(2112)
        expect(features.boundingBox.w).to.be.eql(64)
        expect(features.boundingBox.h).to.be.eql(64)
      } else if (i === 9) { // rotated number token
        const features = Selection.getFeatures()
        expect(features.edit).to.be.eql(true)
        expect(features.rotate).to.be.eql(true)
        expect(features.flip).to.be.eql(true)
        expect(features.random).to.be.eql(true)
        expect(features.top).to.be.eql(true)
        expect(features.bottom).to.be.eql(true)
        expect(features.clone).to.be.eql(true)
        expect(features.delete).to.be.eql(true)
        expect(features.color).to.be.eql(true)
        expect(features.border).to.be.eql(true)
        expect(features.number).to.be.eql(true)
        expect(features.boundingBox.top).to.be.eql(-81)
        expect(features.boundingBox.left).to.be.eql(-104)
        expect(features.boundingBox.bottom).to.be.eql(125)
        expect(features.boundingBox.right).to.be.eql(126)
        expect(features.boundingBox.center.x).to.be.eql(11)
        expect(features.boundingBox.center.y).to.be.eql(22)
        expect(features.boundingBox.w).to.be.eql(231)
        expect(features.boundingBox.h).to.be.eql(207)
      } else {
        const features = Selection.getFeatures()
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
        expect(features.boundingBox).to.be.eql(emptyBoudingBox)
      }
    }

    // select a single tile
    State.setTableNo(Test.TEST_STATE, false)
    expect(Selection.unselect('Ta3RTTni')).to.be.eql(true)
    expect(Selection.select('cyKCrugB')).to.be.eql(true)
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        const features = Selection.getFeatures()
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
        expect(features.boundingBox.top).to.be.eql(2048)
        expect(features.boundingBox.left).to.be.eql(2304)
        expect(features.boundingBox.bottom).to.be.eql(2175)
        expect(features.boundingBox.right).to.be.eql(2431)
        expect(features.boundingBox.center.x).to.be.eql(2368)
        expect(features.boundingBox.center.y).to.be.eql(2112)
        expect(features.boundingBox.w).to.be.eql(128)
        expect(features.boundingBox.h).to.be.eql(128)
      } else if (i === 9) {
        // ignore for test
      } else {
        const features = Selection.getFeatures()
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
        expect(features.boundingBox).to.be.eql(emptyBoudingBox)
      }
    }

    // select a tile+token
    State.setTableNo(Test.TEST_STATE, false)
    Selection.select('Ta3RTTni')
    Selection.select('mDn9tNzX')
    for (let i = 1; i <= 9; i++) {
      State.setTableNo(i, false)
      if (i === Test.TEST_STATE) {
        const features = Selection.getFeatures()
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
        expect(features.boundingBox.top).to.be.eql(2048)
        expect(features.boundingBox.left).to.be.eql(1824)
        expect(features.boundingBox.bottom).to.be.eql(2431)
        expect(features.boundingBox.right).to.be.eql(2431)
        expect(features.boundingBox.center.x).to.be.eql(2128)
        expect(features.boundingBox.center.y).to.be.eql(2240)
        expect(features.boundingBox.w).to.be.eql(608)
        expect(features.boundingBox.h).to.be.eql(384)
      } else if (i === 9) {
        // ignore for test
      } else {
        const features = Selection.getFeatures()
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
        expect(features.boundingBox).to.be.eql(emptyBoudingBox)
      }
    }
  })

  it('clone()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'P1', x: 64, y: 64 },
      { ...Test.data.pieceFull(), id: 'P2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_DELETE },
      { ...Test.data.pieceFull(), id: 'P3', x: 256, y: 128 },
      { ...Test.data.pieceFull(), id: 'P4', x: 1256, y: 1128 }
    ]
    Test.setupTestData(pieces)
    expect(Selection.getPieces().length).to.be.eql(0)
    expect(Selection.getFeatures().delete).to.be.eql(false)
    expect(Test.mock(await Selection.clone({ x: 1024, y: 1024 }, false))).to.be.eql({})

    Selection.select('P1')
    Selection.select('P2')
    expect(Selection.getPieces().length).to.be.eql(2)
    expect(Selection.getFeatures().delete).to.be.eql(true)
    const c = Test.mock(await Selection.clone({ x: 1024, y: 1024 }, false)).body
    expect(c.length).to.be.eql(2)
    expect(c[0].id).to.be.eql('P1')
    expect(c[1].id).to.be.eql('P2')
    Selection.clear()
  })

  it('copy() paste()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'P1', x: 64, y: 64, n: 1 },
      { ...Test.data.pieceFull(), id: 'P2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_DELETE },
      { ...Test.data.pieceFull(), id: 'P3', x: 256, y: 128 },
      { ...Test.data.pieceFull(), id: 'P4', x: 1256, y: 1128 }
    ]
    Test.setupTestData(pieces)

    Selection.select('P1')
    Selection.select('P2')
    await Selection.copy()
    const copy1 = Test.mock(await Selection.paste({ x: 1024, y: 1024 }, false)).body
    expect(copy1.length).to.be.eql(2)
    expect(copy1[0].id).to.be.eql('P1')
    expect(copy1[0].n).to.be.eql(2) // copy -> increase
    expect(copy1[1].id).to.be.eql('P2')
    const copy2 = Test.mock(await Selection.paste({ x: 1024, y: 1024 }, false)).body
    expect(copy2.length).to.be.eql(2)
    expect(copy2[0].id).to.be.eql('P1')
    expect(copy2[0].n).to.be.eql(3) // copy -> more increase
    expect(copy2[1].id).to.be.eql('P2')
    expect(Selection.getPieces().length).to.be.eql(2) // copy won't remove
    Selection.clear()

    Selection.select('P1')
    Selection.select('P2')
    await Selection.cut()
    const cut1 = Test.mock(await Selection.paste({ x: 1024, y: 1024 }, false)).body
    expect(cut1.length).to.be.eql(2)
    expect(cut1[0].id).to.be.eql('P1')
    expect(cut1[0].n).to.be.eql(1) // cut -> no increase
    expect(cut1[1].id).to.be.eql('P2')
    const cut2 = Test.mock(await Selection.paste({ x: 1024, y: 1024 }, false)).body
    expect(cut2.length).to.be.eql(2)
    expect(cut2[0].id).to.be.eql('P1')
    expect(cut2[0].n).to.be.eql(2) // cut -> first increase
    expect(cut2[1].id).to.be.eql('P2')
    expect(Selection.getPieces().length).to.be.eql(0) // cut removes
    Selection.clear()

    // change selection -> no effect
    Selection.select('P3')
    const c3 = Test.mock(await Selection.paste({ x: 1024, y: 1024 }, false)).body
    expect(c3.length).to.be.eql(2)
    expect(c3[0].id).to.be.eql('P1')
    expect(c3[1].id).to.be.eql('P2')
  })

  it('moveTiles()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'P1', x: 64, y: 64 },
      { ...Test.data.pieceFull(), id: 'P2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_MOVE },
      { ...Test.data.pieceFull(), id: 'P3', x: 256, y: 128 },
      { ...Test.data.pieceFull(), id: 'P4', x: 1256, y: 1128 }
    ]
    Test.setupTestData(pieces)

    Selection.select('P1')
    Selection.select('P2')
    await Selection.copy()
    const c = Test.mock(await Selection.moveTiles(1, 1, false)).body
    expect(c.length).to.be.eql(1)
    expect(c[0].id).to.be.eql('P1')
    Selection.clear()
  })

  it('remove()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'P1', x: 64, y: 64 },
      { ...Test.data.pieceFull(), id: 'P2', x: 32 + 64 * 1, y: 32 + 64 * 1, f: Content.FLAG.NO_DELETE },
      { ...Test.data.pieceFull(), id: 'P3', x: 256, y: 128 },
      { ...Test.data.pieceFull(), id: 'P4', x: 1256, y: 1128 }
    ]
    Test.setupTestData(pieces)
    expect(Selection.getPieces().length).to.be.eql(0)
    expect(Selection.getFeatures().delete).to.be.eql(false)
    expect(Test.mock(await Selection.remove(false))).to.be.eql({})

    Selection.select('P2')
    expect(Selection.getPieces().length).to.be.eql(1)
    expect(Selection.getFeatures().delete).to.be.eql(false)
    expect(Test.mock(await Selection.remove(false))).to.be.eql({})
    Selection.clear()

    Selection.select('P1')
    Selection.select('P2')
    expect(Selection.getPieces().length).to.be.eql(2)
    expect(Selection.getFeatures().delete).to.be.eql(true)
    expect(Test.mock(await Selection.remove(false)).body).to.be.eql([pieces[0].id])
    Selection.clear()

    Selection.select('P2')
    Selection.select('P3')
    Selection.select('P4')
    expect(Selection.getPieces().length).to.be.eql(3)
    expect(Selection.getFeatures().delete).to.be.eql(true)
    expect(Test.mock(await Selection.remove(false)).body).to.be.eql([pieces[2].id, pieces[3].id])
    Selection.clear()
  })

  it('rotate()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'R1', r: 0 },
      { ...Test.data.pieceFull(), id: 'R2', r: 10 },
      { ...Test.data.pieceFull(), id: 'R3', r: 359 },
      { ...Test.data.pieceFull(), id: 'R4', r: 350 }
    ]
    Test.setupTestData(pieces)
    State.setRoomPreference(State.PREF.PIECE_ROTATE, 45)

    Selection.clear()
    expect(Test.mock(await Selection.rotate(true, false))).to.be.eql({})
    expect(Test.mock(await Selection.rotate(false, false))).to.be.eql({})

    Selection.select('R2')
    expect(Test.mock(await Selection.rotate(true, false)).body).to.be.eql([
      { id: 'R2', r: 55 }
    ])
    Selection.clear()

    Selection.select('R1')
    Selection.select('R4')
    expect(Test.mock(await Selection.rotate(false, false)).body).to.be.eql([
      { id: 'R1', r: 315 },
      { id: 'R4', r: 305 }
    ])
    Selection.clear()
  })

  it('rotateRandom()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'R1', r: 0 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.rotateRandom(true, false))).to.be.eql({})
    expect(Test.mock(await Selection.rotateRandom(false, false))).to.be.eql({})

    Selection.select('R1')
    expect(Test.mock(await Selection.rotateRandom(true, false)).body[0]).to.have.all.keys('id', 'r')
    Selection.clear()
  })

  it('flip()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: 'F1', a: 'BQ9I2100', l: 4, s: 1 },
      { ...Test.data.pieceMinimal(), id: 'F2', a: 'BQ9I2100', l: 4, s: 1 },
      { ...Test.data.pieceMinimal(), id: 'F3', a: 'BQ9I2100', l: 4, s: 1 },
      { ...Test.data.pieceMinimal(), id: 'F4', a: 'BQ9I2100', l: 4, s: 1 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.flip(true, false))).to.be.eql({})
    expect(Test.mock(await Selection.flip(false, false))).to.be.eql({})

    Selection.select('F2')
    expect(Test.mock(await Selection.flip(true, false)).body).to.be.eql([
      { id: 'F2', s: 2 }
    ])
    expect(Test.mock(await Selection.flip(false, false)).body).to.be.eql([
      { id: 'F2', s: 0 }
    ])
    Selection.clear()

    Selection.select('F1')
    Selection.select('F4')
    expect(Test.mock(await Selection.flip(true, false)).body).to.be.eql([
      { id: 'F1', s: 2 },
      { id: 'F4', s: 2 }
    ])
    Selection.clear()
  })

  it('grid()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: 'G1', l: 1, s: 1 },
      { ...Test.data.pieceMinimal(), id: 'G2', l: 1, s: 1, f: Content.FLAG.TILE_GRID_MINOR },
      { ...Test.data.pieceMinimal(), id: 'G3', l: 1, s: 1 },
      { ...Test.data.pieceMinimal(), id: 'G4', l: 1, s: 1, f: Content.FLAG.TILE_GRID_MAJOR }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.grid(false))).to.be.eql({})

    Selection.select('G2')
    expect(Test.mock(await Selection.grid(false)).body).to.be.eql([
      { id: 'G2', f: Content.FLAG.TILE_GRID_MAJOR }
    ])
    Selection.clear()

    Selection.select('G1')
    Selection.select('G4')
    expect(Test.mock(await Selection.grid(false)).body).to.be.eql([
      { id: 'G1', f: Content.FLAG.TILE_GRID_MINOR },
      { id: 'G4', f: 0 }
    ])
    Selection.clear()
  })

  it('pile()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: 'P1', x: 32, y: 32 },
      { ...Test.data.pieceMinimal(), id: 'P2', x: 32, y: 32 },
      { ...Test.data.pieceMinimal(), id: 'P3', x: 32, y: 32 },
      { ...Test.data.pieceMinimal(), id: 'P4', x: 96, y: 96 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.pile(true, false))).to.be.eql({})
    expect(Test.mock(await Selection.pile(false, false))).to.be.eql({})

    Selection.select('P2')
    expect(Test.mock(await Selection.pile(true, false))).to.be.eql({})
    expect(Test.mock(await Selection.pile(false, false))).to.be.eql({})
    Selection.clear()

    Selection.select('P1')
    Selection.select('P4')
    expect(Test.mock(await Selection.pile(false, false)).body).to.be.eql([
      { id: 'P1', x: 64, y: 64 },
      { id: 'P4', x: 64, y: 64 }
    ])
    Selection.clear()
  })

  it('number()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: 'F1', l: 4, n: 0 },
      { ...Test.data.pieceMinimal(), id: 'F2', l: 4, n: 1 },
      { ...Test.data.pieceMinimal(), id: 'F3', l: 4, n: 35 },
      { ...Test.data.pieceMinimal(), id: 'F4', l: 3 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.number(1, false))).to.be.eql({})
    expect(Test.mock(await Selection.number(-1, false))).to.be.eql({})

    Selection.select('F2')
    expect(Test.mock(await Selection.number(-1, false)).body).to.be.eql([
      { id: 'F2', n: 0 }
    ])
    expect(Test.mock(await Selection.number(1, false)).body).to.be.eql([
      { id: 'F2', n: 2 }
    ])
    Selection.clear()

    Selection.select('F1')
    Selection.select('F4')
    expect(Test.mock(await Selection.number(1, false)).body).to.be.eql([
      { id: 'F1', n: 1 }
    ])
    Selection.clear()
  })

  it('flipRandom()', async function () {
    const pieces = [
      { ...Test.data.pieceMinimal(), id: 'F1', a: 'BQ9I2100', l: 4 },
      { ...Test.data.pieceMinimal(), id: 'F2', a: 'BQ9I2100', l: 4 },
      { ...Test.data.pieceMinimal(), id: 'F3', a: 'BQ9I2100', l: 4 },
      { ...Test.data.pieceMinimal(), id: 'F4', a: 'BQ9I2100', l: 4 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.flipRandom(false))).to.be.eql({})

    Selection.select('F2')
    const r = Test.mock(await Selection.flipRandom(false)).body
    expect(r.length).to.be.eql(1)
    expect(r[0].id).to.be.eql('F2')
    expect(r[0]).to.have.all.keys('id', 'x', 'y', 's', 'r')
    Selection.clear()

    Selection.select('F1')
    Selection.select('F4')
    const r2 = Test.mock(await Selection.flipRandom(false)).body
    expect(r2.length).to.be.eql(2)
    expect(r2[0].id).to.be.eql('F1')
    expect(r2[0]).to.have.all.keys('id', 'x', 'y', 's', 'r')
    expect(r2[1].id).to.be.eql('F4')
    expect(r2[1]).to.have.all.keys('id', 'x', 'y', 's', 'r')
    Selection.clear()
  })

  it('toBottom()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'R1', z: 1 },
      { ...Test.data.pieceFull(), id: 'R2', z: 2 },
      { ...Test.data.pieceFull(), id: 'R3', z: 3 },
      { ...Test.data.pieceFull(), id: 'R4', z: 4 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.toBottom(false))).to.be.eql({})

    Selection.select('R2')
    expect(Test.mock(await Selection.toBottom(false)).body).to.be.eql([
      { id: 'R2', z: 0 }
    ])
    Selection.clear()

    Selection.select('R3')
    Selection.select('R4')
    expect(Test.mock(await Selection.toBottom(false)).body).to.be.eql([
      { id: 'R4', z: 0 },
      { id: 'R3', z: -1 }
    ])
    Selection.clear()
  })

  it('toTop()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'R1', z: 1 },
      { ...Test.data.pieceFull(), id: 'R2', z: 2 },
      { ...Test.data.pieceFull(), id: 'R3', z: 3 },
      { ...Test.data.pieceFull(), id: 'R4', z: 4 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.toTop(false))).to.be.eql({})

    Selection.select('R2')
    expect(Test.mock(await Selection.toTop(false)).body).to.be.eql([
      { id: 'R2', z: 5 }
    ])
    Selection.clear()

    Selection.select('R2')
    Selection.select('R3')
    expect(Test.mock(await Selection.toTop(false)).body).to.be.eql([
      { id: 'R2', z: 5 },
      { id: 'R3', z: 6 }
    ])
    Selection.clear()
  })

  it('toggleColor()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'C1', l: 1 },
      { ...Test.data.pieceFull(), id: 'C2', l: 2 },
      { ...Test.data.pieceFull(), id: 'C3', l: 3 },
      { ...Test.data.pieceFull(), id: 'C4', l: 4 },
      { ...Test.data.pieceFull(), id: 'C5', l: 5 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.toggleColor(false))).to.be.eql({})

    Selection.select('C2')
    expect(Test.mock(await Selection.toggleColor(false)).body).to.be.eql([
      { id: 'C2', c: [2, 2] }
    ])
    Selection.clear()

    Selection.select('C2')
    Selection.select('C3')
    expect(Test.mock(await Selection.toggleColor(false)).body).to.be.eql([
      { id: 'C2', c: [2, 2] },
      { id: 'C3', c: [2, 2] }
    ])
    Selection.clear()
  })

  it('toggleBorder()', async function () {
    const pieces = [
      { ...Test.data.pieceFull(), id: 'C1', l: 4 },
      { ...Test.data.pieceFull(), id: 'C2', l: 4 },
      { ...Test.data.pieceFull(), id: 'C3', l: 4, c: [2, 13] },
      { ...Test.data.pieceFull(), id: 'C4', l: 4 },
      { ...Test.data.pieceFull(), id: 'C5', l: 4 }
    ]
    Test.setupTestData(pieces)

    Selection.clear()
    expect(Test.mock(await Selection.toggleBorder(false))).to.be.eql({})

    Selection.select('C2')
    expect(Test.mock(await Selection.toggleBorder(false)).body).to.be.eql([
      { id: 'C2', c: [1, 3] }
    ])
    Selection.clear()

    Selection.select('C2')
    Selection.select('C3')
    expect(Test.mock(await Selection.toggleBorder(false)).body).to.be.eql([
      { id: 'C2', c: [1, 3] },
      { id: 'C3', c: [2, 0] }
    ])
    Selection.clear()
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
