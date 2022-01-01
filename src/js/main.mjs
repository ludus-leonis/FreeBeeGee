/**
 * @file Bootstrap our app.
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
  route
} from './app.mjs'

import {
  setTabActive
} from './state/index.mjs'

// --- startup & page routing --------------------------------------------------

document.onreadystatechange = function (event) {
  if (document.readyState === 'complete') { // time to setup our routes
    route()
  }
}

document.addEventListener('visibilitychange', (visibilitychange) => {
  if (globalThis.hidden) {
    setTabActive(false)
  } else {
    setTabActive(true)
  }
})
