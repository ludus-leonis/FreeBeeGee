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
  uuid,
  bytesToIso,
  hash,
  hoursToTimespan,
  toTitleCase,
  toCamelCase,
  prettyName,
  sortByNumber,
  sortByString,
  unCamelCase,
  unprettyName
} from '../../../src/js/lib/utils-text.mjs'

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

  it('hoursToTimespan()', function () {
    expect(hoursToTimespan(0)).to.be.eql('0 hours')
    expect(hoursToTimespan(1)).to.be.eql('1 hour')
    expect(hoursToTimespan(2)).to.be.eql('2 hours')
    expect(hoursToTimespan(95)).to.be.eql('95 hours')
    expect(hoursToTimespan(96)).to.be.eql('4 days')
    expect(hoursToTimespan(96, true)).to.be.eql('4 days')
    expect(hoursToTimespan(96, false)).to.be.eql('4 days')
    expect(hoursToTimespan(97)).to.be.eql('4 days')
    expect(hoursToTimespan(97, true)).to.be.eql('4 days')
    expect(hoursToTimespan(97, false)).to.be.eql('5 days')
    expect(hoursToTimespan(2400)).to.be.eql('100 days')
    expect(hoursToTimespan(2400, true)).to.be.eql('100 days')
    expect(hoursToTimespan(2400, false)).to.be.eql('100 days')
    expect(hoursToTimespan(2401)).to.be.eql('14 weeks')
    expect(hoursToTimespan(2401, true)).to.be.eql('14 weeks')
    expect(hoursToTimespan(2401, false)).to.be.eql('15 weeks')
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
