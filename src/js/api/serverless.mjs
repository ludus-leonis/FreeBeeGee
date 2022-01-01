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

/**
 * This file contains all the code needed to run FreeBeeGee in serverless demo
 * mode. This mode does not require a real API/backend and will live only in one
 * browser's memory.
 *
 * Demo mode implements a simplified in-memory API with almost no checks.
 */

import {
  UnexpectedStatus
} from '../api/index.mjs'

import {
  getPreference,
  setPreference
} from '../state/index.mjs'

import {
  setStoreValue,
  removeStoreValue,
  epoch,
  hexId
} from '../lib/utils.mjs'

// --- public ------------------------------------------------------------------

export function demoFetchOrThrow (_, path, data = {}, headers = false) {
  if (!data.method) data.method = 'GET'

  if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/digest\/$/)) {
    return apiRoomDigest(path.substr(10).replace(/\/.*$/, ''), data, headers)
  }

  // console.debug('===> fetchOrThrow', data.method, path, data, headers)

  if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/tables\/[0-9]+\/$/)) {
    return apiRoomTable(
      path.substr(10).replace(/\/.*$/, ''),
      Number.parseInt(path.replace(/\/$/, '').replace(/.*\//, '')),
      data, headers
    )
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/tables\/[0-9]+\/pieces\/[0-9a-f]+\/$/)) {
    const matches = path.match(/^api\/rooms\/([a-zA-Z0-9]+)\/tables\/([0-9]+)\/pieces\/([0-9a-f]+)\/$/)
    return apiRoomTablePieces(matches[1], Number.parseInt(matches[2]), matches[3], data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/tables\/[0-9]+\/pieces\/$/)) {
    const matches = path.match(/^api\/rooms\/([a-zA-Z0-9]+)\/tables\/([0-9]+)\/pieces\/$/)
    return apiRoomTablePieces(matches[1], Number.parseInt(matches[2]), undefined, data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/$/)) {
    return apiRoom(path.substr(10).replace(/\/.*$/, ''), data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/template\/$/)) {
    return apiRoomTemplate(path.substr(10).replace(/\/.*$/, ''), data, headers)
  } else if (path.match(/^api\/rooms\/$/)) {
    return apiRoom(undefined, data, headers)
  } else if (path === 'api/templates/') {
    return apiTemplates(data, headers)
  } else if (path === 'api/') {
    return api(data, headers)
  }

  throw new UnexpectedStatus(501, 'demo call not implemented - no route')
}

// --- private -----------------------------------------------------------------

const PREFS = {
  ROOM: { name: 'room', default: null },
  DIGEST: { name: 'digest', default: {} },
  TABLE0: { name: 'table0', default: null },
  TABLE1: { name: 'table1', default: null },
  TABLE2: { name: 'table2', default: null },
  TABLE3: { name: 'table3', default: null },
  TABLE4: { name: 'table4', default: null },
  TABLE5: { name: 'table5', default: null },
  TABLE6: { name: 'table6', default: null },
  TABLE7: { name: 'table7', default: null },
  TABLE8: { name: 'table8', default: null },
  TABLE9: { name: 'table9', default: null }
}

let temp = null

/**
 * Calculate a 'Java' / CRC32 hash
 *
 * @param {String} string String to hash.
 * @return {String} Calculate hash, including 'crc32:' prefix.
 */
function hash (string) {
  if (typeof string !== 'string') string = JSON.stringify(string)
  string = string ?? ''
  // taken from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  if (string.length === 0) return 'crc32:0'
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    const chr = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return `crc32:${hash}`
};

/**
 * Update the digest for one digest item.
 *
 * @param {String} roomName Room to set the hash in.
 * @param {String} key Digest entry to set new (e.g. 'tables/1.json').
 * @param {Object} data Data/string to hash.
 */
function updateDigest (roomName, key, data) {
  const digests = getPreference(`freebeegee-demo-${roomName}`, PREFS.DIGEST)
  digests[key] = hash(data)
  setPreference(`freebeegee-demo-${roomName}`, PREFS.DIGEST, digests)
}

/**
 * Add a (json) object to an object array.
 *
 * Does not do any checking, as the caller (browser) can not gain anything by
 * cheating. It only adds a generated ID.
 *
 * @param {Array} array Array of items to add to.
 * @param {String} item Item to add.
 * @return {Object} The added item with the new ID.
 */
function add (array, item) {
  if (item.a?.match(/^fffffffffffffff/)) { // system pieces
    del(array, 'id', item.a) // no duplicates
    item.id = item.a
    item.expires = epoch(8)
  } else {
    // taken from https://stackoverflow.com/questions/58325771/how-to-generate-random-hex-string-in-javascript
    item.id = hexId()
  }

  array.push(item)
  return item
}

