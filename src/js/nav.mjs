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

// --- public ------------------------------------------------------------------

/**
 * Reload the current page.
 */
export function navigateReload () {
  globalThis.location.reload()
}

/**
 * Go back to the start/join screen. Remember table name if possible.
 *
 * @param {?String} tableName Optional name of table to add in redirect.
 */
export function navigateToJoin (tableName) {
  if (tableName) {
    globalThis.location = './?table=' + tableName
  } else {
    globalThis.location = './'
  }
}

/**
 * Go back to a table screen.
 *
 * @param {String} tableName Name of table to go to.
 */
export function navigateToTable (tableName) {
  globalThis.location = './' + tableName
}
