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
  removeStoreValue
} from '../lib/utils-html.mjs'

import {
  anId
} from '../lib/utils-text.mjs'

import {
  epoch
} from '../lib/utils.mjs'

const UNDO_LEVELS = 5

// --- public ------------------------------------------------------------------

/**
 * Map API to in-memory calls.
 *
 * @param {number} _ (Ignored) HTTP status expected.
 * @param {string} path The URL to call. Can be relative.
 * @param {object} data Optional playload for request.
 * @param {boolean} headers If true, the HTTP headers will be added as '_headers'
 *                          to the JSON reply.
 * @returns {Promise} Promise of a JSON object.
 * @throws {UnexpectedStatus} In case of an HTTP that did not match the expected ones.
 */
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
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/tables\/[0-9]+\/pieces\/[a-zA-Z0-9_-]+\/$/)) {
    const matches = path.match(/^api\/rooms\/([a-zA-Z0-9]+)\/tables\/([0-9]+)\/pieces\/([a-zA-Z0-9_-]+)\/$/)
    return apiRoomTablePieces(matches[1], Number.parseInt(matches[2]), matches[3], data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/tables\/[0-9]+\/pieces\/$/)) {
    const matches = path.match(/^api\/rooms\/([a-zA-Z0-9]+)\/tables\/([0-9]+)\/pieces\/$/)
    return apiRoomTablePieces(matches[1], Number.parseInt(matches[2]), undefined, data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/tables\/[0-9]+\/undo\/$/)) {
    const matches = path.match(/^api\/rooms\/([a-zA-Z0-9]+)\/tables\/([0-9]+)\/undo\/$/)
    return apiRoomTableUndo(matches[1], Number.parseInt(matches[2]), data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/$/)) {
    return apiRoom(path.substr(10).replace(/\/.*$/, ''), data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/setup\/$/)) {
    return apiRoomSetup(path.substr(10).replace(/\/.*$/, ''), data, headers)
  } else if (path.match(/^api\/rooms\/$/)) {
    return apiRoom(undefined, data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/auth\/$/)) {
    return apiRoomAuth(path.substr(10).replace(/\/.*$/, ''), data, headers)
  } else if (path.match(/^api\/rooms\/[a-zA-Z0-9]+\/assets\/[a-zA-Z0-9_-]+\/$/)) {
    const matches = path.match(/^api\/rooms\/([a-zA-Z0-9]+)\/assets\/([a-zA-Z0-9_-]+)\/$/)
    return apiRoomAssets(matches[1], matches[2], data, headers)
  } else if (path === 'api/snapshots/') {
    return apiSnapshots(data, headers)
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
 * @param {string} string String to hash.
 * @returns {string} Calculate hash, including 'crc32:' prefix.
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
 * @param {string} roomName Room to set the hash in.
 * @param {string} key Digest entry to set new (e.g. 'tables/1.json').
 * @param {object} data Data/string to hash.
 */
function updateDigest (roomName, key, data) {
  const digests = getPreference(`freebeegee-demo-${roomName}`, PREFS.DIGEST)
  digests[key] = hash(data)
  setPreference(`freebeegee-demo-${roomName}`, PREFS.DIGEST, digests)
}

/**
 * Add (json) objects to an object array.
 *
 * Does not do any checking, as the caller (browser) can not gain anything by
 * cheating. It only adds a generated ID.
 *
 * @param {object[]} array Array of items to add to.
 * @param {object[]} items Items to add.
 * @returns {object[]} The added item with the new ID.
 */
function addAll (array, items) {
  const reply = []
  for (const item of items) {
    if (item.a?.match(/^ZZZZZZZ/)) { // system pieces
      del(array, 'id', item.a) // no duplicates
      item.id = item.a
      item.expires = epoch(8)
    } else {
      item.id = anId()
    }

    array.push(item)
    reply.push(item)
  }
  return reply
}

/**
 * Delete the first object in an array where key matches value.
 *
 * Does not do any checking, as the caller (browser) can not gain anything by
 * cheating.
 *
 * @param {object[]} array Array of items to patch.
 * @param {string} key Key to look for, usually 'id'.
 * @param {string} value Value to look for, usually a hex string.
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
 * @param {object[]} array Array of items to patch.
 * @param {string} key Key to look for, usually 'id'.
 * @param {string} value Value to look for, usually a hex string.
 * @param {string} patch Patch to apply if found
 * @returns {object} The patched item or null if not found.
 */
function patch (array, key, value, patch) {
  for (const item of array) {
    if (item[key] === value) {
      for (const field in patch) {
        item[field] = patch[field]
      }
      if (item.a?.match(/^ZZZZZZZ/)) item.expires = epoch(8)
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
 * @param {object[]} array Array of items to patch.
 * @param {string} key Key to look for, usually 'id'.
 * @param {string} values Array of values to look for, usually hex strings.
 * @param {string} patches Patches to apply if found. Each index of values corresponds to its patch.
 * @returns {object[]} Possibly empty array of found & patched items.
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
 * @param {number} status HTTP status to send.
 * @param {object} body HTTP payload as parsed object.
 * @param {boolean} headers If true, a nested object with default headers is sent.
 *                          If false (default) just the body is returned.
 * @param {number} ms Milliseconds to delay the Promise.
 * @returns {Promise} Delayed promise
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
 * @param {string} roomName Room to fetch.
 * @returns {object} Room data (parsed json).
 */
function getRoom (roomName) {
  return getPreference(`freebeegee-demo-${roomName}`, PREFS.ROOM)
}

/**
 * Store a given payload for a given room, then return is as API fake promise.
 *
 * Will also update the store timestamp ("t") entry to avoid early cleanup.
 *
 * @param {string} roomName Room name to cache the URL for.
 * @param {object} pref PREFS entry.
 * @param {object} payload The payload to cache.
 * @param {number} status HTTP status to send.
 * @param {boolean} headers If true, a nested object with default headers is sent.
 *                          If false, just the body is returned.
 * @param {string} digest A room's digest entry to update with the payload's hash. Null = disable.
 * @returns {Promise} Delayed promise of the content.
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
 * Fetch an URL (Json) from the snapshot directory and cache it in the browser store.
 *
 * @param {string} roomName Room name to cache the URL for.
 * @param {string} url The URL to fetch, e.g. './demo/RPG/room.json'.
 * @param {object} pref PREFS entry.
 * @param {Function} fix Method to be called upon the retrieved payload to modify it's content.
 * @param {number} status HTTP status to send.
 * @param {boolean} headers If true, a nested object with default headers is sent.
 *                          If false (default) just the body is returned.
 * @param {string} digest A room's digest entry to update with the payload's hash. Null = disable.
 * @returns {Promise} Delayed promise of the content.
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
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function api (data, headers) {
  const root = window.location.pathname.replace(/\/[^/]+$/, '/')
  switch (data.method) {
    case 'GET':
      return delayPromise(200, {
        version: '$VERSION$',
        engine: '$ENGINE$',
        ttl: -1,
        snapshotUploads: false,
        freeRooms: 128,
        root: root + 'api',
        backgrounds: [
          { name: 'Cardboard', image: 'img/desktop-cardboard.jpg', color: '#b2997d', scroller: '#7f6d59' },
          { name: 'Carpet', image: 'img/desktop-carpet.jpg', color: '#31555E', scroller: '#4a818e' },
          { name: 'Casino', image: 'img/desktop-casino.jpg', color: '#2D5B3D', scroller: '#3a7750' },
          { name: 'Concrete', image: 'img/desktop-concrete.jpg', color: '#6C6964', scroller: '#494540' },
          { name: 'Dark', image: 'img/desktop-dark.jpg', color: '#212121', scroller: '#444444' },
          { name: 'Leather', image: 'img/desktop-leather.jpg', color: '#3C2D26', scroller: '#6a4b40' },
          { name: 'Marble', image: 'img/desktop-marble.jpg', color: '#B6AB99', scroller: '#80725e' },
          { name: 'Metal', image: 'img/desktop-metal.jpg', color: '#565859', scroller: '#3e3e3e' },
          { name: 'Paper', image: 'img/desktop-paper.jpg', color: '#cbcbcb', scroller: '#989898' },
          { name: 'Pinboard', image: 'img/desktop-pinboard.jpg', color: '#C0A183', scroller: '#a2775b' },
          { name: 'Rock', image: 'img/desktop-rock.jpg', color: '#545450', scroller: '#393930' },
          { name: 'Sand', image: 'img/desktop-sand.jpg', color: '#D7D2BF', scroller: '#a19e8f' },
          { name: 'Space', image: 'img/desktop-space.jpg', color: '#101010', scroller: '#404040' },
          { name: 'Wood', image: 'img/desktop-wood.jpg', color: '#524A43', scroller: '#3e3935' }
        ]
      }, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/snapshots.
 *
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function apiSnapshots (data, headers) {
  switch (data.method) {
    case 'GET':
      return delayPromise(200, ['Classic', 'Hex', 'RPG', 'Tutorial'], headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/auth/.
 *
 * @param {string} roomName Room name to fetch.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function apiRoomAuth (roomName, data, headers) {
  switch (data.method) {
    case 'POST':
    case 'PATCH':
      if (getRoom(roomName)) {
        return delayPromise(200, { token: '00000000-0000-0000-0000-000000000000' }, headers)
      } else {
        return delayPromise(404, {}, headers)
      }
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/.
 *
 * @param {string} roomName Room name to fetch.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
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
        `demo/${data.body.get('snapshot')}/room.json`,
        PREFS.ROOM,
        (json) => {
          json.name = data.body.get('name')
          json.id = '' + new Date().getTime()
          json.setup.name = data.body.get('snapshot')
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
 * @param {string} roomName Room name to fetch.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
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
 * @param {string} roomName Room name to fetch.
 * @param {number} no Table number. May be omitted if call doesn't need one.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
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
          `demo/${getRoom(roomName).setup.name}/tables/${no}.json`,
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
 * @param {string} roomName Room name to fetch.
 * @param {number} no Table number.
 * @param {number} pieceId Piece ID. May be omitted if call affects all pieces.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function apiRoomTablePieces (roomName, no, pieceId, data, headers) {
  const pref = PREFS[`TABLE${no}`]
  let reply
  switch (data.method) {
    case 'GET':
      throw new UnexpectedStatus(501, 'GET room table pieces not implemented yet')
    case 'POST':
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      undoPush(roomName, temp, pref)
      reply = addAll(temp, JSON.parse(data.body))
      setPreference(`freebeegee-demo-${roomName}`, pref, temp)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(204, reply, headers)
    case 'PUT':
      throw new UnexpectedStatus(501, 'PUT room table piece not implemented yet')
    case 'PATCH':
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      undoPush(roomName, temp, pref)
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
      undoPush(roomName, temp, pref)
      for (const delId of JSON.parse(data.body)) del(temp, 'id', delId)
      setPreference(`freebeegee-demo-${roomName}`, pref, temp)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(204, {}, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/table/[#]/undo/.
 *
 * @param {string} roomName Room name to fetch.
 * @param {number} no Table number.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function apiRoomTableUndo (roomName, no, data, headers) {
  const pref = PREFS[`TABLE${no}`]
  switch (data.method) {
    case 'POST':
      undoPop(roomName, pref)
      temp = getPreference(`freebeegee-demo-${roomName}`, pref)
      updateDigest(roomName, `tables/${no}.json`, temp)
      return delayPromise(204, {}, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/assets/[assetId]/
 *
 * @param {string} roomName Room name to fetch.
 * @param {string} assetId Asset to fetch.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function apiRoomAssets (roomName, assetId, data, headers) {
  switch (data.method) {
    case 'DELETE':
      temp = getRoom(roomName)
      del(temp.library.overlay, 'id', assetId)
      del(temp.library.tile, 'id', assetId)
      del(temp.library.token, 'id', assetId)
      del(temp.library.other, 'id', assetId)
      del(temp.library.badge, 'id', assetId)
      setPreference(`freebeegee-demo-${roomName}`, PREFS.ROOM, temp)
      updateDigest(roomName, 'room.json', temp)
      return delayPromise(204, {}, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Fake-fetch /api/rooms/[roomName]/setup/
 *
 * @param {string} roomName Room name to fetch.
 * @param {object} data Original fetch()'s data object.
 * @param {boolean} headers If true, reply with a full header object. If false, reply only with the payload.
 * @returns {Promise} Delayed promise of the API content.
 * @throws UnexpectedStatus for not implemented HTTP methods.
 */
function apiRoomSetup (roomName, data, headers) {
  let setup
  switch (data.method) {
    case 'PATCH':
      temp = getRoom(roomName)
      setup = patch([temp.setup], 'name', temp.setup.name, JSON.parse(data.body))
      temp.width = setup.gridWidth * setup.gridSize
      temp.height = setup.gridHeight * setup.gridSize
      setPreference(`freebeegee-demo-${roomName}`, PREFS.ROOM, temp)
      updateDigest(roomName, 'room.json', temp)
      return delayPromise(200, temp, headers)
    default:
      throw new UnexpectedStatus(501, 'not implemented for demo')
  }
}

/**
 * Add the given table data to the undo stack.
 *
 * @param {string} roomName Room name to undo in.
 * @param {boolean} tableData Table data (pieces) to push.
 * @param {object} pref Current table (number) preference
 */
function undoPush (roomName, tableData, pref) {
  let temp
  for (let i = UNDO_LEVELS - 2; i >= 0; i--) {
    temp = getPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}.${i}`, default: '' })
    if (temp !== '') {
      setPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}.${i + 1}`, default: '' }, temp)
    }
  }
  temp = getPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}`, default: '' })
  if (temp !== '') {
    setPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}.0`, default: '' }, temp)
  }
}

/**
 * Un-shift the given table data from the undo stack.
 *
 * @param {string} roomName Room name to undo in.
 * @param {object} pref Current table (number) preference
 */
function undoPop (roomName, pref) {
  let temp
  temp = getPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}.0`, default: '' })
  if (temp !== '') {
    setPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}`, default: '' }, temp)

    for (let i = 1; i <= UNDO_LEVELS - 1; i++) {
      temp = getPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}.${i}`, default: '' })
      if (temp !== '') {
        setPreference(`freebeegee-demo-${roomName}`, { name: `${pref.name}.${i - 1}`, default: '' }, temp)
      }
    }
  }
}
