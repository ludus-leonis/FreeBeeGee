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
import Dom from '../../../view/room/tabletop/dom.mjs'
import State from '../../../state/index.mjs'
import Text from '../../../lib/util-text.mjs'
import Util from '../../../lib/util.mjs'

// -----------------------------------------------------------------------------

const FEATURE = {
  DICEMAT: 'DICEMAT',
  DISCARD: 'DISCARD',
  DICE: 'DICE'
}

const FLAG = {
  NO_DELETE: 0b00000001,
  NO_CLONE: 0b00000010,
  NO_MOVE: 0b00000100,

  TILE_GRID_MINOR: 0b01000000,
  TILE_GRID_MAJOR: 0b10000000,

  NOTE_TOPLEFT: 0b10000000
}

const GRID = {
  SQUARE: 'grid-square',
  HEX: 'grid-hex',
  HEX2: 'grid-hex2'
}

const ID = {
  POINTER: 'ZZZZZZZZ',
  LOS: 'ZZZZZZZY',
  SELECT: 'ZZZZZZZZX'
}

const LAYER = {
  TILE: 'tile',
  STICKER: 'sticker',
  NOTE: 'note',
  TOKEN: 'token',
  OTHER: 'other'
}

const NOTE_COLOR = [
  { name: 'Yellow', value: '#ffeba6' },
  { name: 'Orange', value: '#fdce97' },
  { name: 'Green', value: '#bffabb' },
  { name: 'Blue', value: '#bbe7fa' },
  { name: 'Pink', value: '#f4a0c6' }
]

// -----------------------------------------------------------------------------

export default {
  FEATURE,
  FLAG,
  GRID,
  ID,
  LAYER,
  NOTE_COLOR,

  clampToTableSize,
  clone,
  countAssets,
  createPieceFromAsset,
  findAsset,
  findLayerMaxZ,
  findMaxZs,
  findPiece,
  findPiecesContained,
  findPiecesExpired,
  findRealClickTarget,
  flip,
  flipRandom,
  getFeatures,
  getSetupCenter,
  getTopLeft,
  grid,
  moveTiles,
  nameToLayer,
  number,
  pile,
  populateLibraryDefaults,
  populatePieceDefaults,
  populatePiecesDefaults,
  populateSetupDefaults,
  rotateRandom,
  remove,
  rotate,
  sanitizePiecePatch,
  snap,
  splitAssetFilename,
  toBottom,
  toggleBorder,
  toggleColor,
  toTop,

  _private: {
    findMinZs,
    findPiecesWithin,
    findPiecesWithinBounds,
    getPieceBounds,
    move,
    populateAssetDefaults,
    sortZ
  }
}

// -----------------------------------------------------------------------------

/**
 * Clone piece(s) to a given position.
 *
 * @param {object[]} pieces Pieces to clone.
 * @param {object} xy New grid x/y position (in tiles).
 * @param {number} nth 0 = cut+paste, >0 = nth paste in a row.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function clone (pieces, xy, nth = 1, api = true) {
  const clones = []
  const toClone = pieces.filter(p => !(p.f & FLAG.NO_CLONE))

  const features = getFeatures(toClone)
  const bounds = features.boundingBox
  const room = State.getRoom()

  // make sure the clone fits on the table
  xy.x = Util.clamp(bounds.w / 2, xy.x, room.width - 1 - bounds.w / 2)
  xy.y = Util.clamp(bounds.h / 2, xy.y, room.height - 1 - bounds.h / 2)

  const targetAreaPieces = findPiecesWithinBounds(getFeatures(toClone).boundingBox, xy, true)
  const zLower = findMaxZs(targetAreaPieces, toClone)
  const zUpper = {} // one z per layer
  for (const piece of Text.sortNumber(toClone, 'z', 0)) {
    if (piece.f & FLAG.NO_CLONE) continue
    const selectionOffset = {
      x: piece.x - bounds.center.x,
      y: piece.y - bounds.center.y
    }
    const snapped = snap(xy.x + selectionOffset.x, xy.y + selectionOffset.y)
    const clone = JSON.parse(JSON.stringify(piece))
    clone.x = snapped.x
    clone.y = snapped.y
    zUpper[clone.l] = (zUpper[clone.l] ?? 0) + 1 // init or increase
    clone.z = (zLower[clone.l] ?? 0) + zUpper[clone.l]
    if (nth > 0 && clone.n > 0) { // increase clone letter (if it has one)
      clone.n = clone.n + nth
      if (clone.n >= 36) clone.n = 1
    }
    clones.push(clone)
  }
  if (clones.length <= 0) return Promise.resolve()
  return State.createPieces(clones, true, api)
}

/**
 * Move pieces in steps/tiles.
 *
 * Will silently fail if move would push pieces out of table or items are locked.
 *
 * @param {object[]} pieces Pieces to move.
 * @param {number} x Move x in tiles. Can be negative.
 * @param {number} y Move y in tiles. Can be negative.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {object[]} Pieces to be moved.
 */
