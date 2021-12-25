/**
 * @file Various generic utility helpers.
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
 * along with FreeBeeGee. If not, see https://www.gnu.org/licenses/.
 */

// --- HTML5 + browser ---------------------------------------------------------

/**
 * Access the ?x=y query-string of the current page.
 *
 * @param {String} name Name of parameter.
 * @return {String} Value of parameter. Defaults to '' if parameter is missing.
 */
export function getGetParameter (name) {
  if (typeof URLSearchParams === 'undefined') {
    return ''
  }
  const urlParams = new URLSearchParams(globalThis.location?.search)
  return urlParams.get(name) || ''
}

/**
 * Get all values for a key from an HTML5 browser store.
 *
 * Assumes there is a stringified JSON with sub-entries in the store.
 *
 * Transparent fallback to in-memory map if session store is not available.
 *
 * @param {String} key Name of the store item.
 * @param {Boolean} local If true, the localStorage will be used. Otherwise the
 *                        sessionStorage will be used.
 * @return {(String|undefined)} Retrieved value.
 */
export function getStoreValues (key, local = true) {
  if (typeof Storage !== 'undefined') {
    const store = local ? globalThis.localStorage : globalThis.sessionStorage
    return JSON.parse(store.getItem(key) ?? '{}')
  } else {
    return JSON.parse(fallbackStore.get(key) ?? '{}')
  }
}

/**
 * Get a value from an HTML5 browser store.
 *
 * Assumes there is a stringified JSON with sub-entries in the store.
 *
 * Transparent fallback to in-memory map if session store is not available.
 *
 * @param {String} key Name of the store item.
 * @param {String} property Property in the JSON stored in the store item.
 * @param {Boolean} local If true, the localStorage will be used. Otherwise the
 *                        sessionStorage will be used.
 * @return {(String|undefined)} Retrieved value.
 */
export function getStoreValue (key, property, local = true) {
  return getStoreValues(key, local)[property]
}

/**
 * Set a value in an HTML5 browser store.
 *
 * Transparent fallback to in-memory map if session store is not available.
 *
 * @param {String} key Name of the store item.
 * @param {String} property Property in the JSON stored in the store item.
 * @param {String} value Value to store.
 * @param {Boolean} local If true, the localStorage will be used. Otherwise the
 *                        sessionStorage will be used.
 */
export function setStoreValue (key, property, value, local = true) {
  if (typeof Storage !== 'undefined') {
    const store = local ? globalThis.localStorage : globalThis.sessionStorage
    const prefs = JSON.parse(store.getItem(key) ?? '{}')
    prefs[property] = value
    store.setItem(key, JSON.stringify(prefs))
  } else {
    const prefs = JSON.parse(fallbackStore.get(key) ?? '{}')
    prefs[property] = value
    fallbackStore.set(key, JSON.stringify(prefs))
  }
}

/**
 * Switch browser to fullscreen or back again.
 */
export function toggleFullscreen () {
  if (typeof document === 'undefined') return false
  if (!document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
      return true
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen()
      return true
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen()
      return true
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) // eslint-disable-line no-undef
      return true
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      return true
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
      return true
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
      return true
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
      return true
    }
  }
  return false
}

/**
 * Resize a drawable (image, canvas).
 *
 * @param {Object} image Element to shrink (image, canvas).
 * @param {Number} dimension Size to shrink to.
 * @return Canvas with resized image. Does not honor aspect ratio and will deform.
 */
export function resizeImage (image, dimension) {
  const canvas = document.createElement('canvas')
  canvas.width = dimension
  canvas.height = dimension
  var ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dimension, dimension)
  return canvas
}

// --- math --------------------------------------------------------------------

/**
 * A modulo operation that does not produce negative results.
 *
 * @param {Number} n Number to modulo.
 * @param {Number} m Number to modulo by.
 * @return Modulo value.
 */
export function mod (n, m) {
  return ((n % m) + m) % m
}

/**
 * Clamp a value to be between a min and a max value.
 *
 * @param {Number} min Minimum number.
 * @param {Number} value Value to clamp.
 * @param {Number} max Maximum number.
 * @return {Number} Clamped value within [min, max].
 */
