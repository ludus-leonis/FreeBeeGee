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

import { run as runAssets } from './tests/api-assets.mjs'
import { run as runCrud } from './tests/api-crud.mjs'
import { run as runDigests } from './tests/api-digests.mjs'
import { run as runPermissions } from './tests/api-permissions.mjs'
import { run as runPieces } from './tests/api-pieces.mjs'
import { run as runServer } from './tests/api-server.mjs'
import { run as runSnapshots } from './tests/api-snapshots.mjs'
import { run as runTables } from './tests/api-tables.mjs'
import { run as runTemplates } from './tests/api-templates.mjs'
import { run as runUploads } from './tests/api-uploads.mjs'

const runner = function (what) {
  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  const api = 'http://localhost:8765/api'

  describe('PHP 8.1', function () { what(api.replace(/localhost:8765/, 'play81.local'), '81', `${room}81`) })
}

runAssets(runner)
runCrud(runner)
runDigests(runner)
runPermissions(runner)
runPieces(runner)
runServer(runner)
runSnapshots(runner)
runTables(runner)
runTemplates(runner)
runUploads(runner)
