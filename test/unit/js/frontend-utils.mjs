/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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

/* global describe, it */

import { expect } from 'chai'

import {
  getGetParameter,
  getStoreValue,
  setStoreValue,
  toggleFullscreen,

  isAll,
  isAny,
  isNone,

  mod,
  clamp,
  snapGrid,
  snapHex,
  snapHex2,
  shuffle,
  intersect,
  contains,
  getDimensionsRotated,

  equalsJSON,

  uuid,
  bytesToIso,
  hash,
  toTitleCase,
  toCamelCase,
  unCamelCase,
  sortByString,
  sortByNumber,
  prettyName,
  unprettyName,

  recordTime,

  brightness
} from '../../../src/js/lib/utils.mjs'

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

describe('Frontend - utils.mjs - Arrays', function () {
  it('isAll()', function () {
    expect(isAll([1, 1, 1], i => i === 1)).to.be.eql(true)
    expect(isAll([1, 1, 2], i => i === 1)).to.be.eql(false)
    expect(isAll([1, 1, 2], i => i === 2)).to.be.eql(false)
    expect(isAll([{ id: 1 }, { id: 2 }], i => i.id === 2)).to.be.eql(false)
  })

  it('isAny()', function () {
    expect(isAny([1, 1, 1], i => i === 1)).to.be.eql(true)
    expect(isAny([1, 1, 2], i => i === 1)).to.be.eql(true)
    expect(isAny([1, 1, 2], i => i === 2)).to.be.eql(true)
    expect(isAny([{ id: 1 }, { id: 2 }], i => i.id === 2)).to.be.eql(true)
  })

  it('isNone()', function () {
    expect(isNone([1, 1, 1], i => i === 3)).to.be.eql(true)
    expect(isNone([1, 1, 2], i => i === 2)).to.be.eql(false)
    expect(isNone([1, 1, 2], i => i === 1)).to.be.eql(false)
    expect(isNone([{ id: 1 }, { id: 2 }], i => i.id === 3)).to.be.eql(true)
  })
})

