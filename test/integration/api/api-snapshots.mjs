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
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

/* global describe */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  p,
  expect,
  zipCreate,
  zipToc,
  testGetBuffer,
  testZIPUpload,
  testJsonGet,
  openTestroom,
  closeTestroom
} from '../utils/chai.mjs'

import dateformat from 'dateformat'

/**
 * Calculate daylight standard time aware offset of CET/CEST timezone vs GMT.
 *
 * @returns {number} Offset in minutes.
 */
function dstOffset () { // return 60/120 depending if DST is off or on
  const now = new Date()
  return Math.max(
    new Date(now.getFullYear(), 0, 1).getTimezoneOffset(),
    new Date(now.getFullYear(), 6, 1).getTimezoneOffset()
  ) !== now.getTimezoneOffset()
    ? 120
    : 60
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotClassic (api, room) {
  openTestroom(api, room, 'Classic')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=${dstOffset()}`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('setup.json')
    expect(entries).to.contain('tables/1.json')
    expect(entries).to.contain('assets/token/chess.bishop.1x1x1.0.wood.svg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  testGetBuffer(api, () => `/rooms/${room}/snapshot/`, headers => {
    const now = new Date()
    now.setHours(now.getHours() - dstOffset() / 60)
    const date = dateformat(now, 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {}, 200)

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=${dstOffset() + 60}`, headers => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const date = dateformat(now, 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {}, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotRPG (api, room) {
  openTestroom(api, room, 'RPG')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=${dstOffset()}`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('setup.json')
    expect(entries).to.contain('tables/1.json')
    expect(entries).to.contain('assets/tile/room.4x4.4x4x1.808674.paper.jpg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotHex (api, room) {
  openTestroom(api, room, 'Hex')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=${dstOffset()}`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('setup.json')
    expect(entries).to.contain('tables/1.json')
    expect(entries).to.contain('assets/tile/map.B.6x4x1.1.paper.svg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotTutorial (api, room) {
  openTestroom(api, room, 'Tutorial')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=${dstOffset()}`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(225)
    expect(entries.length).to.be.lte(275)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('setup.json')
    expect(entries).to.contain('tables/6.json')
    expect(entries).to.contain('assets/token/orc.1x1.6.wood.svg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotUpload (api, room) {
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('LICENSE.md', Buffer.from('you may'))
    }),
    body => {
      expect(body).to.be.an('object')
      expect(body.credits).to.be.eql('you may')
    }, 201)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotVersions (api, room) {
  const v = p.versionEngine.split('.')
  v[0] = Number.parseInt(v[0])
  v[1] = Number.parseInt(v[1])
  v[2] = Number.parseInt(v[2])

  // snapshot matches current version
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.0"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)

  // snapshot matches same patch - ok
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.${v[2]}"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)

  // snapshot matches older patch -> ok
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.${v[2] - 1}"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)

  // snapshot requires newer patch -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.${v[2] + 1}"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from a newer engine (major) -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0] + 1}.${v[1]}.0"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from an older engine (major) -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0] - 1}.${v[1]}.0"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from a newer engine (minor) -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1] + 1}.0"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from an older engine (minor) -> ok
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('setup.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1] - 1}.0"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * Create a random 'compressed' file/blob as if it would have a 0.825
 * compression ratio.
 *
 * @param {number} mb MB to create.
 * @returns {string} Random string of mb * 0.825 length.
 */
function blob (mb) {
  const chars = [...Array(256)].map((s, i) => String.fromCharCode(i))
  const result = []
  for (let i = 0; i < mb * 0.825 * 1024 * 1024; i++) { // 0.825 is the compression ratio
    const rnd = Math.floor(Math.random() * 256)
    result.push(chars[rnd])
  }
  return result.join('')
}

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSnapshotSize (api, room) {
  const b = blob(1)

  // 33MB - size exceeds php but not webserver
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      for (let i = 0; i < 33; i++) {
        zip.addFile(`blob${i}.bin`, Buffer.from(b))
      }
      zip.addFile('LICENSE.md', Buffer.from('you may'))
    }),
    body => {
      expect(body._error).to.be.eql('PHP_SIZE')
    }, 400)

  // 65MB - size exceeds webserver
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      for (let i = 0; i < 65; i++) {
        zip.addFile(`blob${i}.bin`, Buffer.from(b))
      }
      zip.addFile('LICENSE.md', Buffer.from('you may'))
    }),
    body => {
      expect(body).to.be.eql({})
    }, 413, false)

  // 15MB - too large, as system assets are too much
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      for (let i = 0; i < 15; i++) {
        zip.addFile(`blob${i}.bin`, Buffer.from(b))
      }
      zip.addFile('LICENSE.md', Buffer.from('you may'))
    }),
    body => {
      expect(body._error).to.be.eql('ROOM_SIZE')
    }, 400)

  // 14MB - barely ok including system assets
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      for (let i = 0; i < 14; i++) {
        zip.addFile(`blob${i}.bin`, Buffer.from(b))
      }
      zip.addFile('LICENSE.md', Buffer.from('you may'))
    }),
    body => {
      expect(body).to.be.an('object')
      expect(body.credits).to.be.eql('you may')
    }, 201)

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
export function run (runner) {
  describe('API - snapshots', function () {
    runner((api, version, room) => {
      describe('Classic', () => testApiSnapshotClassic(api, room))
      describe('RPG', () => testApiSnapshotRPG(api, room))
      describe('Hex', () => testApiSnapshotHex(api, room))
      describe('Tutorial', () => testApiSnapshotTutorial(api, room))
      describe('upload', () => testApiSnapshotUpload(api, room))
      describe('versions', () => testApiSnapshotVersions(api, room))
      describe('size', () => testApiSnapshotSize(api, room))
    })
  })
}