function moveTiles (pieces, x, y, api = true) {
  const setup = State.getSetup()
  pieces = sortPiecesXY(pieces).reverse()

  const dx = x / Math.abs(x || 1)
  const dy = y / Math.abs(y || 1)
  const offset = {}
  switch (setup.type) {
    case GRID.HEX:
      offset.xy = [
        [[x * 0.859, y * 0.5], [x * 0.859, y], [x * 0.859, y * 0.5]],
        [[x * 0.859, y], [x * 0.859, y], [x * 0.859, y]],
        [[x * 0.859, y * 0.5], [x * 0.859, y], [x * 0.859, y * 0.5]]
      ][dy + 1][dx + 1]
      offset.dx = setup.gridSize
      offset.dy = setup.gridSize
      break
    case GRID.HEX2:
      offset.xy = [
        [[x * 0.5, y * 0.859], [x, y * 0.859], [x * 0.5, y * 0.859]],
        [[x, y * 0.859], [x, y * 0.859], [x, y * 0.859]],
        [[x * 0.5, y * 0.859], [x, y * 0.859], [x * 0.5, y * 0.859]]
      ][dy + 1][dx + 1]
      offset.dx = setup.gridSize
      offset.dy = setup.gridSize
      break
    default:
      offset.xy = [x, y]
      offset.dx = setup.gridSize
      offset.dy = setup.gridSize
  }

  // find the most-used row/col offset for hex zig-zag movement
  const xs = []
  const ys = []
  if ([GRID.HEX, GRID.HEX2].includes(setup.type)) {
    for (const piece of pieces) {
      if (piece.f & FLAG.NO_MOVE) continue
      if (setup.type === GRID.HEX) { // we need to move zig-zag on horizontal moves
        if (Math.abs(x) === 1 && y === 0) {
          const col = Math.round(piece.x / (setup.gridSize * 0.859))
          ys.push(setup.gridSize / 2 * (col % 2 ? 1 : -1))
        }
      } else if (setup.type === GRID.HEX2) { // we need to move zig-zag on horizontal moves
        if (Math.abs(y) === 1 && x === 0) {
          const row = Math.round(piece.y / (setup.gridSize * 0.859))
          xs.push(setup.gridSize / 2 * (row % 2 ? 1 : -1))
        }
      }
    }
  }
  offset.ox = Util.mode(xs) ?? 0
  offset.oy = Util.mode(ys) ?? 0

  return move(
    pieces,
    offset.xy[0] * offset.dx + offset.ox,
    offset.xy[1] * offset.dy + offset.oy,
    3,
    api
  )
}

/**
 * Move pieces in px.
 *
 * Will silently fail if move would push pieces out of table or items are locked.
 *
 * @param {object[]} pieces Pieces to move.
 * @param {number} x Move x in px. Can be negative.
 * @param {number} y Move y in px. Can be negative.
 * @param {number} lod Level of detail of snapping, defaults to 3.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {object[]} Pieces to be moved.
 */
function move (pieces, x, y, lod = 3, api = true) {
  const toPatch = []
  const features = []
  for (const piece of pieces) {
    if (piece.f & FLAG.NO_MOVE) continue
    const xy = snap(piece.x + x, piece.y + y, lod)
    toPatch.push(sanitizePiecePatch({
      id: piece.id,
      x: xy.x,
      y: xy.y
      // z: piece.z
      // _meta: piece._meta
    }))
    features.push({ ...piece, x: xy.x, y: xy.y })
  }

  const box = getFeatures(features).boundingBox
  if (box.left < 0 || box.top < 0 || box.right > State.getRoom().width || box.bottom > State.getRoom().height) {
    return Promise.resolve()
  }

  return State.patchPieces(toPatch, api)
}

