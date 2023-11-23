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

import * as Content from '../../../src/js/view/room/tabletop/content.mjs'
import * as Dom from '../../../src/js/view/room/tabletop/dom.mjs'

import * as Test from '../../integration/utils/test.mjs'
const expect = Test.expect

describe('Frontend - dom.mjs', function () {
  beforeEach(function () {
    Test.setupTestData()
  })

  it('getAssetURL()', function () {
    const asset = Content.findAsset('BQ9I2100')

    expect(Dom.getAssetURL(asset, -1)).to.be.eql(
      'api/data/rooms/testroom/assets/other/_.fateDark.1x1x0x5.1.png'
    )
    expect(Dom.getAssetURL(asset, 0)).to.be.eql(
      'api/data/rooms/testroom/assets/other/_.fateDark.1x1x1x5.1.svg'
    )
    expect(Dom.getAssetURL(asset, 1)).to.be.eql(
      'api/data/rooms/testroom/assets/other/_.fateDark.1x1x2x5.1.svg'
    )
  })

  it('getMaterialMedia()', function () {
    expect(Dom.getMaterialMedia('wood')).to.match(/^api\/data\/rooms\/testroom\/assets\/material\/wood.png$/)
    expect(Dom.getMaterialMedia('none')).to.match(/^api\/data\/rooms\/testroom\/assets\/material\/none.png$/)
    expect(Dom.getMaterialMedia('blah')).to.match(/^api\/data\/rooms\/testroom\/assets\/material\/none.png$/)
  })
})
