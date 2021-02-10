/**
 * @file All JSON/Rest calls FreeBeeGee needs.
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

// --- public endpoint calls ---------------------------------------------------

/**
 * API GET /
 *
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetServerInfo () {
  return getJson([200], 'api/')
}

/**
 * API GET /templates/
 *
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetTemplates () {
  return getJson([200], 'api/templates/')
}

/**
 * API GET /games/:gameName/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetGame (gameName) {
  return getJson([200], 'api/games/' + gameName + '/')
}

/**
 * API POST /games/
 *
 * @param {Object} game Game meta-JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostGame (game) {
  return postJson([201], 'api/games/', game) // 409 = existing game
}

/**
 * API GET /games/:gameName/state/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetState (gameName) {
  return getJson([200], 'api/games/' + gameName + '/state/')
}

/**
 * API HEAD /games/:gameName/state/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiHeadState (gameName) {
  return head('api/games/' + gameName + '/state/')
}

/**
 * API GET /games/:gameName/library/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetLibrary (gameName) {
  return getJson([200], 'api/games/' + gameName + '/library/')
}

/**
 * API PUT /games/:gameName/pieces/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @param {Object} piece Piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPutPiece (gameName, piece) {
  return putJson([200], 'api/games/' + gameName + '/pieces/' + piece.id + '/', piece)
}

/**
 * API PATCH /games/:gameName/pieces/:pieceId/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @param {String} pieceId Piece-ID (UUID) of piece to patch.
 * @param {Object} patch Partial piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchPiece (gameName, pieceId, patch) {
  return patchJson([200], 'api/games/' + gameName + '/pieces/' + pieceId + '/', patch)
}

/**
 * API DELETE /games/:gameName/pieces/:pieceId/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @param {String} pieceId Piece-ID (UUID) of piece to delete.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiDeletePiece (gameName, pieceId) {
  return deleteJson([204], 'api/games/' + gameName + '/pieces/' + pieceId + '/')
}

/**
 * API POST /games/:gameName/pieces/
 *
 * @param {String} gameName Name of game, e.g. 'funnyLovingWhale'.
 * @param {Object} piece Piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostPiece (gameName, piece) {
  return postJson([201], 'api/games/' + gameName + '/pieces/', piece)
}

// --- internal methods --------------------------------------------------------

/**
 * Wrap a JS fetch() for a JSON/Rest call with basic status and error handling
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @return {Promse} Promise of a JSON object.
 */
function fetchOrThrow (expectedStatus, path, data = null) {
  return globalThis.fetch(path, data)
    .then(response => {
      if (expectedStatus.includes(response.status)) {
        if (response.status === 204) { // no content
          return {}
        } else {
          return response.json()
        }
      } else {
        throw new Error('unexpected status: ' + response.status)
      }
    })
}

/**
 * Do a HEAD JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {String} path The URL to call. Can be relative.
 * @return {Promse} Promise of Headers object.
 */
function head (path) {
  return globalThis.fetch(path, {
    method: 'HEAD',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (response.status === 200) {
        return response.headers
      } else {
        throw new Error('unexpected status: ' + response.status)
      }
    })
}

/**
 * Do a GET JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @return {Promse} Promise of a JSON object.
 */
function getJson (expectedStatus, path) {
  return fetchOrThrow(expectedStatus, path)
}

/**
 * Do a POST JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @return {Promse} Promise of a JSON object.
 */
function postJson (expectedStatus, path, data) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Do a PUT JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @return {Promse} Promise of a JSON object.
 */
function putJson (expectedStatus, path, data) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Do a PATCH JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @return {Promse} Promise of a JSON object.
 */
function patchJson (expectedStatus, path, data) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Do a DELETE JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @return {Promse} Promise of a JSON object. Usually empty.
 */
function deleteJson (expectedStatus, path) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
