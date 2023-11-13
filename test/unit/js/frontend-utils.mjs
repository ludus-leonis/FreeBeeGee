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

import { expect } from '../../integration/utils/test.mjs'

import Util from '../../../src/js/lib/util.mjs'

describe('Frontend - util.mjs - Arrays', function () {
  it('isAll()', function () {
    expect(Util.isAll([1, 1, 1], i => i === 1)).to.be.eql(true)
    expect(Util.isAll([1, 1, 2], i => i === 1)).to.be.eql(false)
    expect(Util.isAll([1, 1, 2], i => i === 2)).to.be.eql(false)
    expect(Util.isAll([{ id: 1 }, { id: 2 }], i => i.id === 2)).to.be.eql(false)
  })

  it('isAny()', function () {
    expect(Util.isAny([1, 1, 1], i => i === 1)).to.be.eql(true)
    expect(Util.isAny([1, 1, 2], i => i === 1)).to.be.eql(true)
    expect(Util.isAny([1, 1, 2], i => i === 2)).to.be.eql(true)
    expect(Util.isAny([{ id: 1 }, { id: 2 }], i => i.id === 2)).to.be.eql(true)
  })

  it('isNone()', function () {
    expect(Util.isNone([1, 1, 1], i => i === 3)).to.be.eql(true)
    expect(Util.isNone([1, 1, 2], i => i === 2)).to.be.eql(false)
    expect(Util.isNone([1, 1, 2], i => i === 1)).to.be.eql(false)
    expect(Util.isNone([{ id: 1 }, { id: 2 }], i => i.id === 3)).to.be.eql(true)
  })

  it('mode()', function () {
    expect(Util.mode([1, 1, 1])).to.be.eql(1)
    expect(Util.mode([1, 2, 1])).to.be.eql(1)
    expect(Util.mode([2, 2, 1])).to.be.eql(2)
    expect(Util.mode([1, 2, 2])).to.be.eql(2)
    expect(Util.mode([2, 1, 2])).to.be.eql(2)
    expect(Util.mode([1, 2, 3, 3, 2, 1])).to.be.eql(1) // equal = last
    expect(Util.mode([true, 0, true, 'foo'])).to.be.eql(true)
    expect(Util.mode([])).to.be.eql(undefined)
    expect(Util.mode()).to.be.eql(undefined)
  })
})

