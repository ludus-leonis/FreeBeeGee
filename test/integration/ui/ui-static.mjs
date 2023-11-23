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

// Mocha / Chai tests for UI/DOM tests

import * as Test, { expect } from '../utils/test.mjs'

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api Base URL to test against.
 */
function testIndexExists (api) {
  Test.httpGet(api, '/', body => {
    expect(body).to.contain('If you are like us, you\'ll have a JavaScript-Blocker installed.')
  })
}

/**
 * @param {string} api Base URL to test against.
 */
function testPrivacyExists (api) {
  Test.httpGet(api, '/privacy', body => {
    expect(body).to.contain('This is the default privacy policy')
  })
}

/**
 * @param {string} api Base URL to test against.
 */
function testTermsExists (api) {
  Test.httpGet(api, '/terms', body => {
    expect(body).to.contain('This website runs a copy of')
  })
}

/**
 * @param {string} api Base URL to test against.
 */
function testToolsExists (api) {
  Test.httpGet(api, '/tools', body => {
    expect(body).to.contain('bcrypt tool')
  })
}

/**
 * @param {string} api Base URL to test against.
 */
function testNoVoid (api) {
  Test.httpGet(api, '/void', body => {
    expect(body).to.contain('404 Not Found')
  }, 404)
}

/**
 * @param {string} api Base URL to test against.
 */
function testNoSubdir (api) {
  Test.httpGet(api, '/xx/blueBird', body => {
    expect(body).to.contain('404 Not Found')
  }, 404)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {string} api Base URL to test against.
 */
function run (api) {
  describe('UI', function () {
    describe('index exists', () => testIndexExists(api))
    describe('privacy exists', () => testPrivacyExists(api))
    describe('terms exists', () => testTermsExists(api))
    describe('tools exists', () => testToolsExists(api))
    describe('void page does not exist', () => testNoVoid(api))
    describe('subdir does not exist', () => testNoSubdir(api))
  })
}