/**
 * Switch the color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 *
 * @param {object[]} pieces Pieces to modify.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toggleColor (pieces, api = true) {
  const toPatch = []
  for (const piece of pieces) {
    if (piece._meta?.hasColor) {
      toPatch.push(sanitizePiecePatch({
        id: piece.id,
        c: [piece.c[0] + 1, piece.c[1]]
      }))
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Switch the border color of the currently selected piece.
 *
 * Will cycle through all available colors and silently fail if nothing is selected.
 *
 * @param {object[]} pieces Pieces to modify.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toggleBorder (pieces, api = true) {
  const toPatch = []
  for (const piece of pieces) {
    if (piece._meta?.hasBorder) {
      toPatch.push(sanitizePiecePatch({
        id: piece.id,
        c: [piece.c[0], piece.c[1] + 1]
      }))
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Rotate pieces randomly.
 *
 * @param {object[]} pieces Pieces to rotate.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function rotateRandom (pieces, api = true) {
  const toPatch = []
  for (const piece of pieces) {
    toPatch.push(sanitizePiecePatch({
      id: piece.id,
      r: Math.floor(Math.random() * 360)
    }))
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Rotate pieces one increment.
 *
 * Increments are based on game type and room settings.
 *
 * @param {object[]} pieces Pieces to rotate.
 * @param {boolean} cw Optional direction. True = CW (default), False = CCW.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function rotate (pieces, cw = true, api = true) {
  const toPatch = []
  const increment = State.getRoomPreference(State.PREF.PIECE_ROTATE)
  for (const piece of pieces) {
    toPatch.push(sanitizePiecePatch({
      id: piece.id,
      r: cw ? (piece.r + increment) : (piece.r - increment)
    }))
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Flip the currently selected piece to its next side.
 *
 * Will cycle the sides and silently fail if nothing is selected.
 *
 * @param {object[]} pieces Pieces to rotate.
 * @param {boolean} forward If true (default), will cycle forward, otherwise backward.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function flip (pieces, forward = true, api = true) {
  const toPatch = []
  for (const piece of pieces) {
    if (getFeatures([piece]).flip) {
      const sides = piece._meta.sides + piece._meta.sidesExtra
      if (sides > 1) {
        toPatch.push(sanitizePiecePatch({
          id: piece.id,
          s: Util.mod(piece.s + (forward ? +1 : -1), sides)
        }, piece.id))
      }
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Toggle / cycle overlay grid on selected tiles.
 *
 * @param {object[]} pieces Pieces to toggle grid on.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function grid (pieces, api = true) {
  const toPatch = []
  for (const piece of pieces) {
    switch (piece.l) {
      case LAYER.TILE:
        if (piece.f & FLAG.TILE_GRID_MINOR) {
          toPatch.push({
            id: piece.id,
            f: (piece.f & 0b00111111) | FLAG.TILE_GRID_MAJOR
          })
        } else if (piece.f & FLAG.TILE_GRID_MAJOR) {
          toPatch.push({
            id: piece.id,
            f: (piece.f & 0b00111111)
          })
        } else {
          toPatch.push({
            id: piece.id,
            f: (piece.f & 0b00111111) | FLAG.TILE_GRID_MINOR
          })
        }
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Pile up all selected pieces.
 *
 * @param {object[]} pieces Pieces to pile.
 * @param {boolean} randomize If the z order of all items will be randomized.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function pile (pieces, randomize = false, api = true) {
  const features = getFeatures(pieces)
  const snapped = snap(features.boundingBox.center.x, features.boundingBox.center.y)
  const z = []

  const toPatch = []
  for (const piece of pieces) {
    if (piece.f & FLAG.NO_MOVE) continue
    toPatch.push({
      id: piece.id,
      x: snapped.x,
      y: snapped.y
    })
    z.push(piece.z) // keep for shuffling
  }
  if (toPatch.length <= 1) return Promise.resolve()
  if (randomize) {
    Util.shuffle(z)
    for (const piece of toPatch) {
      piece.z = z.pop()
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Randomize some piece(s).
 *
 * What happens depends a bit on the piece type, but usually it is flipped to a
 * random side. It also gets rotated and/or moved on the dicemat, so that there
 * is a visual difference even if the same side randomly comes up.
 *
 * @param {object[]} pieces Pieces to pile.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function flipRandom (pieces, api = true) {
  const toPatch = []
  for (const piece of pieces) {
    switch (piece._meta.feature) {
      case FEATURE.DICEMAT: // dicemat: randomize all pieces on it
        toPatch.push(...randomDicemat(piece))
        break
      case FEATURE.DISCARD: // dicard pile: randomize & center & flip all pieces on it
        toPatch.push(...randomDiscard(piece))
        break
      default: // ordinary piece
        if (getFeatures([piece]).random && piece._meta.sides > 1) { // only randomize multi-sided tokens
          toPatch.push(flipRandomPiece(piece))
        }
    }
  }
  return State.patchPieces(toPatch, api)
}
/**
 * Move pieces to the top within their layers.
 *
 * @param {object[]} pieces Pieces to move.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toTop (pieces, api = true) {
  const allPieces = findPiecesWithin(getFeatures(pieces).boundingBox)
  const zLower = findMaxZs(allPieces, pieces)
  const zUpper = {} // one z per layer
  const toPatch = []
  for (const piece of Text.sortNumber(pieces, 'z', 0)) {
    zUpper[piece.l] = (zUpper[piece.l] ?? 0) + 1 // init or increase
    const z = (zLower[piece.l] ?? 0) + zUpper[piece.l]
    if (piece.z !== z) {
      toPatch.push(sanitizePiecePatch({
        id: piece.id,
        z
      }))
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Move pieces to the bottom within their layers.
 *
 * @param {object[]} pieces Pieces to move.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function toBottom (pieces, api = true) {
  const allPieces = findPiecesWithin(getFeatures(pieces).boundingBox)
  const zLower = findMinZs(allPieces, pieces)
  const zUpper = {} // one z per layer
  const toPatch = []
  for (const piece of Text.sortNumber(pieces, 'z', 0).reverse()) {
    zUpper[piece.l] = (zUpper[piece.l] ?? 0) - 1 // init or decrease
    const z = (zLower[piece.l] ?? 0) + zUpper[piece.l]
    if (piece.z !== z) {
      toPatch.push(sanitizePiecePatch({
        id: piece.id,
        z
      }))
    }
  }
  return State.patchPieces(toPatch, api)
}

/**
 * Remove/delete pieces if they are not protected.
 *
 * @param {object[]} pieces Pieces to delete.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function remove (pieces, api = true) {
  const toRemove = []
  for (const piece of pieces) {
    if (!(piece.f & FLAG.NO_DELETE)) {
      toRemove.push(piece)
    }
  }
  return State.remove(toRemove, api)
}

/**
 * Increase/decrease the token number (if it is a token).
 *
 * Will cycle through all states
 *
 * @param {object[]} pieces Pieces to modify.
 * @param {number} delta Amount to increase.
 * @param {boolean} api If true, send the data to the API (default).
 * @returns {Promise<object>} Resulting API request (for testing).
 */
