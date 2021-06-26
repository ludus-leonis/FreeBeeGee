/**
 * @copyright 2021 Markus Leupold-Löwenthal
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
  clamp,
  hash,
  recordTime,
  splitAsset,
  toCamelCase,
  toTitleCase,
  intersect,
  uuid
} from '../src/js/utils.mjs'

describe('Frontend - utils.mjs', function () {
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

  it('splitAsset()', function () {
    const a1 = splitAsset('door.1x2x3.jpg')
    expect(a1.alias).to.be.eql('door')
    expect(a1.w).to.be.eql(1)
    expect(a1.h).to.be.eql(2)
    expect(a1.side).to.be.eql(3)
    expect(a1.color).to.be.eql('808080')

    const b1 = splitAsset('door.1x2x3.123456.jpg')
    expect(b1.alias).to.be.eql('door')
    expect(b1.w).to.be.eql(1)
    expect(b1.h).to.be.eql(2)
    expect(b1.side).to.be.eql(3)
    expect(b1.color).to.be.eql('123456')

    const a2 = splitAsset('dungeon.doorOpen.3x2x1.png')
    expect(a2.alias).to.be.eql('dungeon.doorOpen')
    expect(a2.w).to.be.eql(3)
    expect(a2.h).to.be.eql(2)
    expect(a2.side).to.be.eql(1)
    expect(a2.color).to.be.eql('808080')

    const b2 = splitAsset('dungeon.doorOpen.3x2x1.transparent.png')
    expect(b2.alias).to.be.eql('dungeon.doorOpen')
    expect(b2.w).to.be.eql(3)
    expect(b2.h).to.be.eql(2)
    expect(b2.side).to.be.eql(1)
    expect(b2.color).to.be.eql('transparent')

    const c1 = splitAsset('tile.svg')
    expect(c1.alias).to.be.eql('tile')
    expect(c1.w).to.be.eql(1)
    expect(c1.h).to.be.eql(1)
    expect(c1.side).to.be.eql(1)
    expect(c1.color).to.be.eql('808080')

    const a0 = splitAsset('invalid')
    expect(a0.alias).to.be.eql('unknown')
    expect(a0.w).to.be.eql(1)
    expect(a0.h).to.be.eql(1)
    expect(a0.side).to.be.eql(1)
    expect(a0.color).to.be.eql('808080')
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
})
