/**
 * @file Utility functions that operate on (cached) table data, e.g. searching
 *       pieces. Does not do any API calls, only operates on pre-downloaded
 *       data. Does not know about DOM/nodes.
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

import _ from '../../../lib/FreeDOM.mjs'

import {
  FLAGS,
  getRoom,
  getSetup,
  getLibrary,
  getTable,
  getTableNo,
  isLayerActive
} from '../../../state/index.mjs'

import {
  clamp,
  snapGrid,
  snapHex,
  snapHex2,
  intersect,
  contains,
  getDimensionsRotated,
  mod
} from '../../../lib/utils.mjs'

import {
  hash
} from '../../../lib/utils-text.mjs'

import {
  DEMO_MODE
} from '../../../api/index.mjs'

export const TYPE_SQUARE = 'grid-square'
export const TYPE_HEX = 'grid-hex'
export const TYPE_HEX2 = 'grid-hex2'

export const stickyNoteColors = [
  { name: 'Yellow', value: '#ffeba6' },
  { name: 'Orange', value: '#fdce97' },
  { name: 'Green', value: '#bffabb' },
  { name: 'Blue', value: '#bbe7fa' },
  { name: 'Pink', value: '#f4a0c6' }
]

export const LAYER_TILE = 'tile'
export const LAYER_STICKER = 'sticker'
export const LAYER_NOTE = 'note'
export const LAYER_TOKEN = 'token'
export const LAYER_OTHER = 'other'
export const LAYERS = [ // reverse order
  LAYER_TILE,
  LAYER_STICKER,
  LAYER_NOTE,
  LAYER_TOKEN,
  LAYER_OTHER
]

export const assetTypes = [
  LAYER_TILE,
  LAYER_TOKEN,
  LAYER_STICKER,
  LAYER_OTHER,
  'badge'
]

/**
 * Find the name for a layer index.
 *
 * @param {number} layer Layer index, 1-based.
 * @returns {string} Layer name, e.g. 'sticker'.
 */
function layerToName (layer) {
  return LAYERS[layer - 1]
}

/**
 * Find the index of a layer name.
 *
 * @param {string} name Name of layer, e.g. 'sticker'.
 * @returns {number} Layer index.
 */
export function nameToLayer (name) {
  return LAYERS.indexOf(name) + 1
}

export const ID = {
  POINTER: 'ZZZZZZZZ',
  LOS: 'ZZZZZZZY',
  SELECT: 'ZZZZZZZZX'
}

/**
 * Find a piece by ID.
 *
 * @param {string} id ID to lookup.
 * @param {number} no Table number, defaults to current one.
 * @returns {object} Piece, or null if not found.
 */
export function findPiece (id, no = getTableNo()) {
  for (const piece of getTable(no)) {
    if (piece.id === id) {
      return piece
    }
  }

  return null
}

/**
 * Find an asset by ID.
 *
 * @param {string} id ID to lookup.
 * @param {string} layer Optional layer to limit/speed up search.
 * @returns {object} Asset, or null if not found.
 */
export function findAsset (id, layer = 'any') {
  const library = getLibrary()

  for (const assetType of assetTypes) {
    if (layer === assetType || layer === 'any') {
      for (const asset of library[assetType]) {
        if (asset.id === id) return asset
      }
    }
  }

  return null
}

/**
 * Find an asset by ID.
 *
 * @param {string} name Alias to lookup.
 * @param {string} layer Optional layer to limit/speed up search.
 * @returns {object} First found asset with the given name.
 */
export function findAssetByAlias (name, layer = 'any') {
  const library = getLibrary()

  for (const assetType of assetTypes) {
    if (layer === assetType || layer === 'any') {
      for (const asset of library[assetType]) {
        if (asset.name === name) return asset
      }
    }
  }

  return null
}

/**
 * Find an asset by ID.
 *
 * @param {string} id Asset ID to lookup.
 * @returns {number} Count of pieces using that asset across all tables.
 */
export function countAssets (id) {
  let count = 0

  for (let no = 1; no <= 9; no++) {
    for (const piece of getTable(no)) {
      if (piece.a === id) {
        count++
      }
    }
  }

  return count
}

/**
 * Assemble a CSS URL for an asset in a room.
 *
 * @param {string} room Room name.
 * @param {string} type Asset type.
 * @param {string} file File name.
 * @param {boolean} demo If true, a demo-mode url will be created instead.
 * @returns {string} URL to be used in a CSS url('..') expression.
 */
