/**
 * @file All JSON/Rest calls FreeBeeGee needs.
 * @module
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

/* global FormData */

import {
  demoFetchOrThrow
} from '../api/serverless.mjs'

// --- public endpoint calls ---------------------------------------------------

export const DEMO_MODE = ('true' === '$DEMOMODE$')

/**
 * Error class when the API responds with an unexpected HTTP code.
 *
 * Not necessarily an 'error', just something unexpected the caller might like
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
 * API GET /templates/
 *
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetTemplates () {
  return getJson([200], 'api/templates/')
}

/**
 * API GET /rooms/:roomName/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Boolean} headers If true, replay with a header/payload object.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetRoom (roomName, headers = false) {
  return getJson([200, 404], 'api/rooms/' + roomName + '/', headers)
}

/**
 * API GET /rooms/:roomName/digest/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetRoomDigest (roomName) {
  return getJson([200], 'api/rooms/' + roomName + '/digest/')
}

/**
 * API POST /rooms/
 *
 * @param {Object} room Room meta-JSON/Object to send.
 * @param {Object} snapshot File input or null if no snapshot is to be uploaded.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostRoom (room, snapshot) {
  const formData = new FormData()
  formData.append('name', room.name)
  if (room.template) formData.append('template', room.template)
  if (room.auth) formData.append('auth', room.auth)
  if (room.convert !== undefined) formData.append('convert', room.convert)
  if (snapshot) formData.append('snapshot', snapshot)

  return fetchOrThrow([201], 'api/rooms/', {
    method: 'POST',
    body: formData
  })
}

/**
 * API DELETE /rooms/:roomName/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiDeleteRoom (roomName) {
  return deleteJson([204], 'api/rooms/' + roomName + '/')
}

/**
 * API PATCH /rooms/:roomName/template/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} patch Partial piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchTemplate (roomName, patch) {
  return patchJson([200], 'api/rooms/' + roomName + '/template/', patch)
}

/**
 * API GET /rooms/:roomName/tables/:tableId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Boolean} headers If true, replay with a header/payload object.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiGetTable (roomName, tableId, headers = false) {
  return getJson([200], 'api/rooms/' + roomName + '/tables/' + tableId + '/', headers)
}

/**
 * API PUT /rooms/:roomName/tables/:tableId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Array} table The new room table (array of pieces).
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPutTable (roomName, tableId, table) {
  return putJson([200], 'api/rooms/' + roomName + '/tables/' + tableId + '/', table)
}

/**
 * API HEAD /rooms/:roomName/tables/:tableId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiHeadTable (roomName, tableId) {
  return head('api/rooms/' + roomName + '/tables/' + tableId + '/')
}

/**
 * API PUT /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Object} piece Piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPutPiece (roomName, tableId, piece) {
  return putJson([200], 'api/rooms/' + roomName + '/tables/' + tableId + '/pieces/' + piece.id + '/', piece)
}

/**
 * API PATCH /rooms/:roomName/tables/:tableId/pieces/:pieceId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {String} pieceId Piece-ID (ID) of piece to patch.
 * @param {Object} patch Partial piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchPiece (roomName, tableId, pieceId, patch) {
  return patchJson([200], 'api/rooms/' + roomName + '/tables/' + tableId + '/pieces/' + pieceId + '/', patch)
}

/**
 * API PATCH /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Array} patches Array of partial pieces to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPatchPieces (roomName, tableId, patches) {
  return patchJson([200], 'api/rooms/' + roomName + '/tables/' + tableId + '/pieces/', patches)
}

/**
 * API DELETE /rooms/:roomName/tables/:tableId/pieces/:pieceId/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {String} pieceId Piece-ID (ID) of piece to delete.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiDeletePiece (roomName, tableId, pieceId) {
  return deleteJson([204], 'api/rooms/' + roomName + '/tables/' + tableId + '/pieces/' + pieceId + '/')
}

/**
 * API POST /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Number} tableId Number of table (0-9), 1 = normal.
 * @param {Object} piece Piece JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostPiece (roomName, tableId, piece) {
  return postJson([201], 'api/rooms/' + roomName + '/tables/' + tableId + '/pieces/', piece)
}

/**
 * API POST /rooms/:roomName/tables/:tableId/pieces/
 *
 * @param {String} roomName Name of room, e.g. 'funnyLovingWhale'.
 * @param {Object} asset Asset JSON/Object to send.
 * @return {Promise} Promise containing JSON/Object payload.
 */
export function apiPostAsset (roomName, asset) {
  return postJson([201], 'api/rooms/' + roomName + '/assets/', asset)
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
  if (DEMO_MODE) return demoFetchOrThrow(expectedStatus, path, data, headers)
  if (mock === 1) return Promise.resolve({ expectedStatus, path, data, headers })
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
 * @param {Boolean} headers If true, reply with a headers/payload object.
 * @return {Promse} Promise of a JSON object.
 */
function getJson (expectedStatus, path, headers = false) {
  return fetchOrThrow(expectedStatus, path, {
    headers: {
      'Content-Type': 'application/json'
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
