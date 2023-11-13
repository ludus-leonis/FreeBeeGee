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

/* global describe, it, afterEach */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import fs from 'fs'

import Test, { expect } from '../utils/test.mjs'

// -----------------------------------------------------------------------------

export default {
  run
}

// -----------------------------------------------------------------------------

const FBGdir = 'dist/FreeBeeGee/'

/**
 * @param {string} api API root path.
 * @param {boolean} versionOK True for supported PHP versons.
 */
function testApiIssues (api, versionOK) {
  Test.jsonGet(api, () => '/issues/', body => {
    expect(body.phpOk).to.be.eql(versionOK)
    expect(body.moduleZip).to.be.eql(true)
  }, 200)
}

/**
 * @param {string} root The FBG home path.
 */
async function testNoHtaccess (root) {
  fs.renameSync(`${FBGdir}.htaccess`, `${FBGdir}.htaccess.bak`)

  // shows the fallback/help index.html
  await Test.fetchAndTest(root, body => {
    expect(body).to.contain('Unfortunately, this webserver can\'t run FreeBeeGee (yet).')
  })
}

/**
 * @param {string} api API path.
 * @param {string} root The FBG home path.
 */
async function testInvalidHtaccess (api, root) {
  fs.renameSync(`${FBGdir}.htaccess`, `${FBGdir}.htaccess.bak`)
  fs.writeFileSync(`${FBGdir}.htaccess`, 'syntax error in htaccess')

  // shows the apache 500 page
  await Test.fetchAndTest(root, body => {
    expect(body).to.contain('Internal Server Error')
  }, 500)
}

/**
 * @param {string} root The FBG home path.
 */
async function testNoModRewrite (root) {
  fs.renameSync(`${FBGdir}.htaccess`, `${FBGdir}.htaccess.bak`)
  fs.writeFileSync(`${FBGdir}.htaccess`, '')

  await Test.fetchAndTest(root, body => {
    expect(body).to.contain('Unfortunately, this webserver can\'t run FreeBeeGee (yet).')
  })
}

// -----------------------------------------------------------------------------

/**
 * @param {string} root The FBG home path.
 * @returns {Promise} Promise of completion of test.
 */
function testNoJs (root) {
  return Test.fetchAndTest(root, body => {
    expect(body).to.contain('JavaScript required')
  }, 200, false)
}

/**
 * @param {string} root The FBG home path.
 * @returns {Promise} Promise of completion of test.
 */
async function testDefaultPassword (root) {
  fs.renameSync(`${FBGdir}api/data/server.json`, `${FBGdir}api/data/server.json.bak`)

  await Test.fetchAndTest(root, body => {
    expect(body).to.contain('you\'ll have to set an admin password')
  })
}

/**
 * @param {string} root The FBG home path.
 * @returns {Promise} Promise of completion of test.
 */
async function testUpdateAvailable (root) {
  fs.renameSync(`${FBGdir}api/FreeBeeGeeAPI.php`, `${FBGdir}api/FreeBeeGeeAPI.php.bak`)
  const fbg = fs.readFileSync(`${FBGdir}api/FreeBeeGeeAPI.php.bak`, { encoding: 'utf8', flag: 'r' })
  fs.writeFileSync(`${FBGdir}api/FreeBeeGeeAPI.php`, fbg.replaceAll(Test.p.version, '2.3.4'))

  await Test.fetchAndTest(root, body => {
    expect(body).to.contain('Update available')
  })
}

/**
 * @param {string} root The FBG home path.
 * @returns {Promise} Promise of completion of test.
 */
function testReady (root) {
  return Test.fetchAndTest(root, body => {
    expect(body).to.contain('no spaces or funky letters')
  })
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
function run (runner) {
  describe('API - install', function () {
    afterEach(function () {
      for (const path of [
        `${FBGdir}api/FreeBeeGeeAPI.php`,
        `${FBGdir}api/data/server.json`,
        `${FBGdir}.htaccess`
      ]) {
        if (fs.existsSync(`${path}.bak`)) {
          if (fs.existsSync(path)) fs.unlinkSync(path)
          fs.renameSync(`${path}.bak`, path)
        }
      }
    })

    runner((api, version) => {
      const root = api.replace(/api\/?/, '')
      describe('self diagnosis', () => testApiIssues(api, ['74', '80', '81', '82', '83'].includes(version)))

      it('no .htaccess', () => testNoHtaccess(root))
      it('invalid .htaccess', () => testInvalidHtaccess(api, root))
      it('no mod_rewrite', () => testNoModRewrite(root))
      it('no JavaScript', () => testNoJs(root))
      it('default password', () => testDefaultPassword(root))
      it('update available', () => testUpdateAvailable(root))
      it('ready', () => testReady(root))
    })
  })
}