export function getRoomMediaURL (room, type, file, demo = false) {
  if (demo) {
    return `demo/${getRoom().setup.name}/assets/${type}/${file}`
  } else {
    return `api/data/rooms/${room}/assets/${type}/${file}`
  }
}

/**
 * Get the URL for an asset media.
 *
 * @param {object} asset Asset to get URL for.
 * @param {number} side Side/media to get, -2 = mask, -1 = base. Defaults to 0=first.
 * @returns {string} URL to be used in url() or img.src.
 */
export function getAssetURL (asset, side = 0) {
  if (side >= asset.media.length) {
    return getRoomMediaURL(getRoom().name, 'material', 'none.png', DEMO_MODE)
  }
  switch (side) {
    case -2:
      return getRoomMediaURL(getRoom().name, asset.type, asset.mask, DEMO_MODE)
    case -1:
      return getRoomMediaURL(getRoom().name, asset.type, asset.base, DEMO_MODE)
    default:
      return getRoomMediaURL(getRoom().name, asset.type, asset.media[side], DEMO_MODE)
  }
}

/**
 * Get proper top-left coordinates for a piece.
 *
 * Takes into account that rotated pieces have a different offset to its center
 * than the original as CSS 'transform: rotate()' rotates round the original center.
 *
 * @param {object} piece A game piece to operate on.
 * @param {number} x X coordinate of supposed center (defaults to piece.x)
 * @param {number} y Y coordinate of supposed center (defaults to piece.y)
 * @returns {object} Numeric coordinates as { top, left }.
 */
export function getTopLeft (piece, x = piece.x, y = piece.y) {
  const jitterX = piece.l === LAYER_TOKEN ? Math.abs(hash('x' + piece.id)) % 5 - 2 : 0
  const jitterY = piece.l === LAYER_TOKEN ? Math.abs(hash('y' + piece.id)) % 5 - 2 : 0

  return {
    left: x - piece._meta.widthPx / 2 - piece._meta.originOffsetXPx + jitterX,
    top: y - piece._meta.heightPx / 2 - piece._meta.originOffsetYPx + jitterY
  }
}

/**
 * Get the area in px a piece covers.
 *
 * @param {object} piece A game piece to operate on.
 * @returns {object} Bounds as { top, left, bottom, right}.
 */
export function getPieceBounds (piece) {
  return {
    left: piece.x - piece._meta.widthPx / 2,
    right: piece.x + piece._meta.widthPx / 2 - 1,
    top: piece.y - piece._meta.heightPx / 2,
    bottom: piece.y + piece._meta.heightPx / 2 - 1
  }
}

/**
 * Find all pieces at least parcially within a grid area.
 *
 * @param {object} rect Rectangle object, containing top/left/bottom/right.
 * @param {string} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
export function findPiecesWithin (rect, layer = 'all', no = getTableNo()) {
  const pieces = []

  for (const piece of getTable(no)) {
    if (piece.l === layer || layer === 'all') {
      if (intersect(rect, getPieceBounds(piece))) {
        pieces.push(piece)
      }
    }
  }

  return pieces
}

/**
 * Find all pieces 100% within a grid area.
 *
 * @param {object} rect Rectangle object, containing top/left/bottom/right.
 * @param {string} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
export function findPiecesContained (rect, layer = 'all', no = getTableNo()) {
  const pieces = []

  for (const piece of getTable(no)) {
    if (piece.l === layer || layer === 'all') {
      if (contains(rect, getPieceBounds(piece))) {
        pieces.push(piece)
      }
    }
  }

  return pieces
}

/**
 * Find all pieces that are expired.
 *
 * @param {number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are expired.
 */
export function findExpiredPieces (no = getTableNo()) {
  const pieces = []

  const now = new Date()
  for (const piece of getTable(no)) {
    if (piece._meta.expires <= now) {
      pieces.push(piece)
    }
  }

  return pieces
}

/**
 * Sort pieces based on bounding box coordinates, from top-left to bottom-right.
 *
 * @param {object[]} pieces Array of pieces.
 * @returns {object} Object with features & bounds.
 */
export function sortPiecesXY (pieces) {
  return pieces.sort((a, b) => {
    const d = (a.x + a.y) - (b.x + b.y)
    if (d === 0) {
      return (a.x - b.x)
    } else {
      return d
    }
  })
}

