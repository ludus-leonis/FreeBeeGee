/**
 * @file Various HTML/browser helpers.
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

// --- HTML5 + browser ---------------------------------------------------------

/**
 * Access the ?x=y query-string of the current page.
 *
 * @param {string} name Name of parameter.
 * @returns {string} Value of parameter. Defaults to '' if parameter is missing.
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
 * @param {string} key Name of the store item.
 * @param {boolean} local If true, the localStorage will be used. Otherwise the
 *                        sessionStorage will be used.
 * @returns {(string | undefined)} Retrieved value.
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
 * @param {string} key Name of the store item.
 * @param {string} property Property in the JSON stored in the store item.
 * @param {boolean} local If true, the localStorage will be used. Otherwise the
 *                        sessionStorage will be used.
 * @returns {(string | undefined)} Retrieved value.
 */
export function getStoreValue (key, property, local = true) {
  return getStoreValues(key, local)[property]
}

/**
 * Set a value in an HTML5 browser store.
 *
 * Transparent fallback to in-memory map if session store is not available.
 *
 * @param {string} key Name of the store item.
 * @param {string} property Property in the JSON stored in the store item.
 * @param {string} value Value to store.
 * @param {boolean} local If true, the localStorage will be used. Otherwise the
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
 * Remove a key in an HTML5 browser store.
 *
 * Transparent fallback to in-memory map if session store is not available.
 *
 * @param {string} key Name of the store item.
 * @param {boolean} local If true, the localStorage will be used. Otherwise the
 *                        sessionStorage will be used.
 */
export function removeStoreValue (key, local = true) {
  if (typeof Storage !== 'undefined') {
    const store = local ? globalThis.localStorage : globalThis.sessionStorage
    store.removeItem(key)
  } else {
    fallbackStore.delete(key)
  }
}

/**
 * Switch browser to fullscreen or back again.
 *
 * @returns {boolean} True, if screen is now in fullscreen.
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
 * @param {object} image Element to shrink (image, canvas).
 * @param {number} dimension Size to shrink to.
 * @returns {HTMLCanvasElement} Canvas with resized image. Does not honor aspect ratio and will deform.
 */
export function resizeImage (image, dimension) {
  const canvas = document.createElement('canvas')
  canvas.width = dimension
  canvas.height = dimension
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dimension, dimension)
  return canvas
}

/**
 * Enforce content length on input change.
 *
 * Mainly useful for <textarea> and UTF8/Emoji input, that does not work well with
 * max-length. Reports new content length to an optional callback.
 *
 * @param {HTMLElement} input Input to watch
 * @param {number} maxLength Maximum content length in bytes.
 * @param {Function} callback Will be called after each content change with the current content length.
 * @returns {number} Current/trimmed content length in bytes.
 */
export function inputMaxLength (input, maxLength, callback) {
  input.previousValue = input.value

  input.addEventListener('input', event => {
    const input = event.target
    if (encodeURIComponent(input.value).replace(/%[A-F\d]{2}/g, 'U').length > maxLength) {
      const cursorPosition = input.selectionStart
      const changeLength = getChangeLength(input.previousValue, input.value)
      input.value = input.previousValue
      input.selectionEnd = cursorPosition - changeLength
    } else {
      input.previousValue = input.value
    }
    if (callback) callback(encodeURIComponent(input.value).replace(/%[A-F\d]{2}/g, 'U').length)
  })

  const length = encodeURIComponent(input.value).replace(/%[A-F\d]{2}/g, 'U').length
  if (callback) callback(length)
  return length
}

// --- color -------------------------------------------------------------------

/**
 * Calculate brightness of an HTML hex-color value.
 *
 * @param {string} color E.g. '#ff0000'
 * @returns {number} Grayscale brightness of color (0..255), e.g. 85.
 */
export function brightness (color) {
  if (color === 'transparent') return 255 // all and nothing
  const r = parseInt(color.substring(1, 3), 16)
  const g = parseInt(color.substring(3, 5), 16)
  const b = parseInt(color.substring(5, 7), 16)
  return (r + g + b) / 3
}

// --- private -----------------------------------------------------------------

/**
 * Find the length of the largest difference between two strings.
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @returns {number} Length of the difference.
 */
export function getChangeLength (a, b) {
  let shorter = a.length < b.length ? a.split('') : b.split('')
  let longer = a.length < b.length ? b.split('') : a.split('')

  while (shorter.length > 0 && shorter[0] === longer[0]) { // chop front
    shorter.shift()
    longer.shift()
  }

  shorter = shorter.reverse()
  longer = longer.reverse()

  while (shorter.length > 0 && shorter[0] === longer[0]) { // chop 'end'
    shorter.shift()
    longer.shift()
  }

  return longer.length
}

/**
 * Fake tabular numbers by padding them with fixed-size spans.
 *
 * @param {string} text String to parse for numbers.
 * @returns {string} HTML markup.
 */
export function fakeTabularNums (text) {
  return text.replace(/([0-9])/g, '<span class="is-tabular">$1</span>')
}

// --- private -----------------------------------------------------------------

const fallbackStore = new Map() // in-memory fallback 'store'
