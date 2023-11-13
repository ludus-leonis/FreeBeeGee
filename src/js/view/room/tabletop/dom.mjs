/**
 * @file The browser stuff. Mainly in charge of state -> DOM
 *       propagation. Does not manipulate data nor does it do API calls.
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

import { marked } from '../../../../../node_modules/marked/lib/marked.cjs'

import _ from '../../../lib/FreeDOM.mjs'
import Browser from '../../../lib/util-browser.mjs'
import Content from '../../../view/room/tabletop/content.mjs'
import ModalEdit from '../../../view/room/modal/piece/index.mjs'
import Popup from '../../../view/room/tabletop/popup.mjs'
import Room from '../../../view/room/index.mjs'
import Selection from './selection.mjs'
import State from '../../../state/index.mjs'
import Util from '../../../lib/util.mjs'

// -----------------------------------------------------------------------------

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export default {
  ZOOM_LEVELS,

  assetToNode,
  createLosPiece,
  createNote,
  createSelectPiece,
  getAssetURL,
  getMaterialMedia,
  getRoomMediaURL,
  losTo,
  moveContent,
  moveNodeTo,
  pointTo,
  updatePreviewDOM,
  updateQuality,
  updateSelection,
  updateTabletop,
  url,
  zoom
}

// ----------------------------------------------------------------------------

/**
 * Adapt the quality settings based on the current slider position.
 *
 * Will add matching .is-quality-* classes to the body.
 *
 * @param {number} value Quality setting. 0 = low, 1 = medium, 2 = high, 3 = ultra
 */
function updateQuality (value) {
  const body = _('body').remove('.is-quality-*')
  switch (State.getServerPreference(State.PREF.QUALITY)) {
    case 0:
      body.add('.is-quality-low')
      break
    case 1:
      body.add('.is-quality-medium')
      break
    case 2:
      body.add('.is-quality-high')
      break
    case 3:
    default:
      body.add('.is-quality-ultra')
  }
}
/**
 * Set the table surface for the given table number.
 *
 * Will restore table settings (like scroll pos, table texture, ...) and set css classes.
 *
 * @param {number} no Table to set (1..9).
 */
function setTableSurface (no) {
  const tabletop = _('#tabletop')
  if (tabletop.tableNo !== no) { // no need to re-update unchanged no.
    tabletop.tableNo = no
    tabletop.remove('.table-*').add(`.table-${no}`)
    Room.restoreScrollPosition()
  }
}

/**
 * Update or recreate the DOM node of a piece.
 *
 * Will try to minimize recreation of objects and tries to only update its
 * properties/classes if possible.
 *
 * Assumes that the caller will add a 'piece' property to the node so we can
 * detect necessary changes.
 *
 * @param {object} piece The piece's full data object.
 * @returns {_} Created or updated FreeDOM node.
 */