/**
 * Determine the featureset all given pieces support. Also calculates bounds.
 *
 * @param {object[]} pieces Array of pieces.
 * @returns {object} Object with features & bounds.
 */
export function getFeatures (pieces) {
  const semi = [FEATURE_DICEMAT, FEATURE_DISCARD]

  const features = pieces.length > 0
    ? {
        edit: pieces.length === 1,
        flip: true,
        random: true,
        top: true,
        bottom: true,
        color: true,
        border: true,
        number: true,
        rotate: true,

        // potentially protected
        move: false,
        pile: false,
        clone: false,
        delete: false,

        boundingBox: {
          top: Number.MAX_VALUE,
          left: Number.MAX_VALUE,
          right: Number.MIN_VALUE,
          bottom: Number.MIN_VALUE,
          w: 0,
          h: 0,
          center: { x: 0, y: 0 }
        }
      }
    : {
        edit: false,
        rotate: false,
        flip: false,
        random: false,
        top: false,
        bottom: false,
        color: false,
        border: false,
        number: false,

        move: false,
        pile: false,
        clone: false,
        delete: false,

        boundingBox: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          w: 1,
          h: 1,
          center: { x: 0, y: 0 }
        }
      }

  let moveable = 0
  for (const piece of pieces) {
    if (piece.l === LAYER_OTHER) features.rotate = false
    if (!(piece.f & FLAGS.NO_CLONE)) features.clone = true // at least one found
    if (!(piece.f & FLAGS.NO_DELETE)) features.delete = true // at least one found
    if (!(piece.f & FLAGS.NO_MOVE)) {
      features.move = true // at least one found
      moveable++
    }
    if (!piece._meta?.hasColor) features.color = false
    if (!piece._meta?.hasBorder) features.border = false
    if (piece.l !== LAYER_TOKEN) features.number = false

    if ((piece._meta?.sides ?? 1) + (piece._meta?.sidesExtra ?? 0) <= 1) features.flip = false
    if (semi.includes(piece._meta?.feature)) features.flip = false

    if ((piece._meta?.sides ?? 1) <= 1 && !semi.includes(piece._meta?.feature)) features.random = false

    // plus/minus half-size of item?
    if (piece.x - piece._meta.widthPx / 2 < (features.boundingBox.left ?? Number.MAX_VALUE)) {
      features.boundingBox.left = Math.round(piece.x - piece._meta.widthPx / 2)
    }
    if (piece.x + piece._meta.widthPx / 2 > (features.boundingBox.right ?? Number.MIN_VALUE)) {
      features.boundingBox.right = Math.round(piece.x + piece._meta.widthPx / 2 - 1)
    }
    if (piece.y - piece._meta.heightPx / 2 < (features.boundingBox.top ?? Number.MAX_VALUE)) {
      features.boundingBox.top = Math.round(piece.y - piece._meta.heightPx / 2)
    }
    if (piece.y + piece._meta.heightPx / 2 > (features.boundingBox.bottom ?? Number.MIN_VALUE)) {
      features.boundingBox.bottom = Math.round(piece.y + piece._meta.heightPx / 2 - 1)
    }
    features.boundingBox.w = features.boundingBox.right - features.boundingBox.left + 1
    features.boundingBox.h = features.boundingBox.bottom - features.boundingBox.top + 1
    features.boundingBox.center = {
      x: Math.floor((features.boundingBox.right + features.boundingBox.left + 1) / 2),
      y: Math.floor((features.boundingBox.bottom + features.boundingBox.top + 1) / 2)
    }
  }

  if (moveable > 1) features.pile = true

  return features
}

/**
 * Remove excess fields and force ranges to be within 0..n.
 *
 * @param {object} patch Piece patch to sanitize.
 * @param {string} pieceId Optional corresponding piece ID for additional tests.
 * @returns {object} Sanitized piece.
 */
