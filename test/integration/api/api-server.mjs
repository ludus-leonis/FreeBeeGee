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

import Test, { expect } from '../utils/test.mjs'

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 */
function testApiServerInfo (api) {
  Test.jsonGet(api, () => '/', body => {
    expect(body).to.be.an('object')
    expect(body).to.have.all.keys(['createPassword', 'freeRooms', 'ttl', 'version', 'defaultSnapshot', 'backgrounds', 'engine', 'root', 'snapshotUploads'])
    expect(body.createPassword).to.be.eql(true)
    expect(body.freeRooms).to.be.eql(32)
    expect(body.ttl).to.be.eql(48)
    expect(body.defaultSnapshot).to.be.eql('Tutorial')
    expect(body.engine).to.be.eql(Test.p.versionEngine)
    expect(body.root).to.be.eql('/api')
    expect(body.snapshotUploads).to.be.eql(true)
    expect(body.version).to.match(/^[0-9]+\.[0-9]+\.[0-9]+/)
    expect(body.backgrounds).to.be.an('array')
    expect(body.backgrounds.length).to.be.gte(5)
    expect(body.backgrounds[body.backgrounds.length - 1]).to.be.an('object')
    expect(body.backgrounds[body.backgrounds.length - 1].name).to.be.eql('Wood')
    expect(body.backgrounds[body.backgrounds.length - 1].color).to.be.eql('#524A43')
    expect(body.backgrounds[body.backgrounds.length - 1].scroller).to.be.eql('#3E3935')
    expect(body.backgrounds[body.backgrounds.length - 1].image).to.be.eql('img/desktop-wood.jpg')
  })
}

/**
 * @param {string} api API root path.
 */
function testApiSnapshots (api) {
  Test.jsonGet(api, () => '/snapshots/', body => {
    expect(body).to.be.an('array')
    expect(body.length).to.be.eql(4)
    for (const snapshot of body) {
      expect(snapshot.name).to.be.oneOf(['Classic', 'RPG', 'Hex', 'Tutorial'])
      expect(snapshot.system).to.be.eql(true)
    }
  })
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - server/system endpoints', function () {
    runner((api, version) => {
      describe('API Server-Info', () => testApiServerInfo(api))
      describe('API Snapshots', () => testApiSnapshots(api))
    })
  })
}