describe('Frontend - utils.mjs - Math', function () {
  it('mod()', function () {
    expect(mod(-33, 16)).to.be.eql(15)
    expect(mod(-32, 16)).to.be.eql(0)
    expect(mod(-31, 16)).to.be.eql(1)
    expect(mod(-17, 16)).to.be.eql(15)
    expect(mod(-16, 16)).to.be.eql(0)
    expect(mod(-15, 16)).to.be.eql(1)
    expect(mod(-1, 16)).to.be.eql(15)
    expect(mod(0, 16)).to.be.eql(0)
    expect(mod(1, 16)).to.be.eql(1)
    expect(mod(10, 16)).to.be.eql(10)
    expect(mod(15, 16)).to.be.eql(15)
    expect(mod(16, 16)).to.be.eql(0)
    expect(mod(17, 16)).to.be.eql(1)
    expect(mod(31, 16)).to.be.eql(15)
    expect(mod(32, 16)).to.be.eql(0)
    expect(mod(33, 16)).to.be.eql(1)
  })

  it('clamp()', function () {
    expect(clamp(-2, -3, 2)).to.be.eql(-2)
    expect(clamp(-2, -2, 2)).to.be.eql(-2)
    expect(clamp(-2, -1, 2)).to.be.eql(-1)
    expect(clamp(-2, 0, 2)).to.be.eql(0)
    expect(clamp(-2, 1, 2)).to.be.eql(1)
    expect(clamp(-2, 2, 2)).to.be.eql(2)
    expect(clamp(-2, 3, 2)).to.be.eql(2)
    expect(clamp(-2.1, 3.1, 2.2)).to.be.eql(2.2)
  })

  it('snapGrid()', function () {
    // lod 1
    expect(snapGrid(0, 0, 64, 1)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(32, 0, 64, 1)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(63, 0, 64, 1)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(64 + 0, 0, 64, 1)).to.be.eql({ x: 64 + 32, y: 32 })
    expect(snapGrid(64 + 32, 0, 64, 1)).to.be.eql({ x: 64 + 32, y: 32 })
    expect(snapGrid(64 + 63, 0, 64, 1)).to.be.eql({ x: 64 + 32, y: 32 })
    expect(snapGrid(0, 64 + 0, 64, 1)).to.be.eql({ x: 32, y: 64 + 32 })
    expect(snapGrid(32, 64 + 0, 64, 1)).to.be.eql({ x: 32, y: 64 + 32 })
    expect(snapGrid(63, 64 + 0, 64, 1)).to.be.eql({ x: 32, y: 64 + 32 })
    expect(snapGrid(-128 + 0, 0, 64, 1)).to.be.eql({ x: -128 + 32, y: 32 })
    expect(snapGrid(-128 + 32, 0, 64, 1)).to.be.eql({ x: -128 + 32, y: 32 })
    expect(snapGrid(-128 + 63, 0, 64, 1)).to.be.eql({ x: -128 + 32, y: 32 })

    // lod 2
    expect(snapGrid(0, 0, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(snapGrid(32, 0, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(snapGrid(33, 0, 64, 2)).to.be.eql({ x: 64, y: 0 })
    expect(snapGrid(63, 0, 64, 2)).to.be.eql({ x: 64, y: 0 })
    expect(snapGrid(0, 0, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(snapGrid(0, 32, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(snapGrid(0, 33, 64, 2)).to.be.eql({ x: 0, y: 64 })
    expect(snapGrid(0, 63, 64, 2)).to.be.eql({ x: 0, y: 64 })
    expect(snapGrid(32, 32, 64, 2)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(33, 33, 64, 2)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(34, 34, 64, 2)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(128 + 0, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(snapGrid(128 + 32, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(snapGrid(128 + 33, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 64, y: 128 + 0 })
    expect(snapGrid(128 + 63, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 64, y: 128 + 0 })
    expect(snapGrid(128 + 0, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(snapGrid(128 + 0, 128 + 32, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(snapGrid(128 + 0, 128 + 33, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 64 })
    expect(snapGrid(128 + 0, 128 + 63, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 64 })
    expect(snapGrid(128 + 32, 128 + 32, 64, 2)).to.be.eql({ x: 128 + 32, y: 128 + 32 })
    expect(snapGrid(128 + 33, 128 + 33, 64, 2)).to.be.eql({ x: 128 + 32, y: 128 + 32 })
    expect(snapGrid(128 + 34, 128 + 34, 64, 2)).to.be.eql({ x: 128 + 32, y: 128 + 32 })

    // lod 3
    expect(snapGrid(0, 0, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(snapGrid(15, 15, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(snapGrid(16, 16, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(31, 31, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(32, 32, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(33, 33, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(snapGrid(31, -1, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(snapGrid(32, 0, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(snapGrid(33, 1, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(snapGrid(-1, 31, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(snapGrid(0, 32, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(snapGrid(1, 33, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(snapGrid(63, 129, 64, 3)).to.be.eql({ x: 64, y: 128 })
    expect(snapGrid(-31, -31, 64, 3)).to.be.eql({ x: -32, y: -32 })
    expect(snapGrid(-32, -32, 64, 3)).to.be.eql({ x: -32, y: -32 })
    expect(snapGrid(-33, -33, 64, 3)).to.be.eql({ x: -32, y: -32 })
    expect(snapGrid(128 + 31, -1 + 128, 64, 3)).to.be.eql({ x: 128 + 32, y: 128 + 0 })
    expect(snapGrid(128 + 32, 0 + 128, 64, 3)).to.be.eql({ x: 128 + 32, y: 128 + 0 })
    expect(snapGrid(128 + 33, 1 + 128, 64, 3)).to.be.eql({ x: 128 + 32, y: 128 + 0 })
    expect(snapGrid(128 + -1, 31 + 128, 64, 3)).to.be.eql({ x: 128 + 0, y: 128 + 32 })
    expect(snapGrid(128 + 0, 32 + 128, 64, 3)).to.be.eql({ x: 128 + 0, y: 128 + 32 })
    expect(snapGrid(128 + 1, 33 + 128, 64, 3)).to.be.eql({ x: 128 + 0, y: 128 + 32 })
    expect(snapGrid(-128 + 31, -1 + -128, 64, 3)).to.be.eql({ x: -128 + 32, y: -128 + 0 })
    expect(snapGrid(-128 + 32, 0 + -128, 64, 3)).to.be.eql({ x: -128 + 32, y: -128 + 0 })
    expect(snapGrid(-128 + 33, 1 + -128, 64, 3)).to.be.eql({ x: -128 + 32, y: -128 + 0 })
    expect(snapGrid(-128 + -1, 31 + -128, 64, 3)).to.be.eql({ x: -128 + 0, y: -128 + 32 })
    expect(snapGrid(-128 + 0, 32 + -128, 64, 3)).to.be.eql({ x: -128 + 0, y: -128 + 32 })
    expect(snapGrid(-128 + 1, 33 + -128, 64, 3)).to.be.eql({ x: -128 + 0, y: -128 + 32 })
  })

  it('snapHex()', function () {
    const jitter = 4

    // lod 1
    expect(snapHex(0 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(snapHex(0 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 0, y: 64 })
    expect(snapHex(55 + jitter, 32 - jitter, 64, 1)).to.be.eql({ x: 55, y: 32 })
    expect(snapHex(110 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 110, y: 0 })
    expect(snapHex(110 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 110, y: 64 })

    // lod 2
    expect(snapHex(0 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(snapHex(0 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 0, y: 64 })
    expect(snapHex(55 + jitter, 32 - jitter, 64, 1)).to.be.eql({ x: 55, y: 32 })
    expect(snapHex(110 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 110, y: 0 })
    expect(snapHex(110 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 110, y: 64 })
    expect(snapHex(37 + jitter, 0 - jitter, 64, 2)).to.be.eql({ x: 37, y: 0 })
    expect(snapHex(73 + jitter, 0 - jitter, 64, 2)).to.be.eql({ x: 73, y: 0 })
    expect(snapHex(19 + jitter, 32 - jitter, 64, 2)).to.be.eql({ x: 19, y: 32 })
    expect(snapHex(92 + jitter, 32 - jitter, 64, 2)).to.be.eql({ x: 92, y: 32 })
    expect(snapHex(37 + jitter, 64 - jitter, 64, 2)).to.be.eql({ x: 37, y: 64 })
    expect(snapHex(73 + jitter, 64 - jitter, 64, 2)).to.be.eql({ x: 73, y: 64 })

    // lod 3
    expect(snapHex(0 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(snapHex(0 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 0, y: 64 })
    expect(snapHex(55 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 55, y: 32 })
    expect(snapHex(110 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 110, y: 0 })
    expect(snapHex(110 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 110, y: 64 })
    expect(snapHex(37 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 37, y: 0 })
    expect(snapHex(73 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 73, y: 0 })
    expect(snapHex(19 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 19, y: 32 })
    expect(snapHex(92 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 92, y: 32 })
    expect(snapHex(37 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 37, y: 64 })
    expect(snapHex(73 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 73, y: 64 })
    expect(snapHex(55 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 55, y: 0 })
    expect(snapHex(0 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(snapHex(28 + jitter, 16 - jitter, 64, 3)).to.be.eql({ x: 28, y: 16 })
    expect(snapHex(82 + jitter, 16 - jitter, 64, 3)).to.be.eql({ x: 82, y: 16 })
    expect(snapHex(28 + jitter, 48 - jitter, 64, 3)).to.be.eql({ x: 28, y: 48 })
    expect(snapHex(82 + jitter, 48 - jitter, 64, 3)).to.be.eql({ x: 82, y: 48 })
    expect(snapHex(110 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 110, y: 32 })
    expect(snapHex(55 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 55, y: 64 })
  })

  it('snapHex2()', function () {
    const jitter = 4

    // lod 1
    expect(snapHex2(0 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(snapHex2(64 - jitter, 0 + jitter, 64, 1)).to.be.eql({ x: 64, y: 0 })
    expect(snapHex2(32 - jitter, 55 + jitter, 64, 1)).to.be.eql({ x: 32, y: 55 })
    expect(snapHex2(0 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 0, y: 110 })
    expect(snapHex2(64 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 64, y: 110 })

    // lod 2
    expect(snapHex2(0 - jitter, 0 + jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(snapHex2(64 - jitter, 0 + jitter, 64, 1)).to.be.eql({ x: 64, y: 0 })
    expect(snapHex2(32 - jitter, 55 + jitter, 64, 1)).to.be.eql({ x: 32, y: 55 })
    expect(snapHex2(0 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 0, y: 110 })
    expect(snapHex2(64 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 64, y: 110 })
    expect(snapHex2(0 - jitter, 37 + jitter, 64, 2)).to.be.eql({ x: 0, y: 37 })
    expect(snapHex2(0 - jitter, 73 + jitter, 64, 2)).to.be.eql({ x: 0, y: 73 })
    expect(snapHex2(32 - jitter, 19 + jitter, 64, 2)).to.be.eql({ x: 32, y: 19 })
    expect(snapHex2(32 - jitter, 92 + jitter, 64, 2)).to.be.eql({ x: 32, y: 92 })
    expect(snapHex2(64 - jitter, 37 + jitter, 64, 2)).to.be.eql({ x: 64, y: 37 })
    expect(snapHex2(64 - jitter, 73 + jitter, 64, 2)).to.be.eql({ x: 64, y: 73 })

    // lod 3
    expect(snapHex2(0 - jitter, 0 + jitter, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(snapHex2(64 - jitter, 0 + jitter, 64, 3)).to.be.eql({ x: 64, y: 0 })
    expect(snapHex2(32 - jitter, 55 + jitter, 64, 3)).to.be.eql({ x: 32, y: 55 })
    expect(snapHex2(0 - jitter, 110 + jitter, 64, 3)).to.be.eql({ x: 0, y: 110 })
    expect(snapHex2(64 - jitter, 110 + jitter, 64, 3)).to.be.eql({ x: 64, y: 110 })
    expect(snapHex2(0 - jitter, 37 + jitter, 64, 3)).to.be.eql({ x: 0, y: 37 })
    expect(snapHex2(0 - jitter, 73 + jitter, 64, 3)).to.be.eql({ x: 0, y: 73 })
    expect(snapHex2(32 - jitter, 19 + jitter, 64, 3)).to.be.eql({ x: 32, y: 19 })
    expect(snapHex2(32 - jitter, 92 + jitter, 64, 3)).to.be.eql({ x: 32, y: 92 })
    expect(snapHex2(64 - jitter, 37 + jitter, 64, 3)).to.be.eql({ x: 64, y: 37 })
    expect(snapHex2(64 - jitter, 73 + jitter, 64, 3)).to.be.eql({ x: 64, y: 73 })
    expect(snapHex2(0 - jitter, 55 + jitter, 64, 3)).to.be.eql({ x: 0, y: 55 })
    expect(snapHex2(32 - jitter, 0 + jitter, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(snapHex2(16 - jitter, 28 + jitter, 64, 3)).to.be.eql({ x: 16, y: 28 })
    expect(snapHex2(16 - jitter, 82 + jitter, 64, 3)).to.be.eql({ x: 16, y: 82 })
    expect(snapHex2(48 - jitter, 28 + jitter, 64, 3)).to.be.eql({ x: 48, y: 28 })
    expect(snapHex2(48 - jitter, 82 + jitter, 64, 3)).to.be.eql({ x: 48, y: 82 })
    expect(snapHex2(32 - jitter, 110 + jitter, 64, 3)).to.be.eql({ x: 32, y: 110 })
    expect(snapHex2(64 - jitter, 55 + jitter, 64, 3)).to.be.eql({ x: 64, y: 55 })
  })

  it('shuffle()', function () {
    expect(shuffle(
      [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    )).to.have.members(
      [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    )
  })

  it('intersect()', function () {
    // same size
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)

    // mostly same size
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 99 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 99, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 1, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 1, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 99 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 99, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 1, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 1, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)

    // one within the other
    expect(intersect(
      { left: 1, top: 1, right: 99, bottom: 99 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 1, top: 1, right: 99, bottom: 99 }
    )).to.be.eql(true)

    // corner touching
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 200, top: 0, right: 300, bottom: 100 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 200, right: 100, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 200, top: 200, right: 300, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)

    // more-than-corner overlapping
    expect(intersect(
      { left: 0, top: 0, right: 110, bottom: 110 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 190, top: 0, right: 300, bottom: 110 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 190, right: 110, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 190, top: 190, right: 300, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)

    // infinite overlapping
    expect(intersect(
      { left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }
    )).to.be.eql(true)

    // almost touching
    expect(intersect(
      { left: 0, top: 0, right: 99, bottom: 99 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
    expect(intersect(
      { left: 201, top: 0, right: 300, bottom: 101 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
    expect(intersect(
      { left: 0, top: 201, right: 101, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
    expect(intersect(
      { left: 201, top: 201, right: 300, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
  })

  it('contains()', function () {
    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(true)

    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 99 }
    )).to.be.eql(true)

    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 99, bottom: 100 }
    )).to.be.eql(true)

    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -99, right: 100, bottom: 100 }
    )).to.be.eql(true)

    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -99, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(true)

    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -99, top: -99, right: 99, bottom: 99 }
    )).to.be.eql(true)

    expect(contains(
      { left: -100, top: -100, right: 100, bottom: 99 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(contains(
      { left: -100, top: -100, right: 99, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(contains(
      { left: -100, top: -99, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(contains(
      { left: -99, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(contains(
      { left: -99, top: -99, right: 99, bottom: 99 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)
  })

  it('getDimensionsRotated()', function () {
    expect(getDimensionsRotated(1, 1, 0)).to.be.eql({ w: 1, h: 1 })
    expect(getDimensionsRotated(1, 1, 90)).to.be.eql({ w: 1, h: 1 })
    expect(getDimensionsRotated(1, 1, 180)).to.be.eql({ w: 1, h: 1 })
    expect(getDimensionsRotated(1, 1, 270)).to.be.eql({ w: 1, h: 1 })
    expect(getDimensionsRotated(1, 1, 1)).to.be.eql({ w: 2, h: 2 })
    expect(getDimensionsRotated(1, 1, -1)).to.be.eql({ w: 2, h: 2 })

    expect(getDimensionsRotated(4, 1, 0)).to.be.eql({ w: 4, h: 1 })
    expect(getDimensionsRotated(4, 1, 90)).to.be.eql({ w: 1, h: 4 })
    expect(getDimensionsRotated(4, 1, 180)).to.be.eql({ w: 4, h: 1 })
    expect(getDimensionsRotated(4, 1, 270)).to.be.eql({ w: 1, h: 4 })
    expect(getDimensionsRotated(4, 1, 1)).to.be.eql({ w: 5, h: 2 })
    expect(getDimensionsRotated(4, 1, -1)).to.be.eql({ w: 5, h: 2 })
    expect(getDimensionsRotated(1, 4, 1)).to.be.eql({ w: 2, h: 5 })
    expect(getDimensionsRotated(1, 4, -1)).to.be.eql({ w: 2, h: 5 })

    expect(getDimensionsRotated(100, 100, 45)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 90)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 180)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 270)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 360)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 360 + 90)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 360 + 180)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 + 360 + 270)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 - 360)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 - 360 + 90)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 - 360 + 180)).to.be.eql({ w: 142, h: 142 })
    expect(getDimensionsRotated(100, 100, 45 - 360 + 270)).to.be.eql({ w: 142, h: 142 })

    expect(getDimensionsRotated(200, 100, 0)).to.be.eql({ w: 200, h: 100 })
    expect(getDimensionsRotated(200, 100, 90)).to.be.eql({ w: 100, h: 200 })
    expect(getDimensionsRotated(200, 100, 180)).to.be.eql({ w: 200, h: 100 })
    expect(getDimensionsRotated(200, 100, 270)).to.be.eql({ w: 100, h: 200 })
    expect(getDimensionsRotated(200, 100, 60)).to.be.eql({ w: 187, h: 224 })
    expect(getDimensionsRotated(200, 100, -60)).to.be.eql({ w: 187, h: 224 })
    expect(getDimensionsRotated(200, 100, 120)).to.be.eql({ w: 187, h: 224 })
    expect(getDimensionsRotated(200, 100, -120)).to.be.eql({ w: 187, h: 224 })

    expect(getDimensionsRotated(576, 448, 60)).to.be.eql({ w: 676, h: 723 })
  })
})

describe('Frontend - utils.mjs - Datastructures', function () {
  it('equalsJSON()', function () {
    expect(equalsJSON(undefined, undefined)).to.be.eql(true)

    expect(equalsJSON(1, 1)).to.be.eql(true)
    expect(equalsJSON(2, 1)).to.be.eql(false)
    expect(equalsJSON(1, 2)).to.be.eql(false)

    expect(equalsJSON([1, 2], [1, 2])).to.be.eql(true)
    expect(equalsJSON([2, 1], [1, 2])).to.be.eql(false)
    expect(equalsJSON([1, 2], [2, 1])).to.be.eql(false)
    expect(equalsJSON(undefined, [])).to.be.eql(true)
    expect(equalsJSON([], undefined)).to.be.eql(true)
    expect(equalsJSON(null, [])).to.be.eql(true)
    expect(equalsJSON([], null)).to.be.eql(true)
  })
})

describe('Frontend - utils.mjs - Text', function () {
  it('uuid()', function () {
    expect(uuid(0)).to.be.eql('00000000-0000-4000-8000-000000000000')
    expect(uuid()).not.to.be.eql('00000000-0000-4000-8000-000000000000')
    const id1 = uuid()
    const id2 = uuid()
    expect(id1).not.to.be.eql(id2)
  })

  it('hash()', function () {
    expect(hash('hello world')).to.be.eql(1794106052)
  })

  it('toTitleCase()', function () {
    expect(toTitleCase('hello world')).to.be.eql('Hello World')
    expect(toTitleCase('helloworld')).to.be.eql('Helloworld')
    expect(toTitleCase(' h e l l o ')).to.be.eql(' H E L L O ')
    expect(toTitleCase('hELLO wORLD')).to.be.eql('Hello World')
    expect(toTitleCase('HELLO WORLD')).to.be.eql('Hello World')
    expect(toTitleCase(' hello   world ')).to.be.eql(' Hello   World ')
    expect(toTitleCase('hello.world')).to.be.eql('Hello.world')
  })

  it('toCamelCase()', function () {
    expect(toCamelCase('hello world')).to.be.eql('helloWorld')
    expect(toCamelCase('helloworld')).to.be.eql('helloworld')
    expect(toCamelCase(' h e l l o ')).to.be.eql('HELLO')
    expect(toCamelCase('hELLO wORLD')).to.be.eql('helloWorld')
    expect(toCamelCase('HELLO WORLD')).to.be.eql('helloWorld')
    expect(toCamelCase(' hello   world ')).to.be.eql('HelloWorld')
    expect(toCamelCase('hello.world')).to.be.eql('helloWorld')
  })

  it('unCamelCase()', function () {
    expect(unCamelCase('helloWorld')).to.be.eql('Hello World')
    expect(unCamelCase('helloworld')).to.be.eql('Helloworld')
    expect(unCamelCase('helloWorldWorld')).to.be.eql('Hello World World')
    expect(unCamelCase('helloWorld World')).to.be.eql('Hello World World')
    expect(unCamelCase(' hello World World ')).to.be.eql('Hello World World')
  })

  it('sortByString()', function () {
    expect(sortByString([], 'none')).to.be.eql([])
    expect(sortByString([
      { id: 'one' },
      { id: 'two' },
      { id: 'three' }
    ], 'id')).to.be.eql([
      { id: 'one' },
      { id: 'three' },
      { id: 'two' }
    ])
  })

  it('sortByNumber()', function () {
    expect(sortByNumber([], 'none')).to.be.eql([])
    expect(sortByNumber([
      { z: '15' },
      { z: '-4' },
      { z: '8' }
    ], 'z')).to.be.eql([
      { z: '-4' },
      { z: '8' },
      { z: '15' }
    ])
    expect(sortByNumber([
      { z: '15' },
      { z: '-4' },
      { }
    ], 'z', 0)).to.be.eql([
      { z: '-4' },
      { },
      { z: '15' }
    ])
    expect(sortByNumber([
      { z: '15' },
      { z: '-4' },
      { }
    ], 'z', -99999999999)).to.be.eql([
      { },
      { z: '-4' },
      { z: '15' }
    ])
    expect(sortByNumber([
      { z: '15' },
      { z: '-4' },
      { }
    ], 'z', 99999999999)).to.be.eql([
      { z: '-4' },
      { z: '15' },
      { }
    ])
  })

  it('bytesToIso()', function () {
    expect(bytesToIso(0)).to.be.eql('0 bytes')
    expect(bytesToIso(1)).to.be.eql('1 byte')
    expect(bytesToIso(2)).to.be.eql('2 bytes')
    expect(bytesToIso(1023)).to.be.eql('1023 bytes')
    expect(bytesToIso(1024)).to.be.eql('1 kB')
    expect(bytesToIso(1024 * 1024 - 1)).to.be.eql('1023 kB')
    expect(bytesToIso(1024 * 1024)).to.be.eql('1 MB')
    expect(bytesToIso(1024 * 1024 * 1024 - 1)).to.be.eql('1023 MB')
    expect(bytesToIso(1024 * 1024 * 1024)).to.be.eql('1 GB')
  })

  it('prettyName()', function () {
    expect(prettyName('dungeon')).to.be.eql('Dungeon')
    expect(prettyName('dungeon.door')).to.be.eql('Dungeon, Door')
    expect(prettyName('dungeon.ironDoor')).to.be.eql('Dungeon, Iron Door')
    expect(prettyName(' dunGeon.ironDoor ')).to.be.eql('Dun Geon, Iron Door')

    expect(prettyName('_.door')).to.be.eql('Door')
    expect(prettyName('_.door', true)).to.be.eql('Door')
    expect(prettyName('_.door', false)).to.be.eql('_, Door')
  })

  it('unprettyName()', function () {
    expect(unprettyName('Dungeon')).to.be.eql('dungeon')
    expect(unprettyName('Dungeon, ')).to.be.eql('dungeon')
    expect(unprettyName('Dungeon, Door')).to.be.eql('dungeon.door')
    expect(unprettyName('Dungeon, Iron Door')).to.be.eql('dungeon.ironDoor')
    expect(unprettyName('  Dun  Geon ,  Iron  Door  ')).to.be.eql('dunGeon.ironDoor')

    expect(unprettyName('_')).to.be.eql('_')
    expect(unprettyName('_, ')).to.be.eql('_')
    expect(unprettyName('_, Iron Door')).to.be.eql('_.ironDoor')
    expect(unprettyName('  _  , Iron Door  ')).to.be.eql('_.ironDoor')
  })
})

describe('Frontend - utils.mjs - Time', function () {
  it('recordTime()', function () {
    expect(recordTime('stat1', 10)).to.be.eql([0, 10])
    expect(recordTime('stat1', 11)).to.be.eql([0, 10, 11])
    expect(recordTime('stat1', 12)).to.be.eql([0, 10, 11, 12])
    expect(recordTime('stat1', 13)).to.be.eql([0, 10, 11, 12, 13])
    expect(recordTime('stat1', 14)).to.be.eql([0, 10, 11, 12, 13, 14])
    expect(recordTime('stat1', 15)).to.be.eql([0, 10, 11, 12, 13, 14, 15])
    expect(recordTime('stat1', 16)).to.be.eql([0, 10, 11, 12, 13, 14, 15, 16])
    expect(recordTime('stat1', 17)).to.be.eql([0, 10, 11, 12, 13, 14, 15, 16, 17])
    expect(recordTime('stat1', 18)).to.be.eql([0, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(recordTime('stat1', 19)).to.be.eql([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])

    expect(recordTime('stat2', 20)).to.be.eql([0, 20])
    expect(recordTime('stat2', 21)).to.be.eql([0, 20, 21])
    expect(recordTime('stat2', 22)).to.be.eql([0, 20, 21, 22])
    expect(recordTime('stat2', 23)).to.be.eql([0, 20, 21, 22, 23])
    expect(recordTime('stat2', 24)).to.be.eql([0, 20, 21, 22, 23, 24])
    expect(recordTime('stat2', 25)).to.be.eql([0, 20, 21, 22, 23, 24, 25])
    expect(recordTime('stat2', 26)).to.be.eql([0, 20, 21, 22, 23, 24, 25, 26])
    expect(recordTime('stat2', 27)).to.be.eql([0, 20, 21, 22, 23, 24, 25, 26, 27])
    expect(recordTime('stat2', 28)).to.be.eql([0, 20, 21, 22, 23, 24, 25, 26, 27, 28])
    expect(recordTime('stat2', 29)).to.be.eql([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])

    expect(recordTime('stat1', 30)).to.be.eql([11, 12, 13, 14, 15, 16, 17, 18, 19, 30])
  })
})