export function sanitizePiecePatch (patch, pieceId = null) {
  const r = getRoom()
  const t = getSetup()
  const p = pieceId === null ? null : findPiece(pieceId)
  const result = {}
  let colors
  for (const field in patch) {
    switch (field) {
      case 'c':
        result[field] = []
        colors = p?.l === LAYER_NOTE ? stickyNoteColors.length : (t.colors.length + 1)
        if (patch[field][0] !== undefined) result[field].push(mod(patch[field][0], colors))
        if (patch[field][1] !== undefined) result[field].push(mod(patch[field][1], t.borders.length + 1))
        break
      case 'x':
        result[field] = clamp(0, patch[field], r.width - 1)
        break
      case 'y':
        result[field] = clamp(0, patch[field], r.height - 1)
        break
      case 'w':
      case 'h':
        result[field] = clamp(1, patch[field], 32)
        break
      case 's':
        result[field] = mod(
          patch[field],
          (p?._meta?.sides ?? findAsset(p?.a)?.media.length ?? 1) + (p?._meta?.sidesExtra ?? 0)
        )
        break
      case 'n':
        result[field] = mod(patch[field], 36)
        break
      case 'r':
        result[field] = mod(patch[field], 360)
        break
      case 'f':
        result[field] = patch[field] & 0b11111111
        break
      case 'l':
      case 'id':
      case 'a':
      case 'b':
      case 'z':
      case 't':
      case 'expires':
        result[field] = patch[field]
        break
      default:
        // skip unknown
    }
  }

  return result
}

/**
 * Add default properties to all library entries.
 *
 * @param {object} library Data object to populate.
 * @returns {Array} Setup for chaining.
 */
export function populateLibraryDefaults (library) {
  library.sticker = library.sticker ?? []
  library.tile = library.tile ?? []
  library.token = library.token ?? []
  library.other = library.other ?? []
  library.badge = library.badge ?? []
  library.material = library.material ?? []

  for (const piece of library.sticker) {
    populateAssetDefaults(piece)
  }
  for (const piece of library.tile) {
    populateAssetDefaults(piece)
  }
  for (const piece of library.token) {
    populateAssetDefaults(piece)
  }
  for (const piece of library.other) {
    populateAssetDefaults(piece)
  }

  return library
}

/**
 * Add default setup values to all properties that the API might omit.
 *
 * @param {object} setup Data object to populate.
 * @returns {Array} Setup for chaining.
 */
export function populateSetupDefaults (setup) {
  setup.borders = setup.borders ?? []

  setup._meta = {
    widthPx: setup.gridWidth * setup.gridSize,
    heightPx: setup.gridHeight * setup.gridSize
  }

  return setup
}

export const FEATURE_DICEMAT = 'DICEMAT'
export const FEATURE_DISCARD = 'DISCARD'

/**
 * Add default asset properties that the API might omit.
 *
 * @param {object} asset Data object to populate.
 * @returns {object} Asset for chaining.
 */
export function populateAssetDefaults (asset) {
  asset.w = asset.w ?? 1
  asset.h = asset.h ?? asset.w
  if (['token', 'tile', 'other'].includes(asset.type)) {
    asset.d = asset.d ?? 2
  } else {
    asset.d = asset.d ?? 0
  }

  asset._hash = hash(JSON.stringify(asset))

  return asset
}

/**
 * Add default piece values to all properties that the API might omit.
 *
 * @param {object} piece Data object to populate.
 * @param {object} headers Optional headers object (for date checking).
 * @returns {object} Piece for chaining.
 */
