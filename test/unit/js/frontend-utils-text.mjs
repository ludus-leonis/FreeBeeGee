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

import * as Text from 'src/js/lib/util-text.mjs'

describe('Frontend - util-text.mjs', function () {
  it('uuid()', function () {
    expect(Text.uuid(0)).to.be.eql('00000000-0000-4000-8000-000000000000')
    expect(Text.uuid()).not.to.be.eql('00000000-0000-4000-8000-000000000000')
    const id1 = Text.uuid()
    const id2 = Text.uuid()
    expect(id1).not.to.be.eql(id2)
  })

  it('hash()', function () {
    expect(Text.hash('hello world')).to.be.eql(1794106052)
  })

  it('toTitleCase()', function () {
    expect(Text.toTitleCase('hello world')).to.be.eql('Hello World')
    expect(Text.toTitleCase('helloworld')).to.be.eql('Helloworld')
    expect(Text.toTitleCase(' h e l l o ')).to.be.eql(' H E L L O ')
    expect(Text.toTitleCase('hELLO wORLD')).to.be.eql('Hello World')
    expect(Text.toTitleCase('HELLO WORLD')).to.be.eql('Hello World')
    expect(Text.toTitleCase(' hello   world ')).to.be.eql(' Hello   World ')
    expect(Text.toTitleCase('hello.world')).to.be.eql('Hello.world')
  })

  it('toCamelCase()', function () {
    expect(Text.toCamelCase('hello world')).to.be.eql('helloWorld')
    expect(Text.toCamelCase('helloworld')).to.be.eql('helloworld')
    expect(Text.toCamelCase(' h e l l o ')).to.be.eql('HELLO')
    expect(Text.toCamelCase('hELLO wORLD')).to.be.eql('helloWorld')
    expect(Text.toCamelCase('HELLO WORLD')).to.be.eql('helloWorld')
    expect(Text.toCamelCase(' hello   world ')).to.be.eql('HelloWorld')
    expect(Text.toCamelCase('hello.world')).to.be.eql('helloWorld')
  })

  it('unCamelCase()', function () {
    expect(Text.unCamelCase('helloWorld')).to.be.eql('Hello World')
    expect(Text.unCamelCase('helloworld')).to.be.eql('Helloworld')
    expect(Text.unCamelCase('helloWorldWorld')).to.be.eql('Hello World World')
    expect(Text.unCamelCase('helloWorld World')).to.be.eql('Hello World World')
    expect(Text.unCamelCase(' hello World World ')).to.be.eql('Hello World World')
  })

  it('sortString()', function () {
    expect(Text.sortString([], 'none')).to.be.eql([])
    expect(Text.sortString([
      { id: 'one' },
      { id: 'two' },
      { id: 'three' }
    ], 'id')).to.be.eql([
      { id: 'one' },
      { id: 'three' },
      { id: 'two' }
    ])
  })

  it('sortNumber()', function () {
    expect(Text.sortNumber([], 'none')).to.be.eql([])
    expect(Text.sortNumber([
      { z: '15' },
      { z: '-4' },
      { z: '8' }
    ], 'z')).to.be.eql([
      { z: '-4' },
      { z: '8' },
      { z: '15' }
    ])
    expect(Text.sortNumber([
      { z: '15' },
      { z: '-4' },
      { }
    ], 'z', 0)).to.be.eql([
      { z: '-4' },
      { },
      { z: '15' }
    ])
    expect(Text.sortNumber([
      { z: '15' },
      { z: '-4' },
      { }
    ], 'z', -99999999999)).to.be.eql([
      { },
      { z: '-4' },
      { z: '15' }
    ])
    expect(Text.sortNumber([
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
    expect(Text.bytesToIso(0)).to.be.eql('0 bytes')
    expect(Text.bytesToIso(1)).to.be.eql('1 byte')
    expect(Text.bytesToIso(2)).to.be.eql('2 bytes')
    expect(Text.bytesToIso(1023)).to.be.eql('1023 bytes')
    expect(Text.bytesToIso(1024)).to.be.eql('1 kB')
    expect(Text.bytesToIso(1024 * 1024 - 1)).to.be.eql('1023 kB')
    expect(Text.bytesToIso(1024 * 1024)).to.be.eql('1 MB')
    expect(Text.bytesToIso(1024 * 1024 * 1024 - 1)).to.be.eql('1023 MB')
    expect(Text.bytesToIso(1024 * 1024 * 1024)).to.be.eql('1 GB')
  })

  it('hoursToTimespan()', function () {
    expect(Text.hoursToTimespan(0)).to.be.eql('0 hours')
    expect(Text.hoursToTimespan(1)).to.be.eql('1 hour')
    expect(Text.hoursToTimespan(2)).to.be.eql('2 hours')
    expect(Text.hoursToTimespan(95)).to.be.eql('95 hours')
    expect(Text.hoursToTimespan(96)).to.be.eql('4 days')
    expect(Text.hoursToTimespan(96, true)).to.be.eql('4 days')
    expect(Text.hoursToTimespan(96, false)).to.be.eql('4 days')
    expect(Text.hoursToTimespan(97)).to.be.eql('4 days')
    expect(Text.hoursToTimespan(97, true)).to.be.eql('4 days')
    expect(Text.hoursToTimespan(97, false)).to.be.eql('5 days')
    expect(Text.hoursToTimespan(2400)).to.be.eql('100 days')
    expect(Text.hoursToTimespan(2400, true)).to.be.eql('100 days')
    expect(Text.hoursToTimespan(2400, false)).to.be.eql('100 days')
    expect(Text.hoursToTimespan(2401)).to.be.eql('14 weeks')
    expect(Text.hoursToTimespan(2401, true)).to.be.eql('14 weeks')
    expect(Text.hoursToTimespan(2401, false)).to.be.eql('15 weeks')
  })

  it('prettyName()', function () {
    expect(Text.prettyName('dungeon')).to.be.eql('Dungeon')
    expect(Text.prettyName('dungeon.door')).to.be.eql('Dungeon, Door')
    expect(Text.prettyName('dungeon.ironDoor')).to.be.eql('Dungeon, Iron Door')
    expect(Text.prettyName(' dunGeon.ironDoor ')).to.be.eql('Dun Geon, Iron Door')

    expect(Text.prettyName('_.door')).to.be.eql('Door')
    expect(Text.prettyName('_.door', true)).to.be.eql('Door')
    expect(Text.prettyName('_.door', false)).to.be.eql('_, Door')
  })

  it('unprettyName()', function () {
    expect(Text.unprettyName('Dungeon')).to.be.eql('dungeon')
    expect(Text.unprettyName('Dungeon, ')).to.be.eql('dungeon')
    expect(Text.unprettyName('Dungeon, Door')).to.be.eql('dungeon.door')
    expect(Text.unprettyName('Dungeon, Iron Door')).to.be.eql('dungeon.ironDoor')
    expect(Text.unprettyName('  Dun  Geon ,  Iron  Door  ')).to.be.eql('dunGeon.ironDoor')

    expect(Text.unprettyName('_')).to.be.eql('_')
    expect(Text.unprettyName('_, ')).to.be.eql('_')
    expect(Text.unprettyName('_, Iron Door')).to.be.eql('_.ironDoor')
    expect(Text.unprettyName('  _  , Iron Door  ')).to.be.eql('_.ironDoor')
  })
})
