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

// Tests the default release docker image.
// We can only run those tests that work with a default server.json here.
// So e.g. no snapshot/uploads, as they are off per default.

import { run as runAssets } from './api/api-assets.mjs'
import { run as runCrud } from './api/api-crud.mjs'
import { run as runDigests } from './api/api-digests.mjs'
import { run as runPermissions } from './api/api-permissions.mjs'
import { run as runPieces } from './api/api-pieces.mjs'
import { run as runServer } from './api/api-server-release.mjs'
// import { run as runSnapshots } from './api/api-snapshots.mjs'
import { run as runTables } from './api/api-tables.mjs'
import { run as runTemplates } from './api/api-templates.mjs'
// import { run as runUploads } from './api/api-uploads.mjs'

const runner = function (what) {
  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  const api = 'http://localhost:8765/api'

  describe('PHP 8.2', function () { what(api, '82', `${room}82`) })
}

runAssets(runner)
runCrud(runner)
runDigests(runner)
runPermissions(runner)
runPieces(runner)
runServer(runner)
// runSnapshots(runner)
runTables(runner)
runTemplates(runner)
// runUploads(runner)