export function populatePieceDefaults (piece, headers = null) {
  const colors = getSetup().colors

  piece.l = layerToName(piece.l ?? 0)
  piece.w = piece.w ?? 1
  piece.h = piece.h ?? piece.w
  piece.s = piece.s ?? 0
  piece.c = piece.c ?? [0, 0]
  piece.c[0] = piece.c[0] ?? 0
  piece.c[0] = piece.c[0] <= colors.length ? piece.c[0] : 0
  piece.c[1] = piece.c[1] ?? 0
  piece.c[1] = piece.c[1] <= colors.length ? piece.c[1] : 0
  piece.r = piece.r ?? 0
  piece.n = piece.n ?? 0
  piece.t = piece.t ?? []
  piece.b = piece.b ?? []
  piece.f = piece.f ?? 0

  // add client-side meta information for piece
  piece._meta = {}
  const setup = getSetup()
  if (piece.id === ID.LOS) {
    piece._meta.originWidthPx = piece.w
    piece._meta.originHeightPx = piece.h
    piece._meta.widthPx = piece.w
    piece._meta.heightPx = piece.h
    piece._meta.originOffsetXPx = 0
    piece._meta.originOffsetYPx = 0
  } else {
    piece._meta.originWidthPx = piece.w * setup.gridSize
    piece._meta.originHeightPx = piece.h * setup.gridSize
    const rect = getDimensionsRotated(piece._meta.originWidthPx, piece._meta.originHeightPx, piece.r)
    piece._meta.widthPx = Math.round(rect.w)
    piece._meta.heightPx = Math.round(rect.h)
    piece._meta.originOffsetXPx = Math.round((piece._meta.originWidthPx - rect.w) / 2)
    piece._meta.originOffsetYPx = Math.round((piece._meta.originHeightPx - rect.h) / 2)
  }

  // add client-side meta information for asset
  const asset = findAsset(piece.a)
  if (asset) {
    const bgImage = getAssetURL(asset, asset.base ? -1 : piece.s)
    if (bgImage.match(/(png|svg)$/i)) piece._meta.mask = bgImage
    if (asset.mask) piece._meta.mask = getAssetURL(asset, -2)
    if (piece.l === LAYER_TOKEN && piece.w <= 8 && piece.h <= 8) piece._meta.mask = `img/mask/token-${piece.w}x${piece.h}.svg`
    piece._meta.sides = asset.media.length ?? 1
    piece._meta.sidesExtra = (piece.l === LAYER_TOKEN && piece._meta.sides === 1) ? 1 : 0

    if (asset.id === ID.POINTER) {
      piece._meta.feature = 'POINTER'
    } else {
      switch (asset.name) {
        case '_.dicemat':
          piece._meta.feature = FEATURE_DICEMAT
          break
        case '_.discard':
          piece._meta.feature = FEATURE_DISCARD
          break
      }
    }

    if (asset.bg?.match(/^[0-9][0-9]?$/)) {
      piece._meta.hasColor = true
    } else {
      piece._meta.hasColor = false
    }
    piece._meta.hasBorder = piece.l === LAYER_TOKEN
    if (asset.type === LAYER_TOKEN || piece._meta.hasColor === true || bgImage.match(/(jpg|jpeg)$/i)) {
      piece._meta.hasHighlight = true
    } else {
      piece._meta.hasHighlight = false
    }
  }

  // header/expires information
  if (piece.expires && headers) {
    piece._meta.expires = new Date()
    piece._meta.expires.setSeconds(piece._meta.expires.getSeconds() + piece.expires - Number(headers.get('servertime')))
  }

  return piece
}

/**
 * Add default values to all properties that the API might omit.
 *
 * Also tosses out expired pieces.
 *
 * @param {object[]} pieces Data objects to populate.
 * @param {object} headers Optional headers object (for date checking).
 * @returns {object[]} Pieces array for chaining.
 */
export function populatePiecesDefaults (pieces, headers = null) {
  const nonExpired = []
  const now = new Date()
  for (const piece of pieces) {
    populatePieceDefaults(piece, headers)
    if (piece._meta.expires) {
      if (piece._meta.expires > now) {
        nonExpired.push(piece)
      }
    } else {
      nonExpired.push(piece)
    }
  }
  return nonExpired
}

/**
 * Determine the lowest z-index in use by the pieces in a layer.
 *
 * @param {string} layer Name of a layer, e.g. LAYER_TILE.
 * @param {object} area Bounding rect in px to check pieces at least partly within.
 * @returns {number} Lowest CSS z-index, or 0 if layer is empty.
 */
export function getMinZ (layer, area = {
  left: 0,
  top: 0,
  right: Number.MAX_VALUE,
  bottom: Number.MAX_VALUE
}) {
  let minZ = Number.MAX_VALUE
  for (const piece of findPiecesWithin(area, layer)) {
    if (piece.z < minZ) {
      minZ = piece.z
    }
  }
  return minZ === Number.MAX_VALUE ? 0 : minZ // start at 0
}

/**
 * Sort pieces by their Z value.
 *
 * @param {object[]} pieces Array of pieces to sort.
 * @returns {object[]} Given array, with sorted Z values (highest first).
 */
export function sortZ (pieces) {
  return pieces.sort((a, b) => b.z - a.z)
}

/**
 * Determine the highest z-index in use by the pieces in a layer.
 *
 * @param {string} layer Name of a layer, e.g. LAYER_TILE.
 * @param {object} area Bounding rect in px to check pieces at least partly within.
 * @returns {number} Highest CSS z-index, or 0 if area in layer is empty.
 */
