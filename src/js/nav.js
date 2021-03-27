/**
 * @file Manages the singe-page-app router.
 * @module
 * @copyright 2021 Markus Leupold-Löwenthal
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

import { runError } from './screens/error.js'
import { runJoin } from './screens/join.js'
import { runTable } from './screens/table'
import { stateSetServerInfo } from './state.js'
import { apiGetServerInfo } from './api.js'

/** Store a reference to the global Navigo object */
const router = new globalThis.Navigo('/', true)

document.onreadystatechange = function (event) {
  if (document.readyState === 'complete') { // time to setup our routes
    apiGetServerInfo()
      .then(info => {
        if (info.version !== '$VERSION$') {
          console.info('update', info.version, '$VERSION$')
          runError('UPDATE')
        } else {
          stateSetServerInfo(info)
          router
            .on({
              'table/:id': function (params) {
                runTable(params.id)
              },
              '*': function () {
                runJoin()
              }
            })
            .resolve()
        }
      })
      .catch(() => runError('UNKNOWN'))
  }
}