/**
 * Delete the first object in an array where key matches value.
 *
 * Does not do any checking, as the caller (browser) can not gain anything by
 * cheating.
 *
 * @param {Array} array Array of items to patch.
 * @param {String} key Key to look for, usually 'id'.
 * @param {String} value Value to look for, usually a hex string.
 */
function del (array, key, value) {
  for (let index = 0; index < array.length; index++) {
    if (array[index][key] === value) {
      array.splice(index, 1)
      return // done
    }
  }
}

/**
 * Patch the first object in an array where key matches value.
 *
 * Does not do any checking, as the caller (browser) can not gain anything by
 * cheating.
 *
 * @param {Array} array Array of items to patch.
 * @param {String} key Key to look for, usually 'id'.
 * @param {String} value Value to look for, usually a hex string.
 * @param {String} patch Patch to apply if found
 * @return {Object} The patched item or null if not found.
 */
function patch (array, key, value, patch) {
  for (const item of array) {
    if (item[key] === value) {
      for (const field in patch) {
        item[field] = patch[field]
      }
      if (item.a?.match(/^fffffffffffffff/)) item.expires = epoch(8)
      return item
    }
  }
  return null
}

/**
 * Patch multiple (json) objects in an array.
 *
 * Does not do any checking, as the caller (browser) can not gain anything by
 * cheating.
 *
 * @param {Array} array Array of items to patch.
 * @param {String} key Key to look for, usually 'id'.
 * @param {String} values Array of values to look for, usually hex strings.
 * @param {String} patches Patches to apply if found. Each index of values corresponds to its patch.
 * @return {Array} Possibly empty array of found & patched items.
 */
function patchAll (array, key, values, patches) {
  const items = []
  for (let index = 0; index < values.length; index++) {
    items.push(patch(array, key, values[index], patches[index]))
  }
  return items
}

/**
 * Return an API reply as delayed Promise.
 *
 * Used to 'fake' a realistic, slower API.
 *
 * @param {Number} status HTTP status to send.
 * @param {Object} body HTTP payload as parsed object.
 * @param {Boolean} headers If true, a nested object with default headers is sent.
 *                          If false (default) just the body is returned.
 * @param {Number} ms Milliseconds to delay the Promise.
 * @return {Promise} Delayed promise
 */
function delayPromise (status, body, headers = false, ms = 50) {
  if (headers) {
    const map = new Map()
    map.set('digest', hash(body))
    map.set('servertime', epoch())
    return new Promise(resolve => setTimeout(resolve, ms, { status, body, headers: map }))
  } else {
    return new Promise(resolve => setTimeout(resolve, ms, body))
  }
}

/**
 * Fetch room data from the browser store.
 *
 * @param {String} roomName Room to fetch.
 * @return {Object} Room data (parsed json).
 */
function getRoom (roomName) {
  return getPreference(`freebeegee-demo-${roomName}`, PREFS.ROOM)
}

/**
 * Store a given payload for a given room, then return is as API fake promise.
 *
 * Will also update the store timestamp ("t") entry to avoid early cleanup.
 *
 * @param {String} roomName Room name to cache the URL for.
 * @param {Object} pref PREFS entry.
 * @param {Object} payload The payload to cache.
 * @param {Number} status HTTP status to send.
 * @param {Boolean} headers If true, a nested object with default headers is sent.
 *                          If false, just the body is returned.
 * @param {String} digest A room's digest entry to update with the payload's hash. Null = disable.
 * @return {Promise} Delayed promise of the content.
 */
function cache (roomName, pref, payload, status, headers, digest = null) {
  setPreference(`freebeegee-demo-${roomName}`, pref, payload)
  setStoreValue(`freebeegee-demo-${roomName}`, 't', epoch()) // touch
  if (cache) {
    updateDigest(roomName, digest, payload)
  }
  return delayPromise(status, payload, headers)
}

/**
 * Fetch an URL (Json) from the template directory and cache it in the browser store.
 *
 * @param {String} roomName Room name to cache the URL for.
 * @param {String} url The URL to fetch, e.g. './demo/RPG/room.json'.
 * @param {Object} pref PREFS entry.
 * @param {Function} fix Method to be called upon the retrieved payload to modify it's content.
 * @param {Number} status HTTP status to send.
 * @param {Boolean} headers If true, a nested object with default headers is sent.
 *                          If false (default) just the body is returned.
 * @param {String} digest A room's digest entry to update with the payload's hash. Null = disable.
 * @return {Promise} Delayed promise of the content.
 */
function fetchAndCache (roomName, url, pref, fix, status, headers, digest = null) {
  return globalThis.fetch(url)
    .then(response => response.json())
    .then(json => {
      if (fix) fix(json)
      return cache(roomName, pref, json, status, headers, digest)
    })
}