function createOrUpdatePieceDOM (piece) {
  let selection = []

  // reuse existing DOM node if possible, only (re)create on major changes
  let div = _('#' + piece.id)
  let _piece = div.unique() ? div.piece : {} // get old piece out of old node
  if (
    _piece.l !== piece.l ||
    _piece.w !== piece.w ||
    _piece.h !== piece.h ||
    _piece.s !== piece.s ||
    (_piece.f & 0b11111000) !== (piece.f & 0b11111000)
  ) {
    selection = Selection.getIds()
    div.delete()
  }
  if (!div.unique()) { // (re)create
    const node = piece.l === Content.LAYER.NOTE ? noteToNode(piece) : pieceToNode(piece)
    node.piece = _piece
    _piece = {}
    _('#layer-' + piece.l).add(node)
    if (selection.includes(piece.id)) Selection.select(piece.id)
  }

  // update dom infos + classes (position, rotation ...)
  const setup = State.getSetup()
  div = _('#' + piece.id) // fresh query

  if (_piece.x !== piece.x || _piece.y !== piece.y || _piece.z !== piece.z) {
    const tl = Content.getTopLeft(piece)
    div.css({
      '--fbg-x': tl.left + 'px',
      '--fbg-y': tl.top + 'px',
      '--fbg-z': piece.z
    })
  }
  if (_piece.r !== piece.r) {
    div.remove('.is-r', '.is-r-*')
    div.add('.is-r', `.is-r-${piece.r}`)
    if (Math.abs(_piece.r - piece.r) > 180) {
      div.add('.is-delay-r', `.is-delay-r-${_piece.r}`)
    }
  }
  if (_piece.w !== piece.w || _piece.h !== piece.h) {
    div
      .remove('.is-w-*', '.is-h-*')
      .add(`.is-w-${piece.w}`, `.is-h-${piece.h}`)
  }
  if (_piece.n !== piece.n) {
    div.remove('.is-n', '.is-n-*')
    if (piece.l === Content.LAYER.TOKEN && piece.n !== 0) {
      div.add('.is-n', '.is-n-' + piece.n)
    }
  }

  if (_piece.c?.[0] !== piece.c[0] || _piece.c?.[1] !== piece.c[1]) {
    // (background) color
    if (piece.l === Content.LAYER.NOTE) {
      div.css({
        '--fbg-color': Content.NOTE_COLOR[piece.c[0]].value,
        '--fbg-color-invert': Browser.brightness(Content.NOTE_COLOR[piece.c[0]].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
      })
    } else if (piece._meta.hasColor) {
      if (piece.c[0] === 0) { // no/default color
        div.remove('--fbg-color', '--fbg-color-invert')
      } else { // color
        div.css({
          '--fbg-color': setup.colors[piece.c[0] - 1].value,
          '--fbg-color-invert': Browser.brightness(setup.colors[piece.c[0] - 1].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    } else if (piece.l === Content.LAYER.STICKER || piece.l === Content.LAYER.OTHER) {
      // no color
    } else {
      const asset = Content.findAsset(piece.a)
      if (asset) {
        div.css({
          '--fbg-color': asset.bg,
          '--fbg-color-invert': Browser.brightness(asset.bg) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    }

    // border color
    div.remove('.has-border')
    if (piece._meta.hasBorder) {
      if (piece.c[1] === 0) { // no border color
        _(`#${piece.id}`).remove('--fbg-border-color', '--fbg-border-color-invert')
      } else { // color
        div.add('.has-border')
        _(`#${piece.id}`).css({
          '--fbg-border-color': setup.borders[piece.c[1] - 1].value,
          '--fbg-border-color-invert': Browser.brightness(setup.borders[piece.c[1] - 1].value) > 128 ? 'var(--fbg-color-dark)' : 'var(--fbg-color-light)'
        })
      }
    }
  }

  return div
}

/**
 * Propagate selection of data/state to DOM.
 */
function updateSelection () {
  const selection = Selection.getIds()
  _('#tabletop .piece').each(node => {
    if (selection.includes(node.id)) {
      _(node).add('.is-selected')
    } else {
      _(node).remove('.is-selected')
    }
  })
  Room.updateMenu()
}

/**
 * Add or re-set a piece.
 *
 * @param {object} piece The piece's full data object.
 */
function setPiece (piece) {
  const node = createOrUpdatePieceDOM(piece)

  // set the label
  if (piece.t?.[0] || piece.b?.[0]) { // make sure label bubble is there
    let changed = node.piece.t?.[0] !== piece.t?.[0] || !Util.equalsJSON(node.piece.b, piece.b)

    if (!_('#' + piece.id + ' .label').exists()) {
      node.add(_('.label.ellipsis>span').create())
      changed = true
    }

    // update content if it has changed
    if (changed) {
      const content = _('#' + piece.id + ' .label').empty()

      // update text part
      if (piece.t?.length >= 1) {
        content.add(_('span').create(piece.t[0]))
      }

      // update icon part
      for (const id of piece.b ?? []) {
        const asset = Content.findAsset(id, 'badge')
        if (asset) {
          const img = _('img.icon').create()
          img.src = getAssetURL(asset, 0)
          content.add(img)
        }
      }
    }
  } else { // remove label bubble
    _('#' + piece.id + ' .label').delete()
  }

  node.piece = piece // store piece for future delta-checking
}

/**
 * Add or re-set a sticky note.
 *
 * @param {object} note The note's full data object.
 */
function setNote (note) {
  const node = createOrUpdatePieceDOM(note)

  if (note.f & Content.FLAG.NOTE_TOPLEFT) {
    node.add('.is-topleft')
  } else {
    node.remove('.is-topleft')
  }

  if (node.piece.t?.[0] !== note.t?.[0]) { // update note on change
    node.node().innerHTML = markdown(note.t?.[0])
  }

  node.piece = note // store piece for future delta-checking
}

/**
 * Assemble a CSS URL for an asset in a room.
 *
 * @param {string} type Asset type.
 * @param {string} file File name.
 * @returns {string} URL to be used in a CSS url('..') expression.
 */
function getRoomMediaURL (type, file) {
  if (State.SERVERLESS) {
    return `demo/${State.getRoom().setup.name}/assets/${type}/${file}`
  } else {
    return `api/data/rooms/${State.getRoom()?.name}/assets/${type}/${file}`
  }
}

/**
 * Get the material media path for a material name.
 *
 * Reverts to first = no material if not found.
 *
 * @param {string} name The material's name, e.g. 'wood'.
 * @returns {string} Media path, e.g. 'api/data/rooms/roomname/assets/material/wood.png'
 */
function getMaterialMedia (name) {
  const material = State.getLibrary()?.material?.find(m => m.name === name)
  const filename = material?.media[0] ?? 'none.png'
  return getRoomMediaURL('material', filename)
}

/**
 * Get the URL for an asset media.
 *
 * @param {object} asset Asset to get URL for.
 * @param {number} side Side/media to get, -2 = mask, -1 = base. Defaults to 0=first.
 * @returns {string} URL to be used in url() or img.src.
 */
function getAssetURL (asset, side = 0) {
  if (side >= asset.media.length) {
    return getRoomMediaURL('material', 'none.png')
  }
  switch (side) {
    case -2:
      return getRoomMediaURL(asset.type, asset.mask)
    case -1:
      return getRoomMediaURL(asset.type, asset.base)
    default:
      return getRoomMediaURL(asset.type, asset.media[side])
  }
}

/**
 * Get a list of all pieces' IDs that are in play.
 *
 * @returns {string[]} Possibly empty array of IDs.
 */
function getAllPiecesIds () {
  const all = _('#tabletop .piece')
  if (all.exists()) {
    return all.id
  }
  return []
}

/**
 * Convert an asset data object to a DOM node. Usually for library previews.
 *
 * @param {object} asset Asset object.
 * @param {number} side Side to use, defaults to 0 = first side.
 * @returns {_} Converted FreeDOM node (not added to DOM yet).
 */
function assetToNode (asset, side = 0) {
  const piece = Content.populatePieceDefaults({
    id: 'x' + asset.id,
    a: asset.id,
    s: side
  })

  const node = pieceToNode(piece).add(
    '.is-w-' + asset.w,
    '.is-h-' + asset.h
  )
  node.asset = asset
  node.side = side

  if (piece._meta.hasColor) {
    const colors = State.getSetup().colors
    piece.c[0] = Number.parseInt(asset.bg) % colors.length
    if (piece.c[0] !== 0) {
      node.css({ '--fbg-color': colors[piece.c[0] - 1].value })
    }
  }

  return node
}

/**
 * Convert a filename into a CSS url() and apply a scoped caching postfix.
 *
 * @param {string} file Filname for url().
 * @param {boolean} pin If true (optional), will append room id to pin caching.
 * @returns {_} Converted FreeDOM node (not added to DOM yet).
 */
function url (file, pin = true) {
  let cache = ''
  if (pin) {
    const room = State.getRoom()
    cache = '?r=' + encodeURI(room.id)
  }
  return `url("${encodeURI(file)}${cache}")`
}

/**
 * Add a new sticky note to the cursor position.
 *
 * This only opens the edit modal and does not add the note to the table yet.
 *
 * @param {object} xy {x, y} coordinates (tile) where to add.
 */
function createNote (xy) {
  Selection.clear()
  const snapped = Content.snap(xy.x, xy.y)
  ModalEdit.open(Content.populatePieceDefaults({
    l: Content.nameToLayer(Content.LAYER.NOTE),
    w: 3,
    h: 3,
    x: snapped.x,
    y: snapped.y,
    z: Content.findLayerMaxZ(Content.LAYER.NOTE) + 1
  }))
}

/**
 * Move the room content by approximately x/y.
 *
 * The actual amount will depend on the page grid so that the moved content
 * still aligns to grid snapping.
 *
 * @param {number} offsetX Delta of new x position.
 * @param {number} offsetY Delta of new y position.
 */
function moveContent (offsetX, offsetY) {
  const setup = State.getSetup()
  switch (setup.type) {
    case 'grid-hex':
      if (offsetX < 0) offsetX += 109
      if (offsetY < 0) offsetY += 63
      offsetX = Math.floor(offsetX / 110) * 110
      offsetY = Math.floor(offsetY / 64) * 64
      break
    case 'grid-hex2':
      if (offsetX < 0) offsetX += 63
      if (offsetY < 0) offsetY += 109
      offsetX = Math.floor(offsetX / 64) * 64
      offsetY = Math.floor(offsetY / 110) * 110
      break
    case 'grid-square':
    default:
      if (offsetX < 0) offsetX += 63
      if (offsetY < 0) offsetY += 63
      offsetX = Math.floor(offsetX / setup.gridSize) * setup.gridSize
      offsetY = Math.floor(offsetY / setup.gridSize) * setup.gridSize
  }
  const pieces = []
  _('#tabletop .piece').each(node => {
    pieces.push({
      id: node.piece.id,
      x: node.piece.x + offsetX,
      y: node.piece.y + offsetY
    })
  })
  State.updatePieces(pieces)
}

/**
 * Update the DOM to reflect the given table data.
 *
 * Will add new, update existing and delete obsolete pieces.
 *
 * @param {number} tableNo Table number to display.
 */
function updateTabletop (tableNo) {
  const tableData = State.getTable(tableNo)
  const start = Date.now()

  setTableSurface(tableNo)

  const keepIds = []
  cleanupTable()
  for (const piece of tableData) {
    setItem(piece)
    keepIds.push(piece.id)
  }
  removeObsoletePieces(keepIds)
  updateSelection()
  Room.updateStatusline()

  setTimeout(() => { // remove temporary transition classes
    _('.piece[class*="is-delay-"]').each(node => {
      _(node).remove('.is-delay-*')
    })
  }, 10)

  Util.recordTime('sync-ui', Date.now() - start)
}

/**
 * Move the pointer to the given location.
 *
 * @param {object} coords {x, y} object, in table px.
 */
function pointTo (coords) {
  const setup = State.getSetup()
  const room = State.getRoom()

  coords.x = Util.clamp(0, coords.x, room.width - setup.gridSize - 1)
  coords.y = Util.clamp(0, coords.y, room.height - setup.gridSize - 1)

  const snapped = Content.snap(coords.x, coords.y)

  State.createPieces([{ // always create (even if it is a move)
    a: Content.ID.POINTER,
    l: Content.LAYER.OTHER,
    w: 1,
    h: 1,
    x: snapped.x,
    y: snapped.y,
    z: Content.findLayerMaxZ(Content.LAYER.OTHER) + 1
  }])
}

/**
 * Persist the LOS line on the server
 *
 * @param {number} x Start x.
 * @param {number} y Start y.
 * @param {number} w Width of bounding box, can be negative.
 * @param {number} h Height of bounding box, can be negative.
 */
function losTo (x, y, w, h) {
  if (w !== 0 || h !== 0) {
    State.createPieces([{
      a: Content.ID.LOS,
      l: Content.LAYER.OTHER,
      x,
      y,
      w,
      h,
      z: Content.findLayerMaxZ(Content.LAYER.OTHER) + 1
    }])
  }
}

/**
 * Move a (dragging) piece to a coord.
 *
 * @param {Element} element The HTML node to update.
 * @param {number} x New x coordinate in px.
 * @param {number} y New y coordinate in px.
 */
function moveNodeTo (element, x, y) {
  if (element.piece.f & Content.FLAG.NO_MOVE) return // we do not move frozen pieces
  if (element.x === x && element.y === y) return // no need to move to same place

  element.x = x
  element.y = y

  const tl = Content.getTopLeft(element.piece, element.x, element.y)
  const zoomed = Room.zoomCoordinates({ x: tl.left, y: tl.top })

  element.style.left = zoomed.x + 'px'
  element.style.top = zoomed.y + 'px'
}

/**
 * Create an asset node for LOS pointers.
 *
 * @param {number} x X-coordinate of starting point in px.
 * @param {number} y Y-coordinate of starting point in px.
 * @param {number} width Width in px. Can be negative.
 * @param {number} height Height in px. Can be negative.
 * @returns {_} FreeDOM node, not added to DOM yet.
 */
function createLosPiece (x, y, width, height) {
  const zoom = State.getRoomPreference(State.PREF.ZOOM)
  x *= zoom
  y *= zoom
  width *= zoom
  height *= zoom

  const stroke = 4
  const padding = stroke / 2
  const x1 = (width >= 0 ? padding : -width + padding)
  const y1 = (height >= 0 ? padding : -height + padding)
  const x2 = (width >= 0 ? width + padding : padding)
  const y2 = (height >= 0 ? height + padding : padding)

  // container svg
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('viewBox', `0 0 ${Math.abs(width) + padding * 2} ${Math.abs(height) + padding * 2}`)
  svg.setAttribute('stroke', 'black')
  svg.classList.add('piece', 'piece-other', 'piece-los', 'is-d-1')

  // base line
  const base = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  base.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  base.setAttribute('stroke-linecap', 'round')
  base.setAttribute('stroke-linejoin', 'round')
  base.setAttribute('stroke', '#ad371a') // red thread
  base.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(base)

  // thicker line
  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shape.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  shape.setAttribute('stroke-linecap', 'round')
  shape.setAttribute('stroke-linejoin', 'round')
  shape.setAttribute('stroke-dasharray', '5,10')
  shape.setAttribute('stroke', '#ad371a') // red thread
  shape.setAttribute('stroke-width', stroke)
  svg.appendChild(shape)

  // inch/cm line
  const ruler = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  ruler.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  ruler.setAttribute('stroke-linecap', 'round')
  ruler.setAttribute('stroke-linejoin', 'round')
  ruler.setAttribute('stroke', '#ffffff30') // red thread
  ruler.setAttribute('stroke-dasharray', '64, 64')
  ruler.setAttribute('stroke-dashoffset', 64)
  ruler.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(ruler)

  // inch/cm line
  const ruler2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  ruler2.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  ruler2.setAttribute('stroke-linecap', 'round')
  ruler2.setAttribute('stroke-linejoin', 'round')
  ruler2.setAttribute('stroke', '#00000040') // red thread
  ruler2.setAttribute('stroke-dasharray', '64, 64')
  ruler2.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(ruler2)

  // shade line
  const shade = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shade.setAttribute('d', `M ${x1},${y1} ${x2},${y2}`)
  shade.setAttribute('stroke-linecap', 'round')
  shade.setAttribute('stroke-linejoin', 'round')
  shade.setAttribute('stroke-dasharray', '3,12')
  shade.setAttribute('stroke-dashoffset', -1)
  shade.setAttribute('stroke-opacity', 0.05)
  shade.setAttribute('stroke', '#ffffff') // red thread
  shade.setAttribute('stroke-width', stroke - 1)
  svg.appendChild(shade)

  // position
  svg.style.left = (width < 0 ? x + width : x) - stroke / 2 + 'px'
  svg.style.top = (height < 0 ? y + height : y) - stroke / 2 + 'px'
  svg.style.width = Math.abs(width) + stroke + 'px'
  svg.style.height = Math.abs(height) + stroke + 'px'
  svg.style.zIndex = 999999999

  return _(svg)
}

/**
 * Create an asset node for selection areas.
 *
 * @param {number} x X-coordinate of starting point in px.
 * @param {number} y Y-coordinate of starting point in px.
 * @param {number} width Width in px. Can be negative.
 * @param {number} height Height in px. Can be negative.
 * @returns {_} FreeDOM node, not added to DOM yet.
 */
function createSelectPiece (x, y, width, height) {
  const zoom = State.getRoomPreference(State.PREF.ZOOM)
  x *= zoom
  y *= zoom
  width *= zoom
  height *= zoom

  // container svg
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('viewBox', `0 0 ${Math.abs(width)} ${Math.abs(height)}`)

  // rect
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', 0)
  rect.setAttribute('y', 0)
  rect.setAttribute('width', Math.abs(width))
  rect.setAttribute('height', Math.abs(height))
  rect.setAttribute('stroke', '#bf40bf')
  rect.setAttribute('stroke-width', 4)
  rect.setAttribute('fill', '#bf40bf')
  rect.setAttribute('fill-opacity', 0.25)
  svg.appendChild(rect)

  // position
  svg.style.left = (width < 0 ? x + width : x) + 'px'
  svg.style.top = (height < 0 ? y + height : y) + 'px'
  svg.style.width = Math.abs(width) + 'px'
  svg.style.height = Math.abs(height) + 'px'
  svg.style.zIndex = 999999999

  return _(svg)
}

/**
 * Zoom in/out in available increments.
 *
 * @param {number} direction If positive, zoom in. Otherwise zoom out.
 */
function zoom (direction) {
  const current = State.getRoomPreference(State.PREF.ZOOM)

  if (direction === 0) { // set to 100%
    Room.setupZoom(1)
  } else if (direction > 0) { // zoom in
    const next = ZOOM_LEVELS.filter(zoom => zoom > current)
    if (next.length > 0) {
      Room.setupZoom(next[0])
    }
  } else { // zoom out
    const next = ZOOM_LEVELS.filter(zoom => zoom < current)
    if (next.length > 0) {
      Room.setupZoom(next.pop())
    }
  }
}

// --- internal ----------------------------------------------------------------

/**
 * Convert a piece data object to a DOM node.
 *
 * @param {object} piece Full piece data object.
 * @returns {_} Converted FreeDOM node (not added to DOM yet).
 */
function pieceToNode (piece) {
  let node

  // create the dom node
  const asset = Content.findAsset(piece.a)
  if (asset === null) {
    switch (piece.a) {
      case Content.ID.POINTER:
        node = createPointerPiece(piece.l)
        break
      case Content.ID.LOS:
        node = createLosPiece(piece.x, piece.y, piece.w, piece.h)
        break
      default:
        node = createInvalidPiece(piece.l)
    }
  } else {
    const uriSide = getAssetURL(asset, piece.s)
    if (asset.base) { // layered asset
      const uriBase = getAssetURL(asset, -1)
      node = _(`.piece.piece-${asset.type}`).create().css({
        '--fbg-base': url(uriBase),
        '--fbg-side': url(uriSide)
      })
    } else { // regular asset
      node = _(`.piece.piece-${asset.type}`).create().css({
        '--fbg-side': url(uriSide)
      })
    }

    if (asset.tx) {
      node.css({
        '--fbg-material': url(getMaterialMedia(asset.tx))
      })
    } else {
      node.remove('--fbg-material')
    }
    if (asset.mask) {
      node.add('.has-mask').css({
        '--fbg-mask': url(getAssetURL(asset, -2))
      })
      const inner = _('.is-mask').create()
      node.add(inner)
    }

    if (asset.d && asset.d >= 1 && asset.d <= 9) {
      node.add(`.is-d-${asset.d}`)
    }

    if (asset.type !== Content.LAYER.STICKER && asset.type !== Content.LAYER.OTHER) {
      if (!asset.bg.match(/^[0-9][0-9]?$/)) {
        // color information is html color or 'transparent' -> apply
        node.css({ '--fbg-color': asset.bg })
      }
    }

    // backsides
    if (piece.l === Content.LAYER.TOKEN && piece._meta.sidesExtra > 0) {
      if (piece.s >= piece._meta.sides) {
        node.add('.is-backside')
      }
    }

    if (piece.f & Content.FLAG.TILE_GRID_MINOR) {
      node.css({
        '--fbg-grid': url(State.getGridFile(asset.bg, 'minor'))
      })
    }
    if (piece.f & Content.FLAG.TILE_GRID_MAJOR) {
      node.css({
        '--fbg-grid': url(State.getGridFile(asset.bg, 'major'))
      })
    }

    if (piece._meta.hasHighlight && !asset.mask) {
      node.add('.has-highlight')
    }
  }

  // set meta-classes on node
  node.id = piece.id

  return node
}

/**
 * Create a new preview piece.
 *
 * @param {string} blob The URL() image data loaded by the browser.
 */
function updatePreviewDOM (blob) {
  const preview = _('.modal-library .is-preview-upload').remove('.is-*').add('.is-preview-upload')
  preview.innerHTML = ''

  const type = _('#upload-type').value
  const material = _('#upload-material').value
  const w = _('#upload-w').value
  const h = _('#upload-h').value

  if (w % 2 === 0) preview.add('.is-even-x')
  if (h % 2 === 0) preview.add('.is-even-y')

  // add piece to DOM
  const piece = _(`.piece.piece-${type}.is-w-${w}.is-h-${h}`).create()
  if (type === Content.LAYER.STICKER || type === Content.LAYER.TILE) {
    piece.css({ '--fbg-color': 'rgba(0,0,0,.05)' })
  } else {
    piece.css({ '--fbg-color': '#202020' })
  }
  if (type === Content.LAYER.TOKEN) {
    piece.add('.has-highlight')
  }
  piece.css({ '--fbg-material': url(getMaterialMedia(material)) })

  if (w > 16 || h > 16) {
    preview.add('.is-deflate-4x')
  } else if (w > 12 || h > 12) {
    preview.add('.is-deflate-3x')
  } else if (w > 8 || h > 8) {
    preview.add('.is-deflate-2x')
  } else if (w > 2 || h > 2) {
    // nothing
  } else {
    preview.add('.is-inflate-2x')
  }

  // asdf grid offset odd/even

  if (blob) { // image loaded
    piece.css({
      backgroundImage: `var(--fbg-material), url("${blob}")`,
      backgroundSize: '256px, cover'
    })
  } else { // show upload placeholder
    piece.css({
      backgroundImage: url('img/upload.svg'),
      backgroundRepeat: 'no-repeat'
    })
    if (w <= 1 || h <= 1) {
      piece.css({ backgroundSize: '32px' })
    } else if (w <= 8 || h <= 8) {
      piece.css({ backgroundSize: '64px' })
    } else {
      piece.css({ backgroundSize: '128px' })
    }
  }

  preview.add(piece)
}

/**
 * Convert a sticky note to a DOM node.
 *
 * @param {object} note Full note data object.
 * @returns {_} Converted FreeDOM node (not added to DOM yet).
 */
function noteToNode (note) {
  const node = _('.piece.piece-note').create()

  if (note.f & Content.FLAG.NOTE_TOPLEFT) {
    node.add('.is-topleft')
  } else {
    node.remove('.is-topleft')
  }

  node.id = note.id
  node.node().innerHTML = markdown(note.t?.[0])

  return node
}

/**
 * Remove dirty / obsolete / bad pieces from room.
 *
 * Usually called during library sync.
 */
function cleanupTable () {
  _('#tabletop .piece.is-invalid').delete()
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @param {string} type Asset type (token, tile, ...).
 * @returns {_} FreeDOM node, not added to DOM yet.
 */
function createInvalidPiece (type) {
  return _(`.piece.piece-${type}.is-invalid`).create()
}

/**
 * Create an asset node for invalid assets / ids.
 *
 * @returns {_} FreeDOM node, not added to DOM yet.
 */
function createPointerPiece () {
  return _('.piece.piece-other.is-pointer').create()
}

/**
 * Detect deleted pieces and remove them from the room.
 *
 * @param {string[]} keepIds IDs of pieces to keep.
 */
function removeObsoletePieces (keepIds) {
  // get all piece IDs from dom
  let ids = getAllPiecesIds()
  ids = Array.isArray(ids) ? ids : [ids]

  // remove ids from list that are still there
  for (const id of keepIds) {
    ids = ids.filter(item => item !== id)
  }

  // remove ids from list that are dragndrop targets
  ids = ids.filter(item => !item.endsWith('-drag'))

  // delete ids that are still left
  for (const id of ids) {
    _('#' + id).delete()
    Popup.close(id)
  }
}

/**
 * Trigger UI update for new/changed server items.
 *
 * @param {object} piece Piece to add/update.
 */
function setItem (piece) {
  switch (piece.l) {
    case Content.LAYER.TILE:
    case Content.LAYER.TOKEN:
    case Content.LAYER.STICKER:
    case Content.LAYER.OTHER:
      setPiece(piece)
      break
    case Content.LAYER.NOTE:
      setNote(piece)
      break
    default:
      // ignore unkown piece type
  }
}

/**
 * Convert markdown to HTML.
 *
 * Will escape HTML already embedded.
 *
 * @param {string} content Markup to convert.
 * @returns {string} Converted markup, ready for xy.innerHTML=...
 */
function markdown (content) {
  return marked.parse((content ?? '').replaceAll('<', '&lt;'))
    .replaceAll('<a ', '<a target="_blank" rel="noopener noreferrer" ')
}
