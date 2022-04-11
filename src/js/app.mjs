/**
 * @file Does all the browser/document setup & page routing.
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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
  runError,
  apiError
} from './view/error/index.mjs'

import {
  createRoomView
} from './view/create/index.mjs'

import {
  passwordView
} from './view/password/index.mjs'

import {
  runRoom
} from './view/room/index.mjs'

import {
  runJoin
} from './view/join/index.mjs'

import {
  setServerInfo
} from './state/index.mjs'

import {
  apiGetServerInfo,
  apiPostRoomAuth
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
    goto('./?room=' + roomName)
  } else {
    goto(globalThis.location = './')
  }
}

/**
 * Go back to a room screen.
 *
 * @param {String} roomName Name of room to go to.
 */
export function navigateToRoom (roomName) {
  goto('./' + roomName)
}

/**
 * Faceless, transparent authentication.
 *
 * If ok, it continues to the room/table. If it fails, it displays the necessary
 * screen.
 */
export function auth (roomName, password) {
  // try to login
  apiPostRoomAuth(roomName, {
    password
  }, true)
    .then((auth) => {
      if (auth.status === 200) {
        runRoom(roomName, auth.body.token)
      } else if (auth.status === 403) {
        passwordView(roomName)
      } else if (auth.status === 404) {
        createRoomView(roomName)
      } else {
        runError()
      }
    })
    .catch(error => apiError(error, roomName))
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
          auth(path.replace(/^.*\//, ''))
        }
      }
    })
    .catch(error => apiError(error))
}

/**
 * Go to another url via browser's location.
 *
 * Will delay execution slightly to not mess up logging output order.
 */
function goto (url) {
  setTimeout(() => {
    globalThis.location = url
  }, 10)
}
