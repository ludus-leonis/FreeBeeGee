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

/* global describe, it */

import { expect } from 'test/integration/utils/test.mjs'

import * as Browser from 'src/js/lib/util-browser.mjs'

describe('Frontend - util.mjs - HTML', function () {
  it('getGetParameter()', function () {
    // we can't really test this witout a browser
    expect(Browser.getGetParameter()).to.be.eql('')
    expect(Browser.getGetParameter('')).to.be.eql('')
    expect(Browser.getGetParameter('none')).to.be.eql('')
  })

  it('setStoreValue() getStoreValue()', function () {
    // we can't really test this witout a browser
    expect(Browser.getStoreValue('p1', 'v1')).to.be.eql(undefined)
    expect(Browser.getStoreValue('p1', 'v2')).to.be.eql(undefined)
    expect(Browser.getStoreValue('p2', 'v1')).to.be.eql(undefined)
    expect(Browser.getStoreValue('p2', 'v2')).to.be.eql(undefined)

    Browser.setStoreValue('p1', 'v1', true)
    expect(Browser.getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(Browser.getStoreValue('p1', 'v2')).to.be.eql(undefined)
    expect(Browser.getStoreValue('p2', 'v1')).to.be.eql(undefined)
    expect(Browser.getStoreValue('p2', 'v2')).to.be.eql(undefined)

    Browser.setStoreValue('p1', 'v2', 'blue')
    expect(Browser.getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(Browser.getStoreValue('p1', 'v2')).to.be.eql('blue')
    expect(Browser.getStoreValue('p2', 'v1')).to.be.eql(undefined)
    expect(Browser.getStoreValue('p2', 'v2')).to.be.eql(undefined)

    Browser.setStoreValue('p2', 'v1', 123)
    expect(Browser.getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(Browser.getStoreValue('p1', 'v2')).to.be.eql('blue')
    expect(Browser.getStoreValue('p2', 'v1')).to.be.eql(123)
    expect(Browser.getStoreValue('p2', 'v2')).to.be.eql(undefined)

    Browser.setStoreValue('p2', 'v2', [1, 2])
    expect(Browser.getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(Browser.getStoreValue('p1', 'v2')).to.be.eql('blue')
    expect(Browser.getStoreValue('p2', 'v1')).to.be.eql(123)
    expect(Browser.getStoreValue('p2', 'v2')).to.be.eql([1, 2])

    Browser.setStoreValue('p1', 'v2', 'red')
    expect(Browser.getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(Browser.getStoreValue('p1', 'v2')).to.be.eql('red')
    expect(Browser.getStoreValue('p2', 'v1')).to.be.eql(123)
    expect(Browser.getStoreValue('p2', 'v2')).to.be.eql([1, 2])
  })

  it('toggleFullscreen()', function () {
    // we can't really test this witout a browser, but we at least call it
    expect(Browser.toggleFullscreen()).to.be.eql(false)
  })

  it('brightness()', function () {
    expect(Browser.brightness('#000000')).to.be.eql(0)
    expect(Browser.brightness('#FF0000')).to.be.eql(85)
    expect(Browser.brightness('#00FF00')).to.be.eql(85)
    expect(Browser.brightness('#0000FF')).to.be.eql(85)
    expect(Browser.brightness('#FFFF00')).to.be.eql(170)
    expect(Browser.brightness('#00FFFF')).to.be.eql(170)
    expect(Browser.brightness('#FF00FF')).to.be.eql(170)
    expect(Browser.brightness('#ffffff')).to.be.eql(255)
    expect(Browser.brightness('#FFFFFF')).to.be.eql(255)
  })
})