export function getMaxZ (layer, area = {
  left: 0,
  top: 0,
  right: Number.MAX_VALUE,
  bottom: Number.MAX_VALUE
}) {
  let maxZ = Number.MIN_VALUE
  for (const piece of findPiecesWithin(area, layer)) {
    if (piece.z > maxZ) {
      maxZ = piece.z
    }
  }

  return maxZ === Number.MIN_VALUE ? 0 : maxZ // start at 0
}

/**
 * Determine rectancle all items on the room are within in px.
 *
 * @param {number} no Table number to work on, defaults to current.
 * @returns {object} Object with top/left/bottom/right/width/height in px of main content.
 */
export function getContentRect (no = getTableNo()) {
  const rect = {
    left: Number.MAX_VALUE,
    top: Number.MAX_VALUE,
    right: Number.MIN_VALUE,
    bottom: Number.MIN_VALUE
  }
  const tableData = getTable(no)

  // provide default for empty rooms
  if (!tableData || tableData.length < 1) {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0
    }
  }

  // calculate values for non-empty rooms
  for (const piece of tableData) {
    const left = piece.x - piece._meta.widthPx / 2
    const top = piece.y - piece._meta.heightPx / 2
    const right = piece.x + piece._meta.widthPx / 2 - 1
    const bottom = piece.y + piece._meta.heightPx / 2 - 1

    rect.left = rect.left < left ? rect.left : left
    rect.top = rect.top < top ? rect.top : top
    rect.right = rect.right > right ? rect.right : right
    rect.bottom = rect.bottom > bottom ? rect.bottom : bottom
    rect.width = rect.right - rect.left + 1
    rect.height = rect.bottom - rect.top + 1
  }

  return rect
}

/**
 * Create a new piece from an asset.
 *
 * @param {number} assetId ID of asset.
 * @param {number} x X-position (px).
 * @param {number} y Y-position (px).
 * @returns {object} Piece data object.
 */
export function createPieceFromAsset (assetId, x = 0, y = 0) {
  const asset = findAsset(assetId)
  const xy = snap(x, y)

  const piece = populatePieceDefaults(clampToTableSize({
    a: asset.id,
    l: nameToLayer(asset.type),
    w: asset.w,
    h: asset.h,
    x: xy.x,
    y: xy.y,
    z: getMaxZ(asset.layer) + 1
  }))

  if (piece._meta.hasColor) {
    piece.c[0] = Number.parseInt(asset.bg) // use asset suggestion for starter
  }

  return piece
}

/**
 * Make sure a piece is on the room by clipping x/y based on table size.
 *
 * @param {object} piece Piece to clamp.
 * @returns {object} Clamped piece.
 */
export function clampToTableSize (piece) {
  const room = getRoom()
  piece.x = clamp(0, piece.x, room.width - 1)
  piece.y = clamp(0, piece.y, room.height - 1)
  return piece
}

/**
 * Snap a coordinate to the closest hex position / grid.
 *
 * @param {number} x X-coordinate to snap.
 * @param {number} y Y-coordiante to snap.
 * @param {number} lod Optional level of detail for snapping.
 *                     1 = centers,
 *                     2 = centers + corners,
 *                     3 = centers + corners + sides (default)
 *                     4 = no snap
 * @returns {object} Closest grid vertex to original x/y as {x, y}.
 */
export function snap (x, y, lod = 3) {
  if (lod >= 4) return { x: Math.round(x), y: Math.round(y) } // disabled snap

  const setup = getSetup()
  if (setup.snap === false) {
    return snapGrid(x, y, 8, 3) // snap to 4px
  }
  switch (setup.type) {
    case TYPE_HEX:
      return snapHex(x, y, setup.gridSize, lod)
    case TYPE_HEX2:
      return snapHex2(x, y, setup.gridSize, lod)
    default:
      return snapGrid(x, y, setup.gridSize, lod)
  }
}

/**
 * Calculate the center of the setup on the room.
 *
 * Iterates over all pieces and averages their centers. Empty tables are considered
 * to be centered on the whole table.
 *
 * @param {number} no Table number. Defaults to current one.
 * @returns {object} Object with x and y.
 */
export function getSetupCenter (no = getTableNo()) {
  const setup = getSetup()
  const rect = getContentRect(no)

  // use table center for empty tables
  if (rect.bottom <= 0 && rect.right <= 0) {
    return {
      x: (setup.gridSize * setup.gridWidth) / 2,
      y: (setup.gridSize * setup.gridHeight) / 2
    }
  }

  // calculate setup center otherwise
  return {
    x: rect.left + (rect.right - rect.left - 1) / 2,
    y: rect.top + (rect.bottom - rect.top - 1) / 2
  }
}

