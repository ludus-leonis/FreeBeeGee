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

// Mocha / Chai tests for UI/DOM tests. This is currently a non-working draft.

import { JSDOM } from 'jsdom'

import * as Test, { expect } from '../utils/test.mjs'

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

/**
 * @param {string} body HTML payload to inject fakefetch script.
 * @returns {string} Modified payload.
 */
function addFetch (body) {
  return body.replace('</body>', '<script>console.error(globalThis.fetch); globalThis.fetch = function () { console.log("fakefetch") }; console.error(globalThis.fetch)</script></body>')
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api Base URL to test against.
 */
function testHome (api) {
  Test.httpGet(api, '/', body => {
    const dom = new JSDOM(addFetch(body), {
      url: `${api}/`,
      referrer: api,
      contentType: 'text/html',
      includeNodeLocations: true,
      storageQuota: 1000000,
      resources: 'usable',
      runScripts: 'dangerously'
    })
    expect(dom.window.document.body.innerHTML).to.be.eql('x')
  })
}

// --- the test runners --------------------------------------------------------

/**
 * @param {string} api Base URL to test against.
 */
function run (api) {
  describe('UI', function () {
    describe('home renders', () => testHome(api))
  })
}
