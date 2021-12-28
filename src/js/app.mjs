/**
 * @file Does all the browser/document setup & page routing.
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
} from './view/error/index.mjs'

import {
  runJoin
} from './view/join/index.mjs'

import {
  setServerInfo
} from './state/index.mjs'

import {
  apiGetServerInfo
} from './api/index.mjs'

/**
 * Reload the current page.
 */
export function navigateReload () {
  globalThis.location.reload()
}

/**
 * Go back to the start/join screen. Remember room name if possible.
 *
 * @param {?String} roomName Optional name of room to add in redirect.
 */
export function navigateToJoin (roomName) {
  if (roomName) {
    globalThis.location = './?room=' + roomName
  } else {
    globalThis.location = './'
  }
}

/**
 * Go back to a room screen.
 *
 * @param {String} roomName Name of room to go to.
 */
export function navigateToRoom (roomName) {
  globalThis.location = './' + roomName
}

/**
 * Main entry point for the app. Will route the page to the proper code.
 */
export function route () {
  apiGetServerInfo()
    .then(info => {
      if (info.version !== '$VERSION$') {
        console.info('update', info.version, '$VERSION$')
        runError('UPDATE')
      } else {
        setServerInfo(info)

        // run the corresponding screen/dialog
        const rootFolder = info.root.substr(0, info.root.length - '/api'.length)
        let path = window.location.pathname
        if (path[0] !== '/') path = '/' + path
        if (path === rootFolder || path === rootFolder + '/') {
          runJoin()
        } else if (path.endsWith('/')) {
          globalThis.location = path.substr(0, path.length - 1)
        } else {
          runJoin(path.replace(/^.*\//, ''))
        }
      }
    })
    .catch(error => runError('UNKNOWN', error))
}
