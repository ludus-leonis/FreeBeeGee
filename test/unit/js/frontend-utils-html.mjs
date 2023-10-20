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

import { expect } from 'chai'

import {
  getGetParameter,
  getStoreValue,
  setStoreValue,
  toggleFullscreen,
  brightness
} from '../../../src/js/lib/utils-html.mjs'

describe('Frontend - utils.mjs - HTML', function () {
  it('getGetParameter()', function () {
    // we can't really test this witout a browser
    expect(getGetParameter()).to.be.eql('')
    expect(getGetParameter('')).to.be.eql('')
    expect(getGetParameter('none')).to.be.eql('')
  })

  it('setStoreValue() getStoreValue()', function () {
    // we can't really test this witout a browser
    expect(getStoreValue('p1', 'v1')).to.be.eql(undefined)
    expect(getStoreValue('p1', 'v2')).to.be.eql(undefined)
    expect(getStoreValue('p2', 'v1')).to.be.eql(undefined)
    expect(getStoreValue('p2', 'v2')).to.be.eql(undefined)

    setStoreValue('p1', 'v1', true)
    expect(getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(getStoreValue('p1', 'v2')).to.be.eql(undefined)
    expect(getStoreValue('p2', 'v1')).to.be.eql(undefined)
    expect(getStoreValue('p2', 'v2')).to.be.eql(undefined)

    setStoreValue('p1', 'v2', 'blue')
    expect(getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(getStoreValue('p1', 'v2')).to.be.eql('blue')
    expect(getStoreValue('p2', 'v1')).to.be.eql(undefined)
    expect(getStoreValue('p2', 'v2')).to.be.eql(undefined)

    setStoreValue('p2', 'v1', 123)
    expect(getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(getStoreValue('p1', 'v2')).to.be.eql('blue')
    expect(getStoreValue('p2', 'v1')).to.be.eql(123)
    expect(getStoreValue('p2', 'v2')).to.be.eql(undefined)

    setStoreValue('p2', 'v2', [1, 2])
    expect(getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(getStoreValue('p1', 'v2')).to.be.eql('blue')
    expect(getStoreValue('p2', 'v1')).to.be.eql(123)
    expect(getStoreValue('p2', 'v2')).to.be.eql([1, 2])

    setStoreValue('p1', 'v2', 'red')
    expect(getStoreValue('p1', 'v1')).to.be.eql(true)
    expect(getStoreValue('p1', 'v2')).to.be.eql('red')
    expect(getStoreValue('p2', 'v1')).to.be.eql(123)
    expect(getStoreValue('p2', 'v2')).to.be.eql([1, 2])
  })

  it('toggleFullscreen()', function () {
    // we can't really test this witout a browser, but we at least call it
    expect(toggleFullscreen()).to.be.eql(false)
  })

  it('brightness()', function () {
    expect(brightness('#000000')).to.be.eql(0)
    expect(brightness('#FF0000')).to.be.eql(85)
    expect(brightness('#00FF00')).to.be.eql(85)
    expect(brightness('#0000FF')).to.be.eql(85)
    expect(brightness('#FFFF00')).to.be.eql(170)
    expect(brightness('#00FFFF')).to.be.eql(170)
    expect(brightness('#FF00FF')).to.be.eql(170)
    expect(brightness('#ffffff')).to.be.eql(255)
    expect(brightness('#FFFFFF')).to.be.eql(255)
  })
})