describe('Frontend - util.mjs - Math', function () {
  it('mod()', function () {
    expect(Util.mod(-33, 16)).to.be.eql(15)
    expect(Util.mod(-32, 16)).to.be.eql(0)
    expect(Util.mod(-31, 16)).to.be.eql(1)
    expect(Util.mod(-17, 16)).to.be.eql(15)
    expect(Util.mod(-16, 16)).to.be.eql(0)
    expect(Util.mod(-15, 16)).to.be.eql(1)
    expect(Util.mod(-1, 16)).to.be.eql(15)
    expect(Util.mod(0, 16)).to.be.eql(0)
    expect(Util.mod(1, 16)).to.be.eql(1)
    expect(Util.mod(10, 16)).to.be.eql(10)
    expect(Util.mod(15, 16)).to.be.eql(15)
    expect(Util.mod(16, 16)).to.be.eql(0)
    expect(Util.mod(17, 16)).to.be.eql(1)
    expect(Util.mod(31, 16)).to.be.eql(15)
    expect(Util.mod(32, 16)).to.be.eql(0)
    expect(Util.mod(33, 16)).to.be.eql(1)
  })

  it('clamp()', function () {
    expect(Util.clamp(-2, -3, 2)).to.be.eql(-2)
    expect(Util.clamp(-2, -2, 2)).to.be.eql(-2)
    expect(Util.clamp(-2, -1, 2)).to.be.eql(-1)
    expect(Util.clamp(-2, 0, 2)).to.be.eql(0)
    expect(Util.clamp(-2, 1, 2)).to.be.eql(1)
    expect(Util.clamp(-2, 2, 2)).to.be.eql(2)
    expect(Util.clamp(-2, 3, 2)).to.be.eql(2)
    expect(Util.clamp(-2.1, 3.1, 2.2)).to.be.eql(2.2)
  })

  it('snapGrid()', function () {
    // lod 1
    expect(Util.snapGrid(0, 0, 64, 1)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(32, 0, 64, 1)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(63, 0, 64, 1)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(64 + 0, 0, 64, 1)).to.be.eql({ x: 64 + 32, y: 32 })
    expect(Util.snapGrid(64 + 32, 0, 64, 1)).to.be.eql({ x: 64 + 32, y: 32 })
    expect(Util.snapGrid(64 + 63, 0, 64, 1)).to.be.eql({ x: 64 + 32, y: 32 })
    expect(Util.snapGrid(0, 64 + 0, 64, 1)).to.be.eql({ x: 32, y: 64 + 32 })
    expect(Util.snapGrid(32, 64 + 0, 64, 1)).to.be.eql({ x: 32, y: 64 + 32 })
    expect(Util.snapGrid(63, 64 + 0, 64, 1)).to.be.eql({ x: 32, y: 64 + 32 })
    expect(Util.snapGrid(-128 + 0, 0, 64, 1)).to.be.eql({ x: -128 + 32, y: 32 })
    expect(Util.snapGrid(-128 + 32, 0, 64, 1)).to.be.eql({ x: -128 + 32, y: 32 })
    expect(Util.snapGrid(-128 + 63, 0, 64, 1)).to.be.eql({ x: -128 + 32, y: 32 })

    // lod 2
    expect(Util.snapGrid(0, 0, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapGrid(32, 0, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapGrid(33, 0, 64, 2)).to.be.eql({ x: 64, y: 0 })
    expect(Util.snapGrid(63, 0, 64, 2)).to.be.eql({ x: 64, y: 0 })
    expect(Util.snapGrid(0, 0, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapGrid(0, 32, 64, 2)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapGrid(0, 33, 64, 2)).to.be.eql({ x: 0, y: 64 })
    expect(Util.snapGrid(0, 63, 64, 2)).to.be.eql({ x: 0, y: 64 })
    expect(Util.snapGrid(32, 32, 64, 2)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(33, 33, 64, 2)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(34, 34, 64, 2)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(128 + 0, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(Util.snapGrid(128 + 32, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(Util.snapGrid(128 + 33, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 64, y: 128 + 0 })
    expect(Util.snapGrid(128 + 63, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 64, y: 128 + 0 })
    expect(Util.snapGrid(128 + 0, 128 + 0, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(Util.snapGrid(128 + 0, 128 + 32, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 0 })
    expect(Util.snapGrid(128 + 0, 128 + 33, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 64 })
    expect(Util.snapGrid(128 + 0, 128 + 63, 64, 2)).to.be.eql({ x: 128 + 0, y: 128 + 64 })
    expect(Util.snapGrid(128 + 32, 128 + 32, 64, 2)).to.be.eql({ x: 128 + 32, y: 128 + 32 })
    expect(Util.snapGrid(128 + 33, 128 + 33, 64, 2)).to.be.eql({ x: 128 + 32, y: 128 + 32 })
    expect(Util.snapGrid(128 + 34, 128 + 34, 64, 2)).to.be.eql({ x: 128 + 32, y: 128 + 32 })

    // lod 3
    expect(Util.snapGrid(0, 0, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapGrid(15, 15, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapGrid(16, 16, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(31, 31, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(32, 32, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(33, 33, 64, 3)).to.be.eql({ x: 32, y: 32 })
    expect(Util.snapGrid(31, -1, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(Util.snapGrid(32, 0, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(Util.snapGrid(33, 1, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(Util.snapGrid(-1, 31, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(Util.snapGrid(0, 32, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(Util.snapGrid(1, 33, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(Util.snapGrid(63, 129, 64, 3)).to.be.eql({ x: 64, y: 128 })
    expect(Util.snapGrid(-31, -31, 64, 3)).to.be.eql({ x: -32, y: -32 })
    expect(Util.snapGrid(-32, -32, 64, 3)).to.be.eql({ x: -32, y: -32 })
    expect(Util.snapGrid(-33, -33, 64, 3)).to.be.eql({ x: -32, y: -32 })
    expect(Util.snapGrid(128 + 31, -1 + 128, 64, 3)).to.be.eql({ x: 128 + 32, y: 128 + 0 })
    expect(Util.snapGrid(128 + 32, 0 + 128, 64, 3)).to.be.eql({ x: 128 + 32, y: 128 + 0 })
    expect(Util.snapGrid(128 + 33, 1 + 128, 64, 3)).to.be.eql({ x: 128 + 32, y: 128 + 0 })
    expect(Util.snapGrid(128 + -1, 31 + 128, 64, 3)).to.be.eql({ x: 128 + 0, y: 128 + 32 })
    expect(Util.snapGrid(128 + 0, 32 + 128, 64, 3)).to.be.eql({ x: 128 + 0, y: 128 + 32 })
    expect(Util.snapGrid(128 + 1, 33 + 128, 64, 3)).to.be.eql({ x: 128 + 0, y: 128 + 32 })
    expect(Util.snapGrid(-128 + 31, -1 + -128, 64, 3)).to.be.eql({ x: -128 + 32, y: -128 + 0 })
    expect(Util.snapGrid(-128 + 32, 0 + -128, 64, 3)).to.be.eql({ x: -128 + 32, y: -128 + 0 })
    expect(Util.snapGrid(-128 + 33, 1 + -128, 64, 3)).to.be.eql({ x: -128 + 32, y: -128 + 0 })
    expect(Util.snapGrid(-128 + -1, 31 + -128, 64, 3)).to.be.eql({ x: -128 + 0, y: -128 + 32 })
    expect(Util.snapGrid(-128 + 0, 32 + -128, 64, 3)).to.be.eql({ x: -128 + 0, y: -128 + 32 })
    expect(Util.snapGrid(-128 + 1, 33 + -128, 64, 3)).to.be.eql({ x: -128 + 0, y: -128 + 32 })
  })

  it('snapHex()', function () {
    const jitter = 4

    // lod 1
    expect(Util.snapHex(0 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapHex(0 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 0, y: 64 })
    expect(Util.snapHex(55 + jitter, 32 - jitter, 64, 1)).to.be.eql({ x: 55, y: 32 })
    expect(Util.snapHex(110 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 110, y: 0 })
    expect(Util.snapHex(110 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 110, y: 64 })

    // lod 2
    expect(Util.snapHex(0 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapHex(0 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 0, y: 64 })
    expect(Util.snapHex(55 + jitter, 32 - jitter, 64, 1)).to.be.eql({ x: 55, y: 32 })
    expect(Util.snapHex(110 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 110, y: 0 })
    expect(Util.snapHex(110 + jitter, 64 - jitter, 64, 1)).to.be.eql({ x: 110, y: 64 })
    expect(Util.snapHex(37 + jitter, 0 - jitter, 64, 2)).to.be.eql({ x: 37, y: 0 })
    expect(Util.snapHex(73 + jitter, 0 - jitter, 64, 2)).to.be.eql({ x: 73, y: 0 })
    expect(Util.snapHex(19 + jitter, 32 - jitter, 64, 2)).to.be.eql({ x: 19, y: 32 })
    expect(Util.snapHex(92 + jitter, 32 - jitter, 64, 2)).to.be.eql({ x: 92, y: 32 })
    expect(Util.snapHex(37 + jitter, 64 - jitter, 64, 2)).to.be.eql({ x: 37, y: 64 })
    expect(Util.snapHex(73 + jitter, 64 - jitter, 64, 2)).to.be.eql({ x: 73, y: 64 })

    // lod 3
    expect(Util.snapHex(0 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapHex(0 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 0, y: 64 })
    expect(Util.snapHex(55 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 55, y: 32 })
    expect(Util.snapHex(110 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 110, y: 0 })
    expect(Util.snapHex(110 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 110, y: 64 })
    expect(Util.snapHex(37 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 37, y: 0 })
    expect(Util.snapHex(73 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 73, y: 0 })
    expect(Util.snapHex(19 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 19, y: 32 })
    expect(Util.snapHex(92 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 92, y: 32 })
    expect(Util.snapHex(37 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 37, y: 64 })
    expect(Util.snapHex(73 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 73, y: 64 })
    expect(Util.snapHex(55 + jitter, 0 - jitter, 64, 3)).to.be.eql({ x: 55, y: 0 })
    expect(Util.snapHex(0 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 0, y: 32 })
    expect(Util.snapHex(28 + jitter, 16 - jitter, 64, 3)).to.be.eql({ x: 28, y: 16 })
    expect(Util.snapHex(82 + jitter, 16 - jitter, 64, 3)).to.be.eql({ x: 82, y: 16 })
    expect(Util.snapHex(28 + jitter, 48 - jitter, 64, 3)).to.be.eql({ x: 28, y: 48 })
    expect(Util.snapHex(82 + jitter, 48 - jitter, 64, 3)).to.be.eql({ x: 82, y: 48 })
    expect(Util.snapHex(110 + jitter, 32 - jitter, 64, 3)).to.be.eql({ x: 110, y: 32 })
    expect(Util.snapHex(55 + jitter, 64 - jitter, 64, 3)).to.be.eql({ x: 55, y: 64 })
  })

  it('snapHex2()', function () {
    const jitter = 4

    // lod 1
    expect(Util.snapHex2(0 + jitter, 0 - jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapHex2(64 - jitter, 0 + jitter, 64, 1)).to.be.eql({ x: 64, y: 0 })
    expect(Util.snapHex2(32 - jitter, 55 + jitter, 64, 1)).to.be.eql({ x: 32, y: 55 })
    expect(Util.snapHex2(0 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 0, y: 110 })
    expect(Util.snapHex2(64 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 64, y: 110 })

    // lod 2
    expect(Util.snapHex2(0 - jitter, 0 + jitter, 64, 1)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapHex2(64 - jitter, 0 + jitter, 64, 1)).to.be.eql({ x: 64, y: 0 })
    expect(Util.snapHex2(32 - jitter, 55 + jitter, 64, 1)).to.be.eql({ x: 32, y: 55 })
    expect(Util.snapHex2(0 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 0, y: 110 })
    expect(Util.snapHex2(64 - jitter, 110 + jitter, 64, 1)).to.be.eql({ x: 64, y: 110 })
    expect(Util.snapHex2(0 - jitter, 37 + jitter, 64, 2)).to.be.eql({ x: 0, y: 37 })
    expect(Util.snapHex2(0 - jitter, 73 + jitter, 64, 2)).to.be.eql({ x: 0, y: 73 })
    expect(Util.snapHex2(32 - jitter, 19 + jitter, 64, 2)).to.be.eql({ x: 32, y: 19 })
    expect(Util.snapHex2(32 - jitter, 92 + jitter, 64, 2)).to.be.eql({ x: 32, y: 92 })
    expect(Util.snapHex2(64 - jitter, 37 + jitter, 64, 2)).to.be.eql({ x: 64, y: 37 })
    expect(Util.snapHex2(64 - jitter, 73 + jitter, 64, 2)).to.be.eql({ x: 64, y: 73 })

    // lod 3
    expect(Util.snapHex2(0 - jitter, 0 + jitter, 64, 3)).to.be.eql({ x: 0, y: 0 })
    expect(Util.snapHex2(64 - jitter, 0 + jitter, 64, 3)).to.be.eql({ x: 64, y: 0 })
    expect(Util.snapHex2(32 - jitter, 55 + jitter, 64, 3)).to.be.eql({ x: 32, y: 55 })
    expect(Util.snapHex2(0 - jitter, 110 + jitter, 64, 3)).to.be.eql({ x: 0, y: 110 })
    expect(Util.snapHex2(64 - jitter, 110 + jitter, 64, 3)).to.be.eql({ x: 64, y: 110 })
    expect(Util.snapHex2(0 - jitter, 37 + jitter, 64, 3)).to.be.eql({ x: 0, y: 37 })
    expect(Util.snapHex2(0 - jitter, 73 + jitter, 64, 3)).to.be.eql({ x: 0, y: 73 })
    expect(Util.snapHex2(32 - jitter, 19 + jitter, 64, 3)).to.be.eql({ x: 32, y: 19 })
    expect(Util.snapHex2(32 - jitter, 92 + jitter, 64, 3)).to.be.eql({ x: 32, y: 92 })
    expect(Util.snapHex2(64 - jitter, 37 + jitter, 64, 3)).to.be.eql({ x: 64, y: 37 })
    expect(Util.snapHex2(64 - jitter, 73 + jitter, 64, 3)).to.be.eql({ x: 64, y: 73 })
    expect(Util.snapHex2(0 - jitter, 55 + jitter, 64, 3)).to.be.eql({ x: 0, y: 55 })
    expect(Util.snapHex2(32 - jitter, 0 + jitter, 64, 3)).to.be.eql({ x: 32, y: 0 })
    expect(Util.snapHex2(16 - jitter, 28 + jitter, 64, 3)).to.be.eql({ x: 16, y: 28 })
    expect(Util.snapHex2(16 - jitter, 82 + jitter, 64, 3)).to.be.eql({ x: 16, y: 82 })
    expect(Util.snapHex2(48 - jitter, 28 + jitter, 64, 3)).to.be.eql({ x: 48, y: 28 })
    expect(Util.snapHex2(48 - jitter, 82 + jitter, 64, 3)).to.be.eql({ x: 48, y: 82 })
    expect(Util.snapHex2(32 - jitter, 110 + jitter, 64, 3)).to.be.eql({ x: 32, y: 110 })
    expect(Util.snapHex2(64 - jitter, 55 + jitter, 64, 3)).to.be.eql({ x: 64, y: 55 })
  })

  it('shuffle()', function () {
    expect(Util.shuffle(
      [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    )).to.have.members(
      [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    )
  })

  it('intersect()', function () {
    // same size
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)

    // mostly same size
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 99 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 99, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 1, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 1, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 100, bottom: 99 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 0, right: 99, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 0, top: 1, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 1, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)

    // one within the other
    expect(Util.intersect(
      { left: 1, top: 1, right: 99, bottom: 99 },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 1, top: 1, right: 99, bottom: 99 }
    )).to.be.eql(true)

    // corner touching
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 200, top: 0, right: 300, bottom: 100 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 200, right: 100, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 200, top: 200, right: 300, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)

    // more-than-corner overlapping
    expect(Util.intersect(
      { left: 0, top: 0, right: 110, bottom: 110 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 190, top: 0, right: 300, bottom: 110 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 190, right: 110, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 190, top: 190, right: 300, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(true)

    // infinite overlapping
    expect(Util.intersect(
      { left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE },
      { left: 0, top: 0, right: 100, bottom: 100 }
    )).to.be.eql(true)
    expect(Util.intersect(
      { left: 0, top: 0, right: 100, bottom: 100 },
      { left: Number.MIN_VALUE, top: Number.MIN_VALUE, right: Number.MAX_VALUE, bottom: Number.MAX_VALUE }
    )).to.be.eql(true)

    // almost touching
    expect(Util.intersect(
      { left: 0, top: 0, right: 99, bottom: 99 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
    expect(Util.intersect(
      { left: 201, top: 0, right: 300, bottom: 101 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
    expect(Util.intersect(
      { left: 0, top: 201, right: 101, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
    expect(Util.intersect(
      { left: 201, top: 201, right: 300, bottom: 300 },
      { left: 100, top: 100, right: 200, bottom: 200 }
    )).to.be.eql(false)
  })

  it('contains()', function () {
    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(true)

    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 99 }
    )).to.be.eql(true)

    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 99, bottom: 100 }
    )).to.be.eql(true)

    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -99, right: 100, bottom: 100 }
    )).to.be.eql(true)

    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -99, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(true)

    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 100 },
      { left: -99, top: -99, right: 99, bottom: 99 }
    )).to.be.eql(true)

    expect(Util.contains(
      { left: -100, top: -100, right: 100, bottom: 99 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(Util.contains(
      { left: -100, top: -100, right: 99, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(Util.contains(
      { left: -100, top: -99, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(Util.contains(
      { left: -99, top: -100, right: 100, bottom: 100 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)

    expect(Util.contains(
      { left: -99, top: -99, right: 99, bottom: 99 },
      { left: -100, top: -100, right: 100, bottom: 100 }
    )).to.be.eql(false)
  })

  it('getDimensionsRotated()', function () {
    expect(Util.getDimensionsRotated(1, 1, 0)).to.be.eql({ w: 1, h: 1 })
    expect(Util.getDimensionsRotated(1, 1, 90)).to.be.eql({ w: 1, h: 1 })
    expect(Util.getDimensionsRotated(1, 1, 180)).to.be.eql({ w: 1, h: 1 })
    expect(Util.getDimensionsRotated(1, 1, 270)).to.be.eql({ w: 1, h: 1 })
    expect(Util.getDimensionsRotated(1, 1, 1)).to.be.eql({ w: 2, h: 2 })
    expect(Util.getDimensionsRotated(1, 1, -1)).to.be.eql({ w: 2, h: 2 })

    expect(Util.getDimensionsRotated(4, 1, 0)).to.be.eql({ w: 4, h: 1 })
    expect(Util.getDimensionsRotated(4, 1, 90)).to.be.eql({ w: 1, h: 4 })
    expect(Util.getDimensionsRotated(4, 1, 180)).to.be.eql({ w: 4, h: 1 })
    expect(Util.getDimensionsRotated(4, 1, 270)).to.be.eql({ w: 1, h: 4 })
    expect(Util.getDimensionsRotated(4, 1, 1)).to.be.eql({ w: 5, h: 2 })
    expect(Util.getDimensionsRotated(4, 1, -1)).to.be.eql({ w: 5, h: 2 })
    expect(Util.getDimensionsRotated(1, 4, 1)).to.be.eql({ w: 2, h: 5 })
    expect(Util.getDimensionsRotated(1, 4, -1)).to.be.eql({ w: 2, h: 5 })

    expect(Util.getDimensionsRotated(100, 100, 45)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 90)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 180)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 270)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 360)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 360 + 90)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 360 + 180)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 + 360 + 270)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 - 360)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 - 360 + 90)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 - 360 + 180)).to.be.eql({ w: 142, h: 142 })
    expect(Util.getDimensionsRotated(100, 100, 45 - 360 + 270)).to.be.eql({ w: 142, h: 142 })

    expect(Util.getDimensionsRotated(200, 100, 0)).to.be.eql({ w: 200, h: 100 })
    expect(Util.getDimensionsRotated(200, 100, 90)).to.be.eql({ w: 100, h: 200 })
    expect(Util.getDimensionsRotated(200, 100, 180)).to.be.eql({ w: 200, h: 100 })
    expect(Util.getDimensionsRotated(200, 100, 270)).to.be.eql({ w: 100, h: 200 })
    expect(Util.getDimensionsRotated(200, 100, 60)).to.be.eql({ w: 187, h: 224 })
    expect(Util.getDimensionsRotated(200, 100, -60)).to.be.eql({ w: 187, h: 224 })
    expect(Util.getDimensionsRotated(200, 100, 120)).to.be.eql({ w: 187, h: 224 })
    expect(Util.getDimensionsRotated(200, 100, -120)).to.be.eql({ w: 187, h: 224 })

    expect(Util.getDimensionsRotated(576, 448, 60)).to.be.eql({ w: 676, h: 723 })
  })
})

describe('Frontend - util.mjs - Datastructures', function () {
  it('equalsJSON()', function () {
    expect(Util.equalsJSON(undefined, undefined)).to.be.eql(true)

    expect(Util.equalsJSON(1, 1)).to.be.eql(true)
    expect(Util.equalsJSON(2, 1)).to.be.eql(false)
    expect(Util.equalsJSON(1, 2)).to.be.eql(false)

    expect(Util.equalsJSON([1, 2], [1, 2])).to.be.eql(true)
    expect(Util.equalsJSON([2, 1], [1, 2])).to.be.eql(false)
    expect(Util.equalsJSON([1, 2], [2, 1])).to.be.eql(false)
    expect(Util.equalsJSON(undefined, [])).to.be.eql(true)
    expect(Util.equalsJSON([], undefined)).to.be.eql(true)
    expect(Util.equalsJSON(null, [])).to.be.eql(true)
    expect(Util.equalsJSON([], null)).to.be.eql(true)
  })
})

describe('Frontend - util.mjs - Time', function () {
  it('recordTime()', function () {
    expect(Util.recordTime('stat1', 10)).to.be.eql([0, 10])
    expect(Util.recordTime('stat1', 11)).to.be.eql([0, 10, 11])
    expect(Util.recordTime('stat1', 12)).to.be.eql([0, 10, 11, 12])
    expect(Util.recordTime('stat1', 13)).to.be.eql([0, 10, 11, 12, 13])
    expect(Util.recordTime('stat1', 14)).to.be.eql([0, 10, 11, 12, 13, 14])
    expect(Util.recordTime('stat1', 15)).to.be.eql([0, 10, 11, 12, 13, 14, 15])
    expect(Util.recordTime('stat1', 16)).to.be.eql([0, 10, 11, 12, 13, 14, 15, 16])
    expect(Util.recordTime('stat1', 17)).to.be.eql([0, 10, 11, 12, 13, 14, 15, 16, 17])
    expect(Util.recordTime('stat1', 18)).to.be.eql([0, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(Util.recordTime('stat1', 19)).to.be.eql([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])

    expect(Util.recordTime('stat2', 20)).to.be.eql([0, 20])
    expect(Util.recordTime('stat2', 21)).to.be.eql([0, 20, 21])
    expect(Util.recordTime('stat2', 22)).to.be.eql([0, 20, 21, 22])
    expect(Util.recordTime('stat2', 23)).to.be.eql([0, 20, 21, 22, 23])
    expect(Util.recordTime('stat2', 24)).to.be.eql([0, 20, 21, 22, 23, 24])
    expect(Util.recordTime('stat2', 25)).to.be.eql([0, 20, 21, 22, 23, 24, 25])
    expect(Util.recordTime('stat2', 26)).to.be.eql([0, 20, 21, 22, 23, 24, 25, 26])
    expect(Util.recordTime('stat2', 27)).to.be.eql([0, 20, 21, 22, 23, 24, 25, 26, 27])
    expect(Util.recordTime('stat2', 28)).to.be.eql([0, 20, 21, 22, 23, 24, 25, 26, 27, 28])
    expect(Util.recordTime('stat2', 29)).to.be.eql([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])

    expect(Util.recordTime('stat1', 30)).to.be.eql([11, 12, 13, 14, 15, 16, 17, 18, 19, 30])
  })
})
