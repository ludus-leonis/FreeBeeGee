/**
 * @copyright 2021-2022 Markus Leupold-Löwenthal
 *
 * @license This file is part of FreeBeeGee.
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

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  expect,
  runTests,
  testJsonGet
} from './utils/chai.mjs'

// -----------------------------------------------------------------------------

function testApiServerInfo (api) {
  testJsonGet(api, () => '/', body => {
    expect(body).to.be.an('object')
    expect(body.createPassword).to.be.eql(true)
    expect(body.freeRooms).to.be.eql(16)
    expect(body.ttl).to.be.eql(48)
    expect(body.version).to.match(/^[0-9]+\.[0-9]+\.[0-9]+/)
  })
}

function testApiTemplates (api) {
  testJsonGet(api, () => '/templates/', body => {
    expect(body).to.be.an('array')
    expect(body).to.include('RPG')
    expect(body).to.include('Classic')
  })
}

function testApiIssues (api, versionOK) {
  testJsonGet(api, () => '/issues/', body => {
    expect(body.phpOk).to.be.eql(versionOK)
    expect(body.moduleZip).to.be.eql(true)
  }, 200)
}

// --- the test runners --------------------------------------------------------

describe('API - server/system endpoints', function () {
  runTests((api, version) => {
    describe('API Server-Info', () => testApiServerInfo(api))
    describe('API Templates', () => testApiTemplates(api))
    describe('self diagnosis', () => testApiIssues(api, version !== '72'))
  })
})
