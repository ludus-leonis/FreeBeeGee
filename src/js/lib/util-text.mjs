/**
 * @file Various string & text helpers.
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
 * along with FreeBeeGee. If not, see https://www.gnu.org/licenses/.
 */

export default {
  anId,
  bytesToIso,
  hash,
  hoursToTimespan,
  prettyName,
  sortNumber,
  sortString,
  toCamelCase,
  toTitleCase,
  unCamelCase,
  unprettyName,
  uuid
}

/**
 * Generate an alphanumeric ID.
 *
 * @param {number} digits Length of ID, defaults to 8.
 * @returns {string} Random Hex-string.
 */
function anId (digits = 8) {
  // taken from https://stackoverflow.com/questions/58325771/how-to-generate-random-hex-string-in-javascript
  return 'X' + [...Array(digits - 1)].map(() => Math.floor(Math.random() * 36).toString(36)).join('')
}

/**
 * Generate a v4 UUID.
 *
 * @param {number} seed Optional seed for UUID, defaults to Math.random()
 * @returns {string} UUID.
 */
function uuid (seed = null) {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const s = seed === null ? Math.random() : seed
    const r = s * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a byte string.
 *
 * @param {number} bytes Bytes to display, e.g. 1024
 * @returns {string} Compact version inkluding units, e.g. '1k'.
 */
function bytesToIso (bytes) {
  if (bytes === 1) {
    return '1 byte'
  }
  if (bytes < 1024) {
    return Math.floor(bytes) + ' bytes'
  }
  if (bytes < 1024 * 1024) {
    return Math.floor(bytes / 1024) + ' kB'
  }
  if (bytes < 1024 * 1024 * 1024) {
    return Math.floor(bytes / 1024 / 1024) + ' MB'
  }
  return Math.floor(bytes / 1024 / 1024 / 1024) + ' GB'
}

/**
 * Convert hours into human-readable timespan string.
 *
 * @param {number} hours Hours to convert, e.g. 256.
 * @param {boolean} roundDown Round down (true) or up (false). Defaults to true.
 * @returns {string} String representation, e.g. '11 days'.
 */
function hoursToTimespan (hours, roundDown = true) {
  if (hours === 1) {
    return '1 hour'
  }
  if (hours < 96) {
    return hours + ' hours'
  }
  if (hours <= 100 * 24) {
    return (roundDown ? Math.floor(hours / 24) : Math.ceil(hours / 24)) + ' days'
  }
  return (roundDown ? Math.floor(hours / 24 / 7) : Math.ceil(hours / 24 / 7)) + ' weeks'
}

/**
 * Calculate a simple hash for a string.
 *
 * Based on Java's implementation.
 *
 * @param {string} string String to hash.
 * @returns {number} A hash value.
 */
function hash (string) {
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    hash = ((hash << 5) - hash) + string.charCodeAt(i)
    hash |= 0
  }
  return hash
}

/**
 * Convert a string to title-case (each word starts with an uppercase letter).
 *
 * @param {string} string String to title-case.
 * @returns {string} Title-cased string.
 */
function toTitleCase (string) {
  return string.replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Convert a string to camel-case (no spaces, parts starting with uppercase).
 *
 * @param {string} string String to camel-case.
 * @returns {string} Camel-cased string.
 */
function toCamelCase (string) {
  return string.replace(/[a-zA-Z0-9-]+/g, function (match, index) {
    const lower = match.toLowerCase()
    return index === 0 ? lower : (lower.charAt(0).toUpperCase() + lower.slice(1))
  }).replace(/[^a-zA-Z0-9-]+/g, '')
}

/**
 * Convert a CamelCase string to non-camel-case.
 *
 * @param {string} string String to un-camel-case.
 * @returns {string} Un-camel-cased string.
 */
function unCamelCase (string) {
  return toTitleCase(string.replace(/([A-Z])/g, ' $1').replace(/\s+/g, ' ').trim())
}

/**
 * Sort an array of objects by string property.
 *
 * @param {Array} objects Array to sort.
 * @param {string} property Property to sort by.
 * @returns {Array} Sorted array.
 */
function sortString (objects, property) {
  return objects.sort((a, b) => {
    const valueA = (a[property] ?? '').toLowerCase()
    const valueB = (b[property] ?? '').toLowerCase()
    return valueA < valueB ? -1 : +(valueA > valueB)
  })
}

/**
 * Sort an array of objects by number property.
 *
 * @param {Array} objects Array to sort.
 * @param {string} property Property to sort by.
 * @param {number} fallback A default value for objects without that property.
 * @returns {Array} Sorted array.
 */
function sortNumber (objects, property, fallback = 0) {
  return objects.sort((a, b) => {
    return (a[property] ?? fallback) - (b[property] ?? fallback)
  })
}

/**
 * Make an asset's name readable.
 *
 * @param {string} assetName Name to convert, e.g. 'dungeon.ironDoor'.
 * @param {string} hideUnderscore If true (default), underscore groups are removed.
 * @returns {string} Improved name, e.g. 'Dungeon, Iron Door'.
 */
function prettyName (assetName = '', hideUnderscore = true) {
  const split = assetName.split('.')
  if (split.length <= 1) {
    return unCamelCase(split[0])
  } else if (hideUnderscore && split[0] === '_') { // sort-first character
    return unCamelCase(split[1])
  } else { // only 2 splits/groups are supported
    return unCamelCase(split[0]) +
    ', ' + unCamelCase(split[1])
  }
}

/**
 * Convert an asset's readable name back into an name.
 *
 * @param {string} assetName Name to convert, e.g. 'Dungeon, Iron Door'.
 * @returns {string} Alias for filename, e.g. 'dungeon.ironDoor'.
 */
function unprettyName (assetName = '') {
  const split = assetName.split(',')
  const group = split[0].trim()
  if (split.length <= 1) {
    return group === '_' ? '_' : toCamelCase(group)
  } else {
    const name = toCamelCase(split[1].trim())
    return (group === '_' ? '_' : toCamelCase(group)) + (name === '' ? '' : '.' + name)
  }
}
