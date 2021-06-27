/**
 * @file Does all the browser/document setup. Not to be included by others.
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

import {
  runError
} from './screens/error.mjs'
import {
  runJoin
} from './screens/join.mjs'
import {
  stateSetServerInfo
} from './server.mjs'
import {
  setTabActive
} from './screens/table/state.mjs'
import {
  apiGetServerInfo
} from './api.mjs'

// --- startup & page routing --------------------------------------------------

document.onreadystatechange = function (event) {
  if (document.readyState === 'complete') { // time to setup our routes
    apiGetServerInfo()
      .then(info => {
        if (info.version !== '$VERSION$') {
          console.info('update', info.version, '$VERSION$')
          runError('UPDATE')
        } else {
          stateSetServerInfo(info)

          // run the corresponding screen/dialog
          const rootFolder = info.root.substr(0, info.root.length - '/api'.length)
          let path = window.location.pathname
          if (path[0] !== '/') path = '/' + path
          if (path === rootFolder || path === rootFolder + '/') {
            runJoin()
          } else if (path.endsWith('/')) {
            document.location = path.substr(0, path.length - 1)
          } else {
            runJoin(path.replace(/^.*\//, ''))
          }
        }
      })
      .catch(error => runError('UNKNOWN', error))
  }
}

// --- browser/tab visibility --------------------------------------------------

document.addEventListener('visibilitychange', (visibilitychange) => {
  if (document.hidden) {
    setTabActive(false)
  } else {
    setTabActive(true)
  }
})
