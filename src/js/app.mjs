/**
 * @file Does all the browser/document setup & page routing.
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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

import * as Api from 'src/js/api/index.mjs'
import * as Error from 'src/js/view/error.mjs'
import * as Room from 'src/js/view/room/index.mjs'
import * as State from 'src/js/state/index.mjs'
import * as Tools from 'src/js/view/tools.mjs'
import * as ViewCreate from 'src/js/view/create.mjs'
import * as ViewInstaller from 'src/js/view/installer.mjs'
import * as ViewJoin from 'src/js/view/join.mjs'
import * as ViewPassword from 'src/js/view/password.mjs'

// --- startup & page routing --------------------------------------------------

if (typeof document !== 'undefined') { // don't run in non-browser (test) environments
  document.onreadystatechange = function (event) {
    if (document.readyState === 'complete') {
      if (document.getElementById('tool-bcrypt')) {
        return Tools.setupBcrypt()
      }

      // time to setup our routes
      route()
    }
  }

  document.addEventListener('visibilitychange', (visibilitychange) => {
    if (globalThis.hidden) {
      State.setTabActive(false)
    } else {
      State.setTabActive(true)
    }
  })
}

// -----------------------------------------------------------------------------
/**
 * Reload the current page.
 */
export function reload () {
  globalThis.location.reload()
}

/**
 * Go back to the start/join screen. Remember room name if possible.
 *
 * @param {?string} roomName Optional name of room to add in redirect.
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
 * @param {string} roomName Name of room to go to.
 */
export function navigateToRoom (roomName) {
  goto('./' + roomName)
}

/**
 * Faceless, transparent authentication.
 *
 * If ok, it continues to the room/table. If it fails, it displays the necessary
 * screen.
 *
 * @param {string} roomName Room name (user input).
 * @param {string} password Password (user input).
 */
export function auth (roomName, password) {
  // try to login
  Api.postRoomAuth(roomName, {
    password
  }, true)
    .then((auth) => {
      if (auth.status === 200) {
        Room.runRoom(roomName, auth.body.token)
      } else if (auth.status === 403) {
        ViewPassword.show(roomName, password === undefined)
      } else if (auth.status === 404) {
        ViewCreate.show(roomName)
      } else {
        Error.runError()
      }
    })
    .catch(error => Error.apiError(error, roomName))
}

/**
 * Main entry point for the app. Will route the page to the proper code.
 */
export function route () {
  Api.getServerInfo()
    .then(info => {
      State.setServerInfo(info)

      if (info.version !== '$VERSION$') {
        console.info('update', info.version, '$VERSION$')
        Error.runError('UPDATE')
      } else if (info.install ?? 0 > 1) {
        ViewInstaller.show(info.install)
      } else {
        // run the corresponding screen/dialog
        const rootFolder = info.root.substr(0, info.root.length - '/api'.length)
        let path = window.location.pathname
        if (path[0] !== '/') path = '/' + path
        if (path === rootFolder || path === rootFolder + '/') {
          ViewJoin.show()
        } else if (path.endsWith('/')) {
          globalThis.location = path.substr(0, path.length - 1)
        } else {
          auth(path.replace(/^.*\//, ''))
        }
      }
    })
    .catch(error => Error.apiError(error))
}

/**
 * Go to another url via browser's location.
 *
 * Will delay execution slightly to not mess up logging output order.
 *
 * @param {string} url Redirect target.
 */
export function goto (url) {
  setTimeout(() => {
    globalThis.location = url
  }, 10)
}
