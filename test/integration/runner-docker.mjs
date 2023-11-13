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

import Assets from './api/api-assets.mjs'
import Crud from './api/api-crud.mjs'
import Digests from './api/api-digests.mjs'
import Permissions from './api/api-permissions.mjs'
import Pieces from './api/api-pieces.mjs'
import Server from './api/api-server-release.mjs'
// import Snapshots from './api/api-snapshots.mjs'
import Tables from './api/api-tables.mjs'
import Templates from './api/api-templates.mjs'
// import Uploads from './api/api-uploads.mjs'

const runner = function (what) {
  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  const api = 'http://localhost:8765/api'

  describe('PHP 8.2', function () { what(api, '82', `${room}82`) })
}

Assets.run(runner)
Crud.run(runner)
Digests.run(runner)
Permissions.run(runner)
Pieces.run(runner)
Server.run(runner)
// Snapshots.run(runner)
Tables.run(runner)
Templates.run(runner)
// Uploads.run(runner)