/**
 * Extract parts (group, name, size, etc.) from an asset filename and guess best type.
 *
 * @param {string} assetName Asset filename.
 * @returns {object} Parsed elements.
 */
export function splitAssetFilename (assetName) {
  const data = {}

  let match = assetName.match(/^(.*)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
  }

  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = Number(match[4])
  }

  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = 1
  }

  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6}|transparent|[0-9]+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = Number(match[4])
    data.bg = match[5]
  }

  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)\.([a-fA-F0-9]{6}|transparent|[0-9]+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = 1
    data.bg = match[4]
  }

  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6}|transparent|[0-9]+)([.-][a-z]+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = Number(match[4])
    data.bg = match[5]
    data.tx = match[6].substr(1)
  }

  match = assetName.match(/^(.*)\.([0-9]+)x([0-9]+)\.([a-fA-F0-9]{6}|transparent|[0-9]+)([.-][a-z]+)\.[a-zA-Z0-9]+$/)
  if (match) {
    data.name = match[1]
    data.w = Number(match[2])
    data.h = Number(match[3])
    data.s = 1
    data.bg = match[4]
    data.tx = match[5].substr(1)
  }

  // guess the asset type
  if (data.w) data.type = LAYER_TILE
  if (data.w === data.h && data.w <= 3) data.type = LAYER_TOKEN

  return data
}

/**
 * Determine if a piece is not transparent at a given coordinate.
 *
 * Does this by creating a temporary in-memory canvas and checking against its
 * alpha layer. Rotation is implicitly done by the browser as CSS 'transform:'
 * also rotates/scales click x/y.
 *
 * @param {object} piece Piece to check.
 * @param {number} x X-coordiante in px.
 * @param {number} y Y-coordiante in px.
 * @returns {Promise<boolean>} True if pixel at x/y is transparent, false otherwise.
 */
export function isSolid (piece, x, y) {
  const setup = getSetup()
  let mask

  if (!piece) {
    return Promise.resolve(true) // no piece = no checking
  } else if (piece.l === LAYER_TOKEN) {
    mask = `data:image/svg+xml;base64,${btoa(getTokenMaskSVG(piece.w, piece.h))}`
  } else if (!piece._meta?.mask) {
    return Promise.resolve(true) // no mask = full area is hit area
  } else {
    mask = piece._meta.mask
  }

  // now do the hit detection
  return new Promise((resolve, reject) => {
    const img = new Image() // eslint-disable-line no-undef
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (err) => reject(err))
    img.src = mask
  }).then(img => {
    const width = piece.w * setup.gridSize
    const height = piece.h * setup.gridSize

    // calculate img->canvas scale,
    // compensate for 'background-size: cover'
    let sX = 0
    let sY = 0
    let sW = img.width * 1.0
    let sH = img.height * 1.0
    const sAspect = img.width * 1.0 / img.height
    const cAspect = width * 1.0 / height
    if (sAspect < cAspect) { // source higher
      const scale = width / sW
      sH = height / scale
      sY = (img.height - sH) / 2
    } else { // source wider
      const scale = height / sH
      sW = width / scale
      sX = (img.width - sW) / 2
    }

    // draw & check pixel
    const scale = 2 // we don't need full resolution for checking
    const c = document.createElement('canvas')
    c.width = width / scale
    c.height = height / scale
    const ctx = c.getContext('2d')
    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, c.width, c.height)
    const alpha = ctx.getImageData(x / scale, y / scale, 1, 1).data[3]
    return alpha > 4 // alpha value
  }).catch(() => {
    return true // we can't load the image so our best guess is it is solid
  })
}

/**
 * Click-thru transparent areas of clickable pieces.
 *
 * If clicked on an 100% alpha area, try to find a better target
 * for the event by traversing all layers + object on the same coordnate.
 *
 * @param {Element} node DOM node that triggered the click event.
 * @param {object} coords {x, y} of the current mouse coordinates.
 * @param {object} target If not null, the caller thinks this is the target.
 * @returns {Promise<Element>} Real click target.
 */