function number (pieces, delta, api = true) {
  if (!delta) {
    return Promise.resolve()
  }
  const toPatch = []
  for (const piece of pieces) {
    if (piece.l === LAYER.TOKEN && getFeatures([piece]).number) {
      toPatch.push(sanitizePiecePatch({
        id: piece.id,
        n: piece.n + delta
      }))
    }
  }
  return State.patchPieces(toPatch, api)
}

// -----------------------------------------------------------------------------

/**
 * Find highest Z per layer.
 *
 * @param {object[]} include Pieces to include in check.
 * @param {object[]} exclude Pieces to exclude from include pieces.
 * @param {object} center Optional {x, y} object of shifted target area.
 * @returns {object} Contains higest z per layer as {tile, token, ...}.
 */
function findMaxZs (include, exclude = [], center = {}) {
  if (center.x !== undefined) {
    // find z in shape of 'include' but around 'center' instead
    const box = getFeatures(include).boundingBox
    include = findPiecesWithin({
      top: box.top + center.y - box.center.y,
      left: box.left + center.x - box.center.x,
      bottom: box.bottom + center.y - box.center.y,
      right: box.right + center.x - box.center.x
    })
  }
  const z = {}
  for (const piece of include) {
    if (!exclude.find(e => e.id === piece.id)) {
      if (piece.z > (z[piece.l] ?? Number.MIN_VALUE)) z[piece.l] = piece.z
    }
  }
  return z
}

/**
 * Find the maximum Z in a layer.
 *
 * @param {string} layer Layer name.
 * @returns {number} highest z, e.g. 23.
 */
