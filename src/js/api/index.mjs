/**
 * @file All JSON/Rest calls FreeBeeGee needs.
 * @module
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

/* global FormData */

import Serverless from '../api/serverless.mjs'

// -----------------------------------------------------------------------------

const SERVERLESS = ('true' === '$SERVERLESS$')

/**
 * Error class when the API responds with an unexpected HTTP code.
 *
 * Not necessarily an 'error', just something the caller might like
 * to react on.
 */
export class UnexpectedStatus extends Error {
  constructor (status, payload = {}) {
    super('Got status ' + status)
    this.name = 'UnexpectedStatus'
    this.status = status
    this.body = payload
  }
}

// --- public endpoint calls ---------------------------------------------------

/**
 * API GET /
 *
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function getServerInfo () {
  return getJson([200], 'api/')
}

/**
 * API GET /snapshots/
 *
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function getSnapshots () {
  return getJson([200], 'api/snapshots/')
}

/**
 * API POST /rooms/:roomName/auth/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {object} auth Authentification data object (password).
 * @param {boolean} headers If true, replay with a header/payload object.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function postRoomAuth (roomName, auth, headers = false) {
  return postJson([200, 403, 404], `api/rooms/${roomName}/auth/`, auth, null, headers)
}

/**
 * API PATCH /rooms/:roomName/auth/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {object} patch Partial auth JSON/Object to send.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function patchRoomAuth (roomName, patch, token) {
  return patchJson([200], `api/rooms/${roomName}/auth/`, patch, token)
}

/**
 * API GET /rooms/:roomName/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {string} token API access token.
 * @param {boolean} headers If true, replay with a header/payload object.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function getRoom (roomName, token, headers = false) {
  return getJson([200, 400, 404], `api/rooms/${roomName}/`, token, headers)
}

/**
 * API GET /rooms/:roomName/digest/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function getRoomDigest (roomName, token) {
  return getJson([200], `api/rooms/${roomName}/digest/`, token)
}

/**
 * API POST /rooms/
 *
 * @param {object} room Room meta-JSON/Object to send.
 * @param {object} blob File input or null if no snapshot is to be uploaded.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function postRoom (room, blob, token) {
  const formData = new FormData()
  formData.append('name', room.name)
  if (room.snapshot) formData.append('snapshot', room.snapshot)
  if (room.auth) formData.append('auth', room.auth)
  if (room.password) formData.append('password', room.password)
  if (room.convert !== undefined) formData.append('convert', room.convert)
  if (blob) formData.append('blob', blob)

  return fetchOrThrow([201], 'api/rooms/', {
    method: 'POST',
    body: formData
  }, token)
}

/**
 * API DELETE /rooms/:roomName/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function deleteRoom (roomName, token) {
  return deleteJson([204], `api/rooms/${roomName}/`, token)
}

/**
 * API PATCH /rooms/:roomName/setup/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {object} patch Partial piece JSON/Object to send.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function patchSetup (roomName, patch, token) {
  return patchJson([200], `api/rooms/${roomName}/setup/`, patch, token)
}

/**
 * API GET /rooms/:roomName/tables/:tableId/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {string} token API access token.
 * @param {boolean} headers If true, replay with a header/payload object.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function getTable (roomName, tableId, token, headers = false) {
  return getJson([200], `api/rooms/${roomName}/tables/${tableId}/`, token, headers)
}

/**
 * API PUT /rooms/:roomName/tables/:tableId/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {object[]} table The new room table (array of pieces).
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function putTable (roomName, tableId, table, token) {
  return putJson([200], `api/rooms/${roomName}/tables/${tableId}/`, table, token)
}

/**
 * API PATCH /rooms/:roomName/tables/:tableId/pieces/:pieceId/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {string} pieceId Piece-ID (ID) of piece to patch.
 * @param {object} patch Partial piece JSON/Object to send.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function patchPiece (roomName, tableId, pieceId, patch, token) {
  return patchJson([200], `api/rooms/${roomName}/tables/${tableId}/pieces/${pieceId}/`, patch, token)
}

/**
 * API PATCH /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {object[]} patches Array of partial pieces to send.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function patchPieces (roomName, tableId, patches, token) {
  return patchJson([200], `api/rooms/${roomName}/tables/${tableId}/pieces/`, patches, token)
}

/**
 * API DELETE /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {string[]} pieceIds Piece-IDs (ID) of pieces to delete.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function deletePieces (roomName, tableId, pieceIds, token) {
  return deleteJson([204], `api/rooms/${roomName}/tables/${tableId}/pieces/`, token, false, pieceIds)
}

/**
 * API POST /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {object[]} pieces Pieces JSON/array to send.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function postPieces (roomName, tableId, pieces, token) {
  return postJson([201], `api/rooms/${roomName}/tables/${tableId}/pieces/`, pieces, token)
}

/**
 * API POST /rooms/:roomName/tables/:tableId/undo/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {number} tableId Number of table (0-9), 1 = normal.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function postUndo (roomName, tableId, token) {
  return postJson([204], `api/rooms/${roomName}/tables/${tableId}/undo/`, {}, token)
}

/**
 * API POST /rooms/:roomName/assets/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {object} asset Asset JSON/Object to send.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function postAsset (roomName, asset, token) {
  return postJson([201], `api/rooms/${roomName}/assets/`, asset, token)
}

/**
 * API PATCH /rooms/:roomName/assets/:assetID
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {object} patch of partial asset to send. ID field mandatory.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function patchAsset (roomName, patch, token) {
  return patchJson([200, 404, 409], `api/rooms/${roomName}/assets/${patch.id}/`, patch, token)
}

/**
 * API DELETE /rooms/:roomName/assets/:assetId/
 *
 * @param {string} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {object} assetId Asset ID to delete.
 * @param {string} token API access token.
 * @returns {Promise} Promise containing JSON/Object payload.
 */