export function findRealClickTarget (node, coords, target = null) {
  // find all potential pieces in all layers.
  const pieces = []
  if (node.piece) pieces.push(node.piece)
  const index = node.piece ? nameToLayer(node.piece.l) : LAYERS.length - 1
  for (const layer of LAYERS.slice().reverse()) {
    if (nameToLayer(layer) <= index && isLayerActive(layer)) { // we don't need to check higher layers
      pieces.push(...sortZ(findPiecesWithin({
        left: coords.x,
        top: coords.y,
        right: coords.x,
        bottom: coords.y
      }, layer)))
    }
  }

  return _iterateClickTargetsAsync(pieces, coords)
}

/**
 * Create a mask in the shape of a token.
 *
 * Includes our padding and rounded corners.
 *
 * @param {number} w Width of token.
 * @param {number} h Height of token.
 * @param {number} p Padding of token.
 * @returns {string} SVG-as-string in shape of the token.
 */
function getTokenMaskSVG (w, h, p = 3) {
  let mask = `<svg width="${w * 64}" height="${h * 64}" viewBow="0 0 ${w * 64} ${h * 64}" xmlns="http://www.w3.org/2000/svg">`
  if (w === h && (w === 1 || w === 2)) { // 1x1, 2x2 = circle
    mask += `<circle style="fill:#000;stroke:none" cx="${64 * w / 2}" cy="${64 * h / 2}" r="${32 * w - p}"/>`
  } else if (w === 1) { // 1xY
    mask += `<path style="fill:#000000;stroke:none" d="M ${64 - p},32 A ${32 - p},${32 - p} 0 0 0 32,${p} ${32 - p},${32 - p} 0 0 0 ${p},32 v ${h * 64 - 64} a ${32 - p},${32 - p} 0 0 0 ${32 - p},${32 - p} ${32 - p},${32 - p} 0 0 0 ${32 - p},-${32 - p} z" />`
  } else if (h === 1) { // Xx1
    mask += `<path style="fill:#000000;stroke:none" d="M 32,${p} A ${32 - p},${32 - p} 0 0 0 ${p},32 ${32 - p},${32 - p} 0 0 0 32,${64 - p} H ${w * 64 - 32} A ${32 - p},${32 - p} 0 0 0 ${w * 64 - p},32 ${32 - p},${32 - p} 0 0 0 ${w * 64 - 32},${p} Z" />`
  } else {
    const dw = 64 + 64 * (w - 2)
    const dh = 64 + 64 * (h - 2)
    mask += `<path style="fill:#000;stroke:none" d="M 64 ${p} A ${64 - p} ${64 - p} 0 0 0 ${p} 64 L ${p} ${dh} A ${64 - p} ${64 - p} 0 0 0 64 ${64 * h - p} L ${dw} ${64 * h - p} A ${64 - p} ${64 - p} 0 0 0 ${64 * w - p} ${dh} L ${64 * w - p} 64 A ${64 - p} ${64 - p} 0 0 0 ${dw} ${p} L 64 ${p} z " />`
  }
  mask += '</svg>'

  return mask
}

/**
 * Find a click targetpiece in an array of potential pieces.
 *
 * Honors transparent areas. Needs to be async to allow HTML image loading if necessary.
 *
 * @param {_[]} pieces Array of FreeDOM nodes to check against.
 * @param {object} coords Point to check as {x, y}.
 * @returns {Promise<Element>} Real click target.
 */
function _iterateClickTargetsAsync (pieces, coords) {
  if (pieces.length <= 0) return Promise.resolve(null) // no better target available
  const piece = pieces.shift()

  switch (piece.id) {
    case ID.POINTER: // not selectable
    case ID.LOS: // not selectable
      return _iterateClickTargetsAsync(pieces, coords) // iterate promise
  }

  //  compensate center
  const oX = coords.x - piece.x
  const oY = coords.y - piece.y
  let tX = oX
  let tY = oY

  // compensate rotation clockwise
  if (piece.r > 0) {
    const rs = Math.sin(piece.r * Math.PI / 180)
    const rc = Math.cos(piece.r * Math.PI / 180)
    tX = oX * rc + oY * rs
    tY = -oX * rs + oY * rc
  }

  tX += piece._meta.originWidthPx / 2
  tY += piece._meta.originHeightPx / 2

  return isSolid(piece, tX, tY).then(solid => {
    if (solid) {
      return Promise.resolve(_('#' + piece.id).node())
    } else {
      return _iterateClickTargetsAsync(pieces, coords) // iterate promise
    }
  })
}