function findLayerMaxZ (layer) {
  return findMaxZs(State.getLayer(layer))[layer] ?? 0
}
/**
 * Find lowest Z per layer.
 *
 * @param {object[]} include Pieces to include in check.
 * @param {object[]} exclude Pieces to exclude from include pieces.
 * @returns {object} Contains higest z per layer as {tile, token, ...}.
 */
function findMinZs (include, exclude = []) {
  const z = {}
  for (const piece of include) {
    if (!exclude.find(e => e.id === piece.id)) {
      if (piece.z < (z[piece.l] ?? Number.MAX_VALUE)) z[piece.l] = piece.z
    }
  }
  return z
}

// -----------------------------------------------------------------------------

const LAYERS = [ // reverse order
  LAYER.TILE,
  LAYER.STICKER,
  LAYER.NOTE,
  LAYER.TOKEN,
  LAYER.OTHER
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
function nameToLayer (name) {
  return LAYERS.indexOf(name) + 1
}

/**
 * Find a piece by ID.
 *
 * @param {string} id ID to lookup.
 * @param {number} no Table number, defaults to current one.
 * @returns {object} Piece, or null if not found.
 */
function findPiece (id, no = State.getTableNo()) {
  for (const piece of State.getTable(no)) {
    if (piece.id === id) {
      return piece
    }
  }

  return null
}

const ASSET_TYPES = [
  LAYER.TILE,
  LAYER.TOKEN,
  LAYER.STICKER,
  LAYER.OTHER,
  'badge'
]

/**
 * Find an asset by ID.
 *
 * @param {string} id ID to lookup.
 * @param {string} layer Optional layer to limit/speed up search.
 * @returns {object} Asset, or null if not found.
 */
function findAsset (id, layer = 'any') {
  const library = State.getLibrary()

  for (const assetType of ASSET_TYPES) {
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
 * @param {string} id Asset ID to lookup.
 * @returns {number} Count of pieces using that asset across all tables.
 */
function countAssets (id) {
  let count = 0

  for (let no = 1; no <= 9; no++) {
    for (const piece of State.getTable(no)) {
      if (piece.a === id) {
        count++
      }
    }
  }

  return count
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
function getTopLeft (piece, x = piece.x, y = piece.y) {
  const jitterX = piece.l === LAYER.TOKEN ? Math.abs(Text.hash('x' + piece.id)) % 5 - 2 : 0
  const jitterY = piece.l === LAYER.TOKEN ? Math.abs(Text.hash('y' + piece.id)) % 5 - 2 : 0

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
function getPieceBounds (piece) {
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
 * @param {object} bounds Rectangle object, containing top/left/bottom/right.
 * @param {string} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
function findPiecesWithin (bounds, layer = 'all', no = State.getTableNo()) {
  const pieces = []

  for (const piece of State.getTable(no)) {
    if (piece.l === layer || layer === 'all') {
      if (Util.intersect(bounds, getPieceBounds(piece))) {
        pieces.push(piece)
      }
    }
  }

  return pieces
}

/**
 * Find all pieces at current (or future) area.
 *
 * Mostly used before moving a selection to a new position what pieces might affect z.
 *
 * @param {object} bounds {top, left, right, bottom} to search within.
 * @param {object} center Optional alterate center {x, y} of selection.
 * @param {boolean} padding If true, selection will extend 2px on all sides.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
function findPiecesWithinBounds (bounds, center = {}, padding = false) {
  const offset = {
    x: center.x ? center.x - bounds.center.x : 0,
    y: center.y ? center.y - bounds.center.y : 0
  }
  const rect = padding
    ? {
        top: bounds.top + offset.y - 2,
        bottom: bounds.bottom + offset.y + 2,
        left: bounds.left + offset.x - 2,
        right: bounds.right + offset.x + 2
      }
    : {
        top: bounds.top + offset.y,
        bottom: bounds.bottom + offset.y,
        left: bounds.left + offset.x,
        right: bounds.right + offset.x
      }
  return findPiecesWithin(rect)
}

/**
 * Find all pieces 100% within a grid area.
 *
 * @param {object} rect Rectangle object, containing top/left/bottom/right.
 * @param {string} layer Optional name of layer to search within. Defaults to 'all'.
 * @param {number} no Table number, defaults to current one.
 * @returns {Array} Array of nodes/pieces that are in or touch that area.
 */
function findPiecesContained (rect, layer = 'all', no = State.getTableNo()) {
  const pieces = []

  for (const piece of State.getTable(no)) {
    if (piece.l === layer || layer === 'all') {
      if (Util.contains(rect, getPieceBounds(piece))) {
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
function findPiecesExpired (no = State.getTableNo()) {
  const pieces = []

  const now = new Date()
  for (const piece of State.getTable(no)) {
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
function sortPiecesXY (pieces) {
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
function getFeatures (pieces) {
  const semi = [FEATURE.DICEMAT, FEATURE.DISCARD]

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
    if (!(piece.f & FLAG.NO_CLONE)) features.clone = true // at least one found
    if (!(piece.f & FLAG.NO_DELETE)) features.delete = true // at least one found
    if (!(piece.f & FLAG.NO_MOVE)) {
      features.move = true // at least one found
      moveable++
    }
    if (!piece._meta?.hasColor) features.color = false
    if (!piece._meta?.hasBorder) features.border = false
    if (piece.l !== LAYER.TOKEN) features.number = false

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
function sanitizePiecePatch (patch, pieceId = null) {
  const r = State.getRoom()
  const t = State.getSetup()
  const p = pieceId === null ? null : findPiece(pieceId)
  const result = {}
  let colors
  for (const field in patch) {
    switch (field) {
      case 'c':
        result[field] = []
        colors = p?.l === LAYER.NOTE ? NOTE_COLOR.length : (t.colors.length + 1)
        if (patch[field][0] !== undefined) result[field].push(Util.mod(patch[field][0], colors))
        if (patch[field][1] !== undefined) result[field].push(Util.mod(patch[field][1], t.borders.length + 1))
        break
      case 'x':
        result[field] = Util.clamp(0, patch[field], r.width - 1)
        break
      case 'y':
        result[field] = Util.clamp(0, patch[field], r.height - 1)
        break
      case 'w':
      case 'h':
        result[field] = Util.clamp(1, patch[field], 32)
        break
      case 's':
        result[field] = Util.mod(
          patch[field],
          (p?._meta?.sides ?? findAsset(p?.a)?.media.length ?? 1) + (p?._meta?.sidesExtra ?? 0)
        )
        break
      case 'n':
        result[field] = Util.mod(patch[field], 36)
        break
      case 'r':
        result[field] = Util.mod(patch[field], 360)
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
function populateLibraryDefaults (library) {
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
function populateSetupDefaults (setup) {
  setup.borders = setup.borders ?? []

  setup._meta = {
    widthPx: setup.gridWidth * setup.gridSize,
    heightPx: setup.gridHeight * setup.gridSize
  }

  return setup
}

/**
 * Add default asset properties that the API might omit.
 *
 * @param {object} asset Data object to populate.
 * @returns {object} Asset for chaining.
 */
function populateAssetDefaults (asset) {
  asset.w = asset.w ?? 1
  asset.h = asset.h ?? asset.w
  if (['token', 'tile', 'other'].includes(asset.type)) {
    asset.d = asset.d ?? 2
  } else {
    asset.d = asset.d ?? 0
  }

  asset._hash = Text.hash(JSON.stringify(asset))

  return asset
}

/**
 * Add default piece values to all properties that the API might omit.
 *
 * @param {object} piece Data object to populate.
 * @param {object} headers Optional headers object (for date checking).
 * @returns {object} Piece for chaining.
 */
function populatePieceDefaults (piece, headers = null) {
  const colors = State.getSetup()?.colors ?? []

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
  const gridSize = State.getSetup()?.gridSize ?? 64
  if (piece.id === ID.LOS) {
    piece._meta.originWidthPx = piece.w
    piece._meta.originHeightPx = piece.h
    piece._meta.widthPx = piece.w
    piece._meta.heightPx = piece.h
    piece._meta.originOffsetXPx = 0
    piece._meta.originOffsetYPx = 0
  } else {
    piece._meta.originWidthPx = piece.w * gridSize
    piece._meta.originHeightPx = piece.h * gridSize
    const rect = Util.getDimensionsRotated(piece._meta.originWidthPx, piece._meta.originHeightPx, piece.r)
    piece._meta.widthPx = Math.round(rect.w)
    piece._meta.heightPx = Math.round(rect.h)
    piece._meta.originOffsetXPx = Math.round((piece._meta.originWidthPx - rect.w) / 2)
    piece._meta.originOffsetYPx = Math.round((piece._meta.originHeightPx - rect.h) / 2)
  }

  // add client-side meta information for asset
  const asset = findAsset(piece.a)
  if (asset) {
    const bgImage = Dom.getAssetURL(asset, asset.base ? -1 : piece.s)
    if (bgImage.match(/(png|svg)$/i)) piece._meta.mask = bgImage
    if (asset.mask) piece._meta.mask = Dom.getAssetURL(asset, -2)
    if (piece.l === LAYER.TOKEN && piece.w <= 8 && piece.h <= 8) piece._meta.mask = `img/mask/token-${piece.w}x${piece.h}.svg`
    piece._meta.sides = asset.media.length ?? 1
    piece._meta.sidesExtra = (piece.l === LAYER.TOKEN && piece._meta.sides === 1) ? 1 : 0

    if (piece.l === LAYER.OTHER && asset.w === 1 && asset.h === 1) {
      piece._meta.feature = FEATURE.DICE
    }

    switch (asset.name) {
      case '_.dicemat':
        piece._meta.feature = FEATURE.DICEMAT
        break
      case '_.discard':
        piece._meta.feature = FEATURE.DISCARD
        break
    }

    if (asset.bg?.match(/^[0-9][0-9]?$/)) {
      piece._meta.hasColor = true
    } else {
      piece._meta.hasColor = false
    }
    piece._meta.hasBorder = piece.l === LAYER.TOKEN
    if (asset.type === LAYER.TOKEN || piece._meta.hasColor === true || bgImage.match(/(jpg|jpeg)$/i)) {
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
function populatePiecesDefaults (pieces, headers = null) {
  const nonExpired = []
  const now = new Date()
  for (const piece of pieces ?? []) {
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
 * Sort pieces by their Z value.
 *
 * @param {object[]} pieces Array of pieces to sort.
 * @returns {object[]} Given array, with sorted Z values (highest first).
 */
function sortZ (pieces) {
  return pieces.sort((a, b) => b.z - a.z)
}

/**
 * Create a new piece from an asset.
 *
 * @param {number} assetId ID of asset.
 * @param {number} x X-position (px).
 * @param {number} y Y-position (px).
 * @returns {object} Piece data object.
 */
function createPieceFromAsset (assetId, x = 0, y = 0) {
  const asset = findAsset(assetId)
  const xy = snap(x, y)

  const piece = populatePieceDefaults(clampToTableSize({
    a: asset.id,
    l: nameToLayer(asset.type),
    w: asset.w,
    h: asset.h,
    x: xy.x,
    y: xy.y,
    z: findLayerMaxZ(asset.type) + 1
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
function clampToTableSize (piece) {
  const room = State.getRoom()
  piece.x = Util.clamp(0, piece.x, room.width - 1)
  piece.y = Util.clamp(0, piece.y, room.height - 1)
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
function snap (x, y, lod = 3) {
  if (lod >= 4) return { x: Math.round(x), y: Math.round(y) } // disabled snap

  const setup = State.getSetup()
  if (setup.snap === false) {
    return Util.snapGrid(x, y, 8, 3) // snap to 4px
  }
  switch (setup.type) {
    case GRID.HEX:
      return Util.snapHex(x, y, setup.gridSize, lod)
    case GRID.HEX2:
      return Util.snapHex2(x, y, setup.gridSize, lod)
    default:
      return Util.snapGrid(x, y, setup.gridSize, lod)
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
function getSetupCenter (no = State.getTableNo()) {
  const pieces = State.getTable(no)
  if (pieces.length <= 0) { // use table center for empty tables
    const setup = State.getSetup()
    return {
      x: (setup.gridSize * setup.gridWidth) / 2,
      y: (setup.gridSize * setup.gridHeight) / 2
    }
  } else {
    return getFeatures(pieces).boundingBox.center
  }
}

/**
 * Randomice the items (dice) on a dicemat node.
 *
 * @param {object} dicemat Dicemat piece.
 * @returns {object[]} Resulting patches, usually all dice above the piece.
 */
function randomDicemat (dicemat) {
  const setup = State.getSetup()
  const coords = []
  const toPatch = []
  for (let x = 0; x < Math.min(dicemat.w, 4); x++) {
    for (let y = 0; y < Math.min(dicemat.h, 4); y++) {
      coords.push({ // a max. 4x4 area in the center of the dicemat
        x: (Math.max(0, Math.floor((dicemat.w - 4) / 2)) + x + 0.5) * setup.gridSize,
        y: (Math.max(0, Math.floor((dicemat.h - 4) / 2)) + y + 0.5) * setup.gridSize
      })
    }
  }

  for (const piece of findPiecesWithin(getPieceBounds(dicemat), dicemat.l)) {
    if (piece._meta.feature === FEATURE.DICEMAT) continue // don't touch the dicemat
    if (piece.z <= dicemat.z) continue // only roll dice above the mat

    // pick one random position
    let coord = { x: 0, y: 0 }
    let index = Math.floor(Math.random() * coords.length)
    if (coords[index].x === piece.x && coords[index].y === piece.y) {
      index = Util.mod(index + 1, coords.length)
    }
    coord = coords[index]
    coords.splice(index, 1)

    // update the piece
    toPatch.push({
      ...flipRandomPiece(piece),
      x: dicemat.x - dicemat._meta.widthPx / 2 + coord.x,
      y: dicemat.y - dicemat._meta.heightPx / 2 + coord.y
    })
  }
  return toPatch
}

/**
 * Randomice the pieces above a discard pile node.
 *
 * @param {object} discard Discard piece.
 * @returns {object[]} Resulting patches, usually all dice above the piece.
 */
function randomDiscard (discard) {
  const toPatch = []
  let stackSide = -1

  const stack = findPiecesWithin(getPieceBounds(discard), discard.l)

  // shuffle z positions above the dicard pile piece
  const discardZ = discard.z
  const z = []
  for (let i = 0; i < stack.length; i++) {
    z.push(discardZ + i + 1)
  }
  Util.shuffle(z)

  for (const piece of stack) {
    if (piece._meta.feature === FEATURE.DISCARD) continue // don't touch the discard pile piece
    if (piece.z <= discard.z) continue // only shuffle stuff above the discard pile piece

    // detect the side to flip them to
    if (stackSide < 0) {
      // fip all pieces, based on the state of the first one
      if (piece.s === 0) {
        stackSide = Math.max(0, piece._meta.sides - 1)
      } else {
        stackSide = 0
      }
    }

    // update the piece
    toPatch.push({
      id: piece.id,
      s: stackSide,
      x: discard.x,
      y: discard.y,
      z: z.pop()
    })
  }
  return toPatch
}

/**
 * Flip a piece to a random side. Also move/shift it a bit.
 *
 * @param {object} piece Piece to randomize.
 * @param {boolean} jiggle If true (default), more and rotate piece slightly.
 * @returns {object[]} Resulting patch.
 */
function flipRandomPiece (piece, jiggle = true) {
  const setup = State.getSetup()

  const patch = {
    id: piece.id,
    s: Math.floor(Math.random() * piece._meta.sides)
  }

  if (jiggle) {
    // slide token around
    let slideX = Math.floor(Math.random() * 3) - 1
    let slideY = Math.floor(Math.random() * 3) - 1
    if (slideX === 0 && slideY === 0) {
      slideX = 1
      slideY = 1
    }
    const offset = Math.floor(setup.gridSize / 2)
    patch.x = Math.abs(Util.clamp(0, piece.x + slideX * offset, (setup.gridWidth - 1) * setup.gridSize))
    patch.y = Math.abs(Util.clamp(0, piece.y + slideY * offset, (setup.gridHeight - 1) * setup.gridSize))

    // give it a random rotation +/- 10°
    patch.r = Math.floor(Math.random() * 21) - 10
  }

  return patch
}
/**
 * Extract parts (group, name, size, etc.) from an asset filename and guess best type.
 *
 * @param {string} assetName Asset filename.
 * @returns {object} Parsed elements.
 */
function splitAssetFilename (assetName) {
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
  if (data.w) data.type = LAYER.TILE
  if (data.w === data.h && data.w <= 3) data.type = LAYER.TOKEN

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
function isSolid (piece, x, y) {
  const setup = State.getSetup()
  let mask

  if (!piece) {
    return Promise.resolve(true) // no piece = no checking
  } else if (piece.l === LAYER.TOKEN) {
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
function findRealClickTarget (node, coords, target = null) {
  // find all potential pieces in all layers.
  const pieces = []
  if (node.piece) pieces.push(node.piece)
  const index = node.piece ? nameToLayer(node.piece.l) : LAYERS.length - 1
  for (const layer of LAYERS.slice().reverse()) {
    if (nameToLayer(layer) <= index && State.isLayerActive(layer)) { // we don't need to check higher layers
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
