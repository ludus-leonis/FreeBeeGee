/**
 * @file All JSON/Rest calls FreeBeeGee needs.
 * @module
 * @copyright 2021-2023 Markus Leupold-Löwenthal
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

/* global FormData */

import {
  demoFetchOrThrow
} from '../api/serverless.mjs'

// --- public endpoint calls ---------------------------------------------------

export const DEMO_MODE = ('true' === '$DEMOMODE$')

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

/**
 * API GET /
 *
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetServerInfo () {
  return getJson([200], 'api/')
}

/**
 * API GET /snapshots/
 *
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetSnapshots () {
  return getJson([200], 'api/snapshots/')
}

/**
 * API POST /rooms/:roomName/auth/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} auth Authentification data object (password).
 * @param {Boolean} headers If true, replay with a header/payload object.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostRoomAuth (roomName, auth, headers = false) {
  return postJson([200, 403, 404], `api/rooms/${roomName}/auth/`, auth, null, headers)
}

/**
 * API PATCH /rooms/:roomName/auth/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} patch Partial auth JSON/Object to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchRoomAuth (roomName, patch, token) {
  return patchJson([200], `api/rooms/${roomName}/auth/`, patch, token)
}

/**
 * API GET /rooms/:roomName/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {String} token API access token.
 * @param {Boolean} headers If true, replay with a header/payload object.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetRoom (roomName, token, headers = false) {
  return getJson([200, 400, 404], `api/rooms/${roomName}/`, token, headers)
}

/**
 * API GET /rooms/:roomName/digest/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetRoomDigest (roomName, token) {
  return getJson([200], `api/rooms/${roomName}/digest/`, token)
}

/**
 * API POST /rooms/
 *
 * @param {Object} room Room meta-JSON/Object to send.
 * @param {Object} blob File input or null if no snapshot is to be uploaded.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostRoom (room, blob, token) {
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
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiDeleteRoom (roomName, token) {
  return deleteJson([204], `api/rooms/${roomName}/`, token)
}

/**
 * API PATCH /rooms/:roomName/setup/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} patch Partial piece JSON/Object to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchSetup (roomName, patch, token) {
  return patchJson([200], `api/rooms/${roomName}/setup/`, patch, token)
}

/**
 * API GET /rooms/:roomName/tables/:tableId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {String} token API access token.
 * @param {Boolean} headers If true, replay with a header/payload object.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetTable (roomName, tableId, token, headers = false) {
  return getJson([200], `api/rooms/${roomName}/tables/${tableId}/`, token, headers)
}

/**
 * API PUT /rooms/:roomName/tables/:tableId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Array} table The new room table (array of pieces).
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPutTable (roomName, tableId, table, token) {
  return putJson([200], `api/rooms/${roomName}/tables/${tableId}/`, table, token)
}

/**
 * API HEAD /rooms/:roomName/tables/:tableId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiHeadTable (roomName, tableId, token) {
  return head(`api/rooms/${roomName}/tables/${tableId}/`, token)
}

/**
 * API PUT /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Object} piece Piece JSON/Object to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPutPiece (roomName, tableId, piece, token) {
  return putJson([200], `api/rooms/${roomName}/tables/${tableId}/pieces/${piece.id}/`, piece, token)
}

/**
 * API PATCH /rooms/:roomName/tables/:tableId/pieces/:pieceId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {String} pieceId Piece-ID (ID) of piece to patch.
 * @param {Object} patch Partial piece JSON/Object to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchPiece (roomName, tableId, pieceId, patch, token) {
  return patchJson([200], `api/rooms/${roomName}/tables/${tableId}/pieces/${pieceId}/`, patch, token)
}

/**
 * API PATCH /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Array} patches Array of partial pieces to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchPieces (roomName, tableId, patches, token) {
  return patchJson([200], `api/rooms/${roomName}/tables/${tableId}/pieces/`, patches, token)
}

/**
 * API DELETE /rooms/:roomName/tables/:tableId/pieces/:pieceId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {String} pieceId Piece-ID (ID) of piece to delete.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiDeletePiece (roomName, tableId, pieceId, token) {
  return deleteJson([204], `api/rooms/${roomName}/tables/${tableId}/pieces/${pieceId}/`, token)
}

/**
 * API POST /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Object} piece Piece JSON/Object to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostPiece (roomName, tableId, piece, token) {
  return postJson([201], `api/rooms/${roomName}/tables/${tableId}/pieces/`, piece, token)
}

/**
 * API POST /rooms/:roomName/assets/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} asset Asset JSON/Object to send.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostAsset (roomName, asset, token) {
  return postJson([201], `api/rooms/${roomName}/assets/`, asset, token)
}

/**
 * API PATCH /rooms/:roomName/assets/:assetID
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} patch of partial asset to send. ID field mandatory.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchAsset (roomName, patch, token) {
  return patchJson([200, 404, 409], `api/rooms/${roomName}/assets/${patch.id}/`, patch, token)
}

/**
 * API DELETE /rooms/:roomName/assets/:assetId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} assetId Asset ID to delete.
 * @param {String} token API access token.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiDeleteAsset (roomName, assetId, token) {
  return deleteJson([204], `api/rooms/${roomName}/assets/${assetId}/`, token)
}

/**
 * Helper method for unit tests to mock module calls.
 */
export function _setMock (value) {
  mock = value
}

// --- internal methods --------------------------------------------------------

let mock = 0 // mock mode for unit testing, 0 = off

/**
 * Wrap a JS fetch() for a JSON/Rest call with basic status and error handling
 *
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @param {Boolean} headers If true, the HTTP headers will be added as '_headers'
 *                          to the JSON reply.
 * @return {Promse} Promise of a JSON object.
 * @throws {UnexpectedStatus} In case of an HTTP that did not match the expected ones.
 */
function fetchOrThrow (expectedStatus, path, data = {}, headers = false) {
  if (DEMO_MODE) return demoFetchOrThrow(expectedStatus, path, data, headers) // for serverless mode
  if (mock === 1) return Promise.resolve({ expectedStatus, path, data, headers }) // for unit tests
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
        throw new UnexpectedStatus(response.status)
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
 * @param {String} token API access token.
 * @param {Boolean} headers If true, reply with a headers/payload object.
 * @return {Promse} Promise of a JSON object.
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
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @param {String} token API access token.
 * @param {Boolean} headers If true, reply with a headers/payload object.
 * @return {Promse} Promise of a JSON object.
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
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @param {String} token API access token.
 * @param {Boolean} headers If true, reply with a headers/payload object.
 * @return {Promse} Promise of a JSON object.
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
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Object} data Optional playload for request.
 * @param {String} token API access token.
 * @param {Boolean} headers If true, reply with a headers/payload object.
 * @return {Promse} Promise of a JSON object.
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
 * @param {Number} expectedStatus The HTTP status expected.
 * @param {String} path The URL to call. Can be relative.
 * @param {Boolean} headers If true, reply with a headers/payload object.
 * @param {String} token API access token.
 * @return {Promse} Promise of a JSON object. Usually empty.
 */
function deleteJson (expectedStatus, path, token, headers = false) {
  return fetchOrThrow(expectedStatus, path, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    }
  }, headers)
}
