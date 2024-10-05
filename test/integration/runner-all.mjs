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

import Assets from 'test/integration/api/api-assets.mjs'
import Crud from 'test/integration/api/api-crud.mjs'
import Digests from 'test/integration/api/api-digests.mjs'
import Permissions from 'test/integration/api/api-permissions.mjs'
import Pieces from 'test/integration/api/api-pieces.mjs'
import Server from 'test/integration/api/api-server.mjs'
import Snapshots from 'test/integration/api/api-snapshots.mjs'
import Tables from 'test/integration/api/api-tables.mjs'
import Templates from 'test/integration/api/api-templates.mjs'
import Uploads from 'test/integration/api/api-uploads.mjs'

const runner = function (what) {
  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  const api = 'http://localhost:8765/api'

  describe('PHP 7.2', function () { what(api.replace(/localhost:8765/, 'play72.localhost'), '72', `${room}72`) })
  describe('PHP 7.3', function () { what(api.replace(/localhost:8765/, 'play73.localhost'), '73', `${room}73`) })
  describe('PHP 7.4', function () { what(api.replace(/localhost:8765/, 'play74.localhost'), '74', `${room}74`) })
  describe('PHP 8.0', function () { what(api.replace(/localhost:8765/, 'play80.localhost'), '80', `${room}80`) })
  describe('PHP 8.1', function () { what(api.replace(/localhost:8765/, 'play81.localhost'), '81', `${room}81`) })
  describe('PHP 8.2', function () { what(api.replace(/localhost:8765/, 'play82.localhost'), '82', `${room}82`) })
  describe('PHP 8.3', function () { what(api.replace(/localhost:8765/, 'play83.localhost'), '83', `${room}83`) })
}

Assets.run(runner)
Crud.run(runner)
Digests.run(runner)
Permissions.run(runner)
Pieces.run(runner)
Server.run(runner)
Snapshots.run(runner)
Tables.run(runner)
Templates.run(runner)
Uploads.run(runner)