export function deleteAsset (roomName, assetId, token) {
  return deleteJson([204], `api/rooms/${roomName}/assets/${assetId}/`, token)
}

/**
 * Helper method for unit tests to mock module calls.
 *
 * @param {number} mock A numeric mode for the mocking. 0 = off.
 */
export function setMock (mock) {
  mode = mock
}

// --- internal methods --------------------------------------------------------

let mode = 0 // mock mode for unit testing, 0 = off

/**
 * Wrap a JS fetch() for a JSON/Rest call with basic status and error handling
 *
 * @param {number} expectedStatus The HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {object} data Optional playload for request.
 * @param {boolean} headers If true, the HTTP headers will be added as '_headers'
 *                          to the JSON reply.
 * @returns {Promise} Promise of a JSON object.
 * @throws {UnexpectedStatus} In case of an HTTP that did not match the expected ones.
 */
function fetchOrThrow (expectedStatus, path, data = {}, headers = false) {
  if (SERVERLESS) return Serverless.fetchOrThrow(expectedStatus, path, data, headers) // for serverless mode
  if (mode === 1) return Promise.resolve({ expectedStatus, path, data, headers }) // for unit tests
  return globalThis.fetch(path, data)
    .then(response => {
      return response.text()
        .then(text => { // manually parse payload so we can handle parse errors
          try {
            if (response.status === 204) { // no-content
              return {}
            } else {
              return JSON.parse(text)
            }
          } catch (error) { // JSON parsing error
            throw new UnexpectedStatus(response.status, text)
          }
        })
        .then(json => {
          // we now have response code + json payload, but don't know yet if it
          // was an error
          if (expectedStatus.includes(response.status)) {
            if (headers) {
              return { status: response.status, headers: response.headers, body: json }
            }
            return json
          } else { // unexpected status code
            throw new UnexpectedStatus(response.status, json)
          }
        })
    })
}

/**
 * Do a GET JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {number} expectedStatus The HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {string} token API access token.
 * @param {boolean} headers If true, reply with a headers/payload object.
 * @returns {Promise} Promise of a JSON object.
 */
function getJson (expectedStatus, path, token, headers = false) {
  return fetchOrThrow(expectedStatus, path, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    }
  }, headers)
}

/**
 * Do a POST JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {number} expectedStatus The HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {object} data Optional playload for request.
 * @param {string} token API access token.
 * @param {boolean} headers If true, reply with a headers/payload object.
 * @returns {Promise} Promise of a JSON object.
 */
function postJson (expectedStatus, path, data, token, headers = false) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    }
  }, headers)
}

/**
 * Do a PUT JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {number} expectedStatus The HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {object} data Optional playload for request.
 * @param {string} token API access token.
 * @param {boolean} headers If true, reply with a headers/payload object.
 * @returns {Promise} Promise of a JSON object.
 */
function putJson (expectedStatus, path, data, token, headers = false) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    }
  }, headers)
}

/**
 * Do a PATCH JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {number} expectedStatus The HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {object} data Optional playload for request.
 * @param {string} token API access token.
 * @param {boolean} headers If true, reply with a headers/payload object.
 * @returns {Promise} Promise of a JSON object.
 */
function patchJson (expectedStatus, path, data, token, headers = false) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    }
  }, headers)
}

/**
 * Do a DELETE JSON/Rest request.
 *
 * Does implicit status/error checking.
 *
 * @param {number} expectedStatus The HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {string} token API access token.
 * @param {boolean} headers If true, reply with a headers/payload object.
 * @param {object} data Optional playload for request.
 * @returns {Promise} Promise of a JSON object. Usually empty.
 */
function deleteJson (expectedStatus, path, token, headers = false, data = undefined) {
  if (data) {
    return fetchOrThrow(expectedStatus, path, {
      method: 'DELETE',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      }
    }, headers)
  } else {
    return fetchOrThrow(expectedStatus, path, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      }
    }, headers)
  }
}