export function clamp (min, value, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * Find closest point in an array of points.
 *
 * @param {Number} x X-coordinate to match.
 * @param {Number} y Y-coordiante to match.
 * @param {Number} points Array of {x, y} points.
 * @return {Object} Closest point of array to original x/y as {x, y, d}.
 */
function findClosestPoint (x, y, points) {
  const closest = {
    d: 999999999.0,
    x: 0,
    y: 0
  }
  for (const point of points) {
    const delta = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
    if (delta < closest.d) {
      closest.d = delta
      closest.x = point.x
      closest.y = point.y
    }
  }
  return closest
}

/**
 * Snap a coordinate to the closest snap position / grid.
 *
 * @param {Number} x X-coordinate to snap.
 * @param {Number} y Y-coordiante to snap.
 * @param {Number} snap Grid size, originates in 0/0.
 * @param {Number} lod Optional level of detail (1 = centers, 2 = also
 *                     corners, 3 = also side centers). Defaults to 1.
  * @return {Object} Closest grid vertex to original x/y as {x, y}.
 */
export function snapGrid (x, y, snap, lod = 1) {
  if (lod <= 1) { // tile centers
    return {
      x: Math.floor(x / snap) * snap + snap / 2,
      y: Math.floor(y / snap) * snap + snap / 2
    }
  }
  if (lod >= 3) { // tile centers, corners and sides
    snap = snap / 2
    return {
      x: Math.floor((x + snap / 2) / snap) * snap,
      y: Math.floor((y + snap / 2) / snap) * snap
    }
  }

  // lod 2: centers + corners
  const points = []
  points.push({ x: 0, y: 0 })
  points.push({ x: snap, y: 0 })
  points.push({ x: 0, y: snap })
  points.push({ x: snap, y: snap })
  points.push({ x: snap / 2, y: snap / 2 })
  const closest = findClosestPoint(mod(x, snap), mod(y, snap), points)
  return {
    x: Math.round(Math.floor(x / snap) * snap + closest.x),
    y: Math.round(Math.floor(y / snap) * snap + closest.y)
  }
}

/**
 * Snap a coordinate to the closest hex position / grid.
 *
 * @param {Number} x X-coordinate to snap.
 * @param {Number} y Y-coordiante to snap.
 * @param {Number} snap Grid size, originates in 0/0.
 * @param {Number} lod Optional level of detail (1 = hex centers, 2 = also hex
 *                     corners, 3 = also side centers). Defaults to 1.
 * @return {Object} Closest grid vertex to original x/y as {x, y}.
 */
export function snapHex (x, y, snap, lod = 1) {
  const hexTileX = snap * 1.71875 // 110x64
  const hexTileY = snap
  const hexSide = 37
  const modX = mod(x, hexTileX)
  const modY = mod(y, hexTileY)
  const tileX = Math.floor(x / hexTileX)
  const tileY = Math.floor(y / hexTileY)

  const points = []

  // add potential snap points
  if (lod >= 1) { // hex centers
    if (modX < hexTileX / 2) {
      points.push({ x: 0, y: 0 })
      points.push({ x: 0, y: hexTileY })
      points.push({ x: hexTileX / 2, y: hexTileY / 2 })
    } else {
      points.push({ x: hexTileX / 2, y: hexTileY / 2 })
      points.push({ x: hexTileX, y: 0 })
      points.push({ x: hexTileX, y: hexTileY })
    }
  }
  if (lod >= 2) { // hex corners
    if (modX < hexTileX / 2) {
      points.push({ x: hexSide, y: 0 })
      points.push({ x: hexSide / 2, y: hexTileY / 2 })
      points.push({ x: hexSide, y: hexTileY })
    } else {
      points.push({ x: hexTileX - hexSide, y: 0 })
      points.push({ x: hexTileX - hexSide / 2, y: hexTileY / 2 })
      points.push({ x: hexTileX - hexSide, y: hexTileY })
    }
  }
  if (lod >= 3) { // side centers
    if (modX < hexTileX / 2) {
      points.push({ x: hexTileX / 2, y: 0 })
      points.push({ x: hexSide * 3 / 4, y: hexTileY / 4 })
      points.push({ x: 0, y: hexTileY / 2 })
      points.push({ x: hexSide * 3 / 4, y: hexTileY * 3 / 4 })
      points.push({ x: hexTileX / 2, y: hexTileY })
    } else {
      points.push({ x: hexTileX / 2, y: 0 })
      points.push({ x: hexTileX - hexSide * 3 / 4, y: hexTileY / 4 })
      points.push({ x: hexTileX, y: hexTileY / 2 })
      points.push({ x: hexTileX - hexSide * 3 / 4, y: hexTileY * 3 / 4 })
      points.push({ x: hexTileX / 2, y: hexTileY })
    }
  }

  const closest = findClosestPoint(modX, modY, points)

  return {
    x: Math.round(tileX * hexTileX + closest.x),
    y: Math.round(tileY * hexTileY + closest.y)
  }
}

/**
 * Shuffle an array using Durstenfeld shuffle.
 *
 * @param {Array} array Array to shuffle. Will be modified!
 */
export function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Determine if two rectacles intersect / overlap.
 *
 * @param {Object} rect1 First rect, containing of top/left/bottom/right.
 * @param {Object} rect2 Second rect, containing of top/left/bottom/right.
 * @returns {Boolean} True if they intersect.
 */
export function intersect (rect1, rect2) {
  return (rect1.left <= rect2.right &&
    rect2.left <= rect1.right &&
    rect1.top <= rect2.bottom &&
    rect2.top <= rect1.bottom)
}

/**
 * Calculate the width and height of the bounding box of a rotated rectangle.
 *
 * @param {Number} w Width of original rectangle.
 * @param {Number} h Height of original rectangle.
 * @param {Number} r Angle to rotate to.
 * @param {Object} '{ w: ..., h: ...}' of transformed rectangle.
 */
export function getDimensionsRotated (w, h, r) {
  // basic rotations don't need long transformation
  switch (r) {
    case 0:
    case 180:
      return { w, h }
    case 90:
    case 270:
      return { h: w, w: h }
    default:
  }

  // transform all other rotations
  const x0 = w / 2 // origin-x
  const y0 = h / 2 // origin-y
  const rs = Math.sin(r * (Math.PI / 180))
  const rc = Math.cos(r * (Math.PI / 180))
  const x1 = x0 + (0 - x0) * rc + (0 - y0) * rs
  const y1 = y0 - (0 - x0) * rs + (0 - y0) * rc
  const x2 = x0 + (0 - x0) * rc + (h - y0) * rs
  const y2 = y0 - (0 - x0) * rs + (h - y0) * rc
  const x3 = x0 + (w - x0) * rc + (0 - y0) * rs
  const y3 = y0 - (w - x0) * rs + (0 - y0) * rc
  const x4 = x0 + (w - x0) * rc + (h - y0) * rs
  const y4 = y0 - (w - x0) * rs + (h - y0) * rc
  return { // compensate for rounding errors but ensure upper bounds
    w: Math.ceil(Math.max(x1, x2, x3, x4) - Math.min(x1, x2, x3, x4) - 0.001),
    h: Math.ceil(Math.max(y1, y2, y3, y4) - Math.min(y1, y2, y3, y4) - 0.001)
  }
}

// --- string & text -----------------------------------------------------------

/**
 * Generate a v4 UUID.
 *
 * @param {Number} seed Optional seed for UUID, defaults to Math.random()
 * @return {String} UUID.
 */
export function uuid (seed = null) {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const s = seed === null ? Math.random() : seed
    const r = s * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Calculate a simple hash for a string.
 *
 * Based on Java's implementation.
 *
 * @param {String} string String to hash.
 * @return {Number} A hash value.
 */
export function hash (string) {
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
 * @param {String} string String to title-case.
 * @return {String} Title-cased string.
 */
export function toTitleCase (string) {
  return string.replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Convert a string to camel-case (no spaces, parts starting with uppercase).
 *
 * @param {String} string String to camel-case.
 * @return {String} Camel-cased string.
 */
export function toCamelCase (string) {
  return string.replace(/[a-zA-Z0-9-]+/g, function (match, index) {
    const lower = match.toLowerCase()
    return index === 0 ? lower : (lower.charAt(0).toUpperCase() + lower.slice(1))
  }).replace(/[^a-zA-Z0-9-]+/g, '')
}

/**
 * Convert a CamelCase string to non-camel-case.
 *
 * @param {String} string String to un-camel-case.
 * @return {String} Un-camel-cased string.
 */
export function unCamelCase (string) {
  return toTitleCase(string.replace(/([A-Z])/g, ' $1').replace(/\s+/g, ' ').trim())
}

/**
 * Sort an array of objects by string property.
 *
 * @param {Array} objects Array to sort.
 * @param {String} property Property to sort by.
 * @return {Array} Sorted array.
 */
export function sortByString (objects, property) {
  return objects.sort((a, b) => {
    const valueA = (a[property] ?? '').toLowerCase()
    const valueB = (b[property] ?? '').toLowerCase()
    return valueA < valueB ? -1 : +(valueA > valueB)
  })
}

/**
 * Make an asset's name readable.
 *
 * Drops the group part (before the dot) and title-cases the rest.
 *
 * @param {String} assetName Name to convert, e.g. 'dungeon.ironDoor'.
 * @return {String} Improved name, e.g. 'Dungeon, Iron Door'.
 */
export function prettyName (assetName = '') {
  const split = assetName.split('.')
  if (split.length <= 1) {
    return unCamelCase(split[0])
  } else if (split[0] === '_') { // sort-first character
    return unCamelCase(split[1])
  } else { // only 2 splits/groups are supported
    return unCamelCase(split[0]) +
    ', ' + unCamelCase(split[1])
  }
}

/**
 * Convert an asset's readable name back into an name.
 *
 * @param {String} assetName Name to convert, e.g. 'Dungeon, Iron Door'.
 * @return {String} Alias for filename, e.g. 'dungeon.ironDoor'.
 */
export function unprettyName (assetName = '') {
  const split = assetName.split(',')
  if (split.length <= 1) {
    return toCamelCase(split[0].trim())
  } else {
    return toCamelCase(split[0].trim()) + '.' + toCamelCase(split[1].trim())
  }
}

// --- time & timestamps -------------------------------------------------------

export const timeRecords = []

/**
 * Record an execution time in a stats array.
 *
 * Will keep up to 10 values.
 *
 * @param {String} record Named record to add this time.
 * @param {Object} value Value to add, if > 0.
 */
export function recordTime (data, value) {
  timeRecords[data] = timeRecords[data] ?? [0]
  while (timeRecords[data].length >= 10) timeRecords[data].shift()
  if (value > 0) timeRecords[data].push(value)
  return timeRecords[data]
}

// --- color -------------------------------------------------------------------

/**
 * Calculate brightness of an HTML hex-color value.
 *
 * @param {String} color E.g. '#ff0000'
 * @return {Number} Grayscale brightness of color (0..255), e.g. 85.
 */
export function brightness (color) {
  const r = parseInt(color.substring(1, 3), 16)
  const g = parseInt(color.substring(3, 5), 16)
  const b = parseInt(color.substring(5, 7), 16)
  return (r + g + b) / 3
}

// --- misc --------------------------------------------------------------------

/**
 * Generate a username like 'L. Lion'.
 *
 * @return {String} Random user name consisting of initial and name.
 */
export function generateUsername () {
  return letters[Math.floor(Math.random() * letters.length)] + '. ' +
  animals[Math.floor(Math.random() * animals.length)]
}

/**
 * Generate a name like 'hilariousGazingPenguin'.
 *
 * @return {String} Random name constisting of 3 parts (adjective, verb, noun).
 */
export function generateName () {
  return adjectives[Math.floor(Math.random() * adjectives.length)] +
  verbs[Math.floor(Math.random() * verbs.length)] +
  animals[Math.floor(Math.random() * animals.length)]
}

const fallbackStore = new Map() // in-memory fallback 'store'

/** An array of all the letters A-Z. */
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

/** An array of mostly positive adjectives. */
const adjectives = ['adorable', 'adventurous', 'amused', 'attractive', 'average', 'beautiful', 'better', 'bewildered', 'black', 'bloody', 'blue', 'brave', 'breakable', 'bright', 'busy', 'calm', 'careful', 'cautious', 'charming', 'cheerful', 'clean', 'clever', 'cloudy', 'clumsy', 'colorful', 'comfortable', 'concerned', 'confused', 'cooperative', 'courageous', 'crazy', 'creepy', 'curious', 'cute', 'dangerous', 'dark', 'delightful', 'determined', 'difficult', 'distinct', 'dizzy', 'dull', 'eager', 'easy', 'elegant', 'enchanting', 'encouraging', 'energetic', 'enthusiastic', 'envious', 'evil', 'excited', 'faithful', 'famous', 'fancy', 'fantastic', 'fierce', 'fine', 'foolish', 'fragile', 'frail', 'frantic', 'friendly', 'frightened', 'funny', 'gentle', 'gifted', 'glamorous', 'gleaming', 'glorious', 'good', 'gorgeous', 'graceful', 'grieving', 'grotesque', 'grumpy', 'handsome', 'happy', 'healthy', 'helpful', 'helpless', 'hilarious', 'homely', 'horrible', 'hungry', 'important', 'impossible', 'inexpensive', 'innocent', 'inquisitive', 'itchy', 'jealous', 'jolly', 'kind', 'lazy', 'light', 'lively', 'lonely', 'long', 'lovely', 'lucky', 'magnificent', 'misty', 'modern', 'motionless', 'mysterious', 'nervous', 'nice', 'odd', 'open', 'outstanding', 'perfect', 'plain', 'pleasant', 'poised', 'poor', 'powerful', 'precious', 'proud', 'puzzled', 'quaint', 'real', 'rich', 'scary', 'selfish', 'shiny', 'shy', 'silly', 'sleepy', 'smiling', 'smoggy', 'sparkling', 'splendid', 'strange', 'successful', 'super', 'talented', 'tame', 'tasty', 'tender', 'tense', 'terrible', 'thankful', 'thoughtful', 'tired', 'tough', 'troubled', 'ugly', 'unusual', 'uptight', 'vast', 'victorious', 'wandering', 'weary', 'wicked', 'wild', 'witty', 'worried', 'zealous']

/** An array of mostly positive verbs. */
const verbs = ['Accepting', 'Adding', 'Admiring', 'Admiting', 'Advising', 'Affording', 'Agreeing', 'Alerting', 'Allowing', 'Amusing', 'Announcing', 'Annoying', 'Answering', 'Arguing', 'Arriving', 'Asking', 'Attaching', 'Attending', 'Avoiding', 'Backing', 'Baking', 'Baning', 'Beging', 'Blinding', 'Bowing', 'Bruising', 'Bumping', 'Burying', 'Calculating', 'Calling', 'Causing', 'Challenging', 'Changing', 'Chewing', 'Claping', 'Cliping', 'Collecting', 'Concerning', 'Copying', 'Curing', 'Cycling', 'Damaging', 'Delaying', 'Delighting', 'Delivering', 'Detecting', 'Developing', 'Disarming', 'Discovering', 'Draining', 'Dreaming', 'Driping', 'Drying', 'Earning', 'Emptying', 'Ending', 'Enjoying', 'Escaping', 'Examining', 'Exciting', 'Existing', 'Expecting', 'Explaining', 'Facing', 'Fastening', 'Fencing', 'Filing', 'Flooding', 'Flowing', 'Fooling', 'Forcing', 'Frying', 'Gathering', 'Gazing', 'Grabing', 'Grining', 'Guiding', 'Hammering', 'Handing', 'Happening', 'Harming', 'Hovering', 'Huging', 'Hunting', 'Identifying', 'Impressing', 'Including', 'Intending', 'Inviting', 'Itching', 'Jailing', 'Joining', 'Joking', 'Jumping', 'Kicking', 'Killing', 'Kissing', 'Kniting', 'Knoting', 'Labeling', 'Lasting', 'Laughing', 'Learning', 'Liing', 'Liking', 'Loading', 'Loving', 'Maning', 'Managing', 'Mating', 'Mattering', 'Melting', 'Mixing', 'Mourning', 'Moving', 'Muging', 'Naming', 'Needing', 'Noding', 'Noting', 'Noticing', 'Numbering', 'Obeying', 'Occuring', 'Offering', 'Opening', 'Ordering', 'Overflowing', 'Owing', 'Painting', 'Parting', 'Passing', 'Pasting', 'Phoning', 'Placing', 'Playing', 'Polishing', 'Presenting', 'Pressing', 'Pressing', 'Pretending', 'Protecting', 'Pulling', 'Pushing', 'Racing', 'Raining', 'Reaching', 'Realising', 'Recording', 'Refusing', 'Rejecting', 'Relaxing', 'Remaining', 'Reminding', 'Removing', 'Reporting', 'Retiring', 'Returning', 'Risking', 'Rolling', 'Sacking', 'Scaring', 'Signing', 'Signaling', 'Sining', 'Soothing', 'Sounding', 'Sparking', 'Spilling', 'Spoiling', 'Stoping', 'Stuffing', 'Suffering', 'Suggesting', 'Suspecting', 'Talking', 'Taping', 'Terrifying', 'Thanking', 'Tracing', 'Traping', 'Troubling', 'Trusting', 'Trying', 'Tuging', 'Vanishing', 'Wailing', 'Wandering', 'Wanting', 'Washing', 'Wasting', 'Whining', 'Whispering', 'Winking', 'Wondering', 'Wraping', 'Yawning', 'Yelling', 'Ziping', 'Zooming']

/** An array of animals. */
const animals = ['Aardvark', 'Albatross', 'Alligator', 'Alpaca', 'Anole', 'Ant', 'Anteater', 'Antelope', 'Ape', 'Armadillo', 'Baboon', 'Badger', 'Barracuda', 'Bat', 'Bear', 'Beaver', 'Bee', 'Bird', 'Bison', 'Bluebird', 'Boar', 'Bobcat', 'Buffalo', 'Butterfly', 'Camel', 'Capybara', 'Caracal', 'Caribou', 'Cassowary', 'Cat', 'Caterpillar', 'Cheetah', 'Chicken', 'Chimpanzee', 'Chinchilla', 'Chough', 'Coati', 'Cobra', 'Cockroach', 'Cormorant', 'Cougar', 'Coyote', 'Crab', 'Crane', 'Cricket', 'Crocodile', 'Crow', 'Cuckoo', 'Curlew', 'Deer', 'Dhole', 'Dingo', 'Dinosaur', 'Dog', 'Dolphin', 'Donkey', 'Dove', 'Dragonfly', 'Duck', 'Dugong', 'Dunlin', 'Eagle', 'Echidna', 'Eel', 'Eland', 'Elephant', 'Elk', 'Emu', 'Falcon', 'Ferret', 'Finch', 'Fish', 'Fisher', 'Flamingo', 'Fly', 'Flycatcher', 'Fox', 'Frog', 'Gaur', 'Gazelle', 'Gecko', 'Genet', 'Gerbil', 'Giraffe', 'Gnat', 'Gnu', 'Goat', 'Goldfinch', 'Goosander', 'Goose', 'Gorilla', 'Goshawk', 'Grasshopper', 'Grouse', 'Guanaco', 'Gull', 'Hamster', 'Hare', 'Hawk', 'Hedgehog', 'Heron', 'Herring', 'Hippopotamus', 'Hoatzin', 'Hoopoe', 'Hornet', 'Horse', 'Human', 'Hummingbird', 'Hyena', 'Ibex', 'Ibis', 'Iguana', 'Impala', 'Jackal', 'Jaguar', 'Jay', 'Jellyfish', 'Jerboa', 'Kangaroo', 'Kingbird', 'Kingfisher', 'Kinkajou', 'Kite', 'Koala', 'Kodkod', 'Kookaburra', 'Kouprey', 'Kudu', 'Langur', 'Lapwing', 'Lark', 'Lechwe', 'Lemur', 'Leopard', 'Lion', 'Lizard', 'Llama', 'Lobster', 'Locust', 'Loris', 'Louse', 'Lynx', 'Lyrebird', 'Macaque', 'Macaw', 'Magpie', 'Mallard', 'Mammoth', 'Manatee', 'Mandrill', 'Margay', 'Marmoset', 'Marmot', 'Meerkat', 'Mink', 'Mole', 'Mongoose', 'Monkey', 'Moose', 'Mosquito', 'Mouse', 'Myna', 'Narwhal', 'Newt', 'Nightingale', 'Nilgai', 'Ocelot', 'Octopus', 'Okapi', 'Oncilla', 'Opossum', 'Orangutan', 'Oryx', 'Ostrich', 'Otter', 'Ox', 'Owl', 'Oyster', 'Panther', 'Parrot', 'Panda', 'Partridge', 'Peafowl', 'Penguin', 'Pheasant', 'Pig', 'Pigeon', 'Pika', 'Pony', 'Porcupine', 'Porpoise', 'Pug', 'Quail', 'Quelea', 'Quetzal', 'Rabbit', 'Raccoon', 'Rat', 'Raven', 'Reindeer', 'Rhea', 'Rhinoceros', 'Rook', 'Saki', 'Salamander', 'Salmon', 'Sandpiper', 'Sardine', 'Sassaby', 'Seahorse', 'Seal', 'Serval', 'Shark', 'Sheep', 'Shrew', 'Shrike', 'Siamang', 'Skink', 'Skipper', 'Skunk', 'Sloth', 'Snail', 'Snake', 'Spider', 'Spoonbill', 'Squid', 'Squirrel', 'Starling', 'Stilt', 'Swan', 'Tamarin', 'Tapir', 'Tarsier', 'Termite', 'Thrush', 'Tiger', 'Toad', 'Topi', 'Toucan', 'Trout', 'Turaco', 'Turkey', 'Turtle', 'Unicorn', 'Urchin', 'Vicuna', 'Vinegaroon', 'Viper', 'Vulture', 'Wallaby', 'Walrus', 'Wasp', 'Waxwing', 'Weasel', 'Whale', 'Wobbegong', 'Wolf', 'Wolverine', 'Wombat', 'Woodpecker', 'Worm', 'Wren', 'Yak', 'Zebra']