/**
 * Fake-fetch /api.
 *
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function api (data, headers) {
  const root = window.location.pathname.replace(/\/[^/]+$/, '/')
  switch (data.method) {
    case 'GET':
      return delayPromise(200, {
        version: '0.14.0-dev',
        engine: '1.1.0',
        ttl: -1,
        snapshotUploads: false,
        freeRooms: 128,
        root: root + 'api'
      }, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/templates.
 *
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function apiTemplates (data, headers) {
  switch (data.method) {
    case 'GET':
      return delayPromise(200, ['Classic', 'Hex', 'RPG', 'Tutorial'], headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/.
 *
 * @param {String} roomName Room name to fetch.
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function apiRoom (roomName, data, headers) {
  switch (data.method) {
    case 'GET':
      temp = getRoom(roomName)
      if (temp) {
        return delayPromise(200, temp, headers)
      } else {
        return delayPromise(404, {}, headers)
      }
    case 'POST':
      return fetchAndCache(
        data.body.get('name'),
        `demo/${data.body.get('template')}/room.json`,
        PREFS.ROOM,
        (json) => {
          json.name = data.body.get('name')
          json.id = '' + new Date().getTime()
          json.template.name = data.body.get('template')
        },
        201,
        headers,
        'room.json'
      )
    case 'DELETE':
      removeStoreValue(`freebeegee-demo-${roomName}`)
      return delayPromise(201, {}, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/digest/.
 *
 * @param {String} roomName Room name to fetch.
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function apiRoomDigest (roomName, data, headers) {
  switch (data.method) {
    case 'GET':
      temp = getPreference(`freebeegee-demo-${roomName}`, PREFS.DIGEST)
      return delayPromise(200, temp, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/table/[#].
 *
 * @param {String} roomName Room name to fetch.
 * @param {Number} no Table number. May be omitted if call doesn't need one.
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function apiRoomTable (roomName, no, data, headers) {
  const pref = PREFS[`TABLE${no}`]
  switch (data.method) {
    case 'GET':
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      if (temp) {
        return delayPromise(200, temp, headers)
      } else {
        return fetchAndCache(
          roomName,
          `demo/${getRoom(roomName).template.name}/tables/${no}.json`,
          pref,
          undefined,
          200,
          headers,
          `tables/${no}.json`
        ).catch(() => { // 404
          return cache(roomName, pref, [], 200, headers, `tables/${no}.json`)
        })
      }
    case 'PUT':
      temp = JSON.parse(data.body)
      setPreference(`freebeegee-demo-${roomName}`, pref, temp)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(200, temp, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/table/[#]/pieces/[#].
 *
 * @param {String} roomName Room name to fetch.
 * @param {Number} no Table number.
 * @param {Number} pieceId Piece ID. May be omitted if call affects all pieces.
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function apiRoomTablePieces (roomName, no, pieceId, data, headers) {
  const pref = PREFS[`TABLE${no}`]
  let reply
  switch (data.method) {
    case 'GET':
      throw new UnexpectedStatus(501, 'GET room table pieces not implemented yet')
    case 'POST':
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      reply = add(temp, JSON.parse(data.body))
      setPreference(`freebeegee-demo-${roomName}`, pref, temp)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(204, {}, headers)
    case 'PUT':
      throw new UnexpectedStatus(501, 'PUT room table piece not implemented yet')
    case 'PATCH':
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      if (pieceId) {
        reply = patch(temp, 'id', pieceId, JSON.parse(data.body))
      } else {
        reply = patchAll(temp, 'id', JSON.parse(data.body).map(p => p.id), JSON.parse(data.body))
      }
      setPreference(`freebeegee-demo-${roomName}`, pref, temp)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(200, reply, headers)
    case 'DELETE':
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      del(temp, 'id', pieceId)
      setPreference(`freebeegee-demo-${roomName}`, pref, temp)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(204, {}, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/template/
 *
 * @param {String} roomName Room name to fetch.
 * @param {Object} data Original fetch()'s data object.
 * @param {Boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @return {Promise} Delayed promise of the API content.
 */
function apiRoomTemplate (roomName, data, headers) {
  let template
  switch (data.method) {
    case 'PATCH':
      temp = getRoom(roomName)
      template = patch([temp.template], 'name', temp.template.name, JSON.parse(data.body))
      temp.width = template.gridWidth * template.gridSize
      temp.height = template.gridHeight * template.gridSize
      setPreference(`freebeegee-demo-${roomName}`, PREFS.ROOM, temp)
      updateDigest(roomName, 'room.json', temp)
      return delayPromise(200, temp, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}
