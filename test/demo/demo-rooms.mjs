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
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai 'test' to generate static files for the demo version

import * as Test from 'test/integration/utils/test.mjs'

import * as fs from 'fs'

/**
 * Run a test against a given API.
 *
 * @param {Function} what Test function to run.
 */
function runner (what) {
  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  const api = 'http://play81.localhost/api'

  describe('PHP 8.1', function () { what(api, '81', `${room}81`) })
}

// -----------------------------------------------------------------------------

/**
 * Generate RPG snapshot files.
 *
 * @param {string} api API to fetch real files from.
 */
function testGenerateRPG (api) {
  Test.jsonPost(api, () => '/rooms/', () => {
    return {
      name: 'demoroomrpg',
      snapshot: 'RPG',
      auth: 'apitests'
    }
  }, body => {
    const json = fs.readFileSync('dist/FreeBeeGee/api/data/rooms/demoroomrpg/room.json').toString()
    fs.writeFile('src/misc/demo/snapshots/RPG/room.json', JSON.stringify(JSON.parse(json), null, 1), (err) => {
      if (err) throw err
    })
  }, 201)
}

/**
 * Generate hex snapshot files.
 *
 * @param {string} api API to fetch real files from.
 */
function testGenerateHex (api) {
  Test.jsonPost(api, () => '/rooms/', () => {
    return {
      name: 'demoroomhex',
      snapshot: 'Hex',
      auth: 'apitests'
    }
  }, body => {
    const json = fs.readFileSync('dist/FreeBeeGee/api/data/rooms/demoroomhex/room.json').toString()
    fs.writeFile('src/misc/demo/snapshots/Hex/room.json', JSON.stringify(JSON.parse(json), null, 1), (err) => {
      if (err) throw err
    })
  }, 201)
}

/**
 * Generate classic snapshot files.
 *
 * @param {string} api API to fetch real files from.
 */
function testGenerateClassic (api) {
  Test.jsonPost(api, () => '/rooms/', () => {
    return {
      name: 'demoroomclassic',
      snapshot: 'Classic',
      auth: 'apitests'
    }
  }, body => {
    const json = fs.readFileSync('dist/FreeBeeGee/api/data/rooms/demoroomclassic/room.json').toString()
    fs.writeFile('src/misc/demo/snapshots/Classic/room.json', JSON.stringify(JSON.parse(json), null, 1), (err) => {
      if (err) throw err
    })
  }, 201)
}

/**
 * Generate tutorial snapshot files.
 *
 * @param {string} api API to fetch real files from.
 */
function testGenerateTutorial (api) {
  Test.jsonPost(api, () => '/rooms/', () => {
    return {
      name: 'demoroomtutorial',
      snapshot: 'Tutorial',
      auth: 'apitests'
    }
  }, body => {
    const json = fs.readFileSync('dist/FreeBeeGee/api/data/rooms/demoroomtutorial/room.json').toString()
    fs.writeFile('src/misc/demo/snapshots/Tutorial/room.json', JSON.stringify(JSON.parse(json), null, 1), (err) => {
      if (err) throw err
    })
  }, 201)
}

// --- the test runners --------------------------------------------------------

describe('generate snapshots', function () {
  runner((api, version) => {
    describe('snapshot RPG', () => testGenerateRPG(api))
    describe('snapshot Hex', () => testGenerateHex(api))
    describe('snapshot Classic', () => testGenerateClassic(api))
    describe('snapshot Tutorial', () => testGenerateTutorial(api))
  })
})
