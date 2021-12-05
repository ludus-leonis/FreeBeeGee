/**
 * @file Handles the library modal.
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
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

import _ from '../../../lib/FreeDOM.mjs'
import {
  UnexpectedStatus
} from '../../../api/index.mjs'
import {
  toTitleCase,
  toCamelCase,
  sortByString
} from '../../../lib/utils.mjs'
import {
  createModal,
  getModal,
  modalActive,
  modalClose
} from '../../../view/modal.mjs'
import {
  getLibrary,
  getTemplate,
  createPieces,
  getRoomPreference,
  setRoomPreference,
  addAsset,
  reloadRoom
} from '../../../state/index.mjs'

import {
  createPieceFromAsset,
  populatePieceDefaults,
  splitAssetFilename,
  snap
} from '../tabletop/tabledata.mjs'
import {
  pieceToNode
} from '../tabletop/index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Show the pieces library modal.
 *
 * @param {Object} tile {x, y} coordinates (tile) where to add.
 */
export function modalLibrary (xy) {
  if (!modalActive()) {
    const node = createModal(true)
    node.xy = xy

    _('#modal-header').innerHTML = `
      <h3 class="modal-title">Library</h3>
    `
    _('#modal-body').add('.is-maximizied').innerHTML = `
      <div class="has-spinner">Loading</div>
    `
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>

      <span class="search">${iconSearch}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>

      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `

    _('#modal').add('.modal-library').on('hidden.bs.modal', () => modalClose())

    _('#modal-body').innerHTML = `
      <div id="tabs-library" class="tabs">
        <input id="tab-1" type="radio" name="tabs" value="tile">
        <input id="tab-2" type="radio" name="tabs" value="overlay">
        <input id="tab-3" type="radio" name="tabs" value="token">
        <input id="tab-4" type="radio" name="tabs" value="other">
        <input id="tab-5" type="radio" name="tabs" value="upload">
        <div class="tabs-tabs">
          <label for="tab-1" class="tabs-tab">Tiles</label>
          <label for="tab-2" class="tabs-tab">Overlays</label>
          <label for="tab-3" class="tabs-tab">Token</label>
          <label for="tab-4" class="tabs-tab">Dice &amp; Cards</label>
          <label for="tab-5" class="tabs-tab">Upload</label>
        </div>
        <div class="tabs-content">
          <div class="container"><div id="tab-tiles" class="row"></div></div>
          <div class="container"><div id="tab-overlays" class="row"></div></div>
          <div class="container"><div id="tab-tokens" class="row"></div></div>
          <div class="container"><div id="tab-other" class="row"></div></div>
          <form class="container"><div id="tab-upload" class="row">
            <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>
            <div class="col-12">
              <h3>Upload piece</h3>
            </div>
            <div class="col-12 col-lg-6">
              <label for="upload-name">Name</label>
              <input id="upload-name" name="name" type="text" placeholder="custom" minlength="1" maxlength="64" pattern="^[a-zA-Z0-9-]+( [a-zA-Z0-9-]+)*(, [a-zA-Z0-9-]+)?( [a-zA-Z0-9-]+)*$">
            </div>
            <div class="col-12 col-lg-2">
              <label for="upload-type">Type</label>
              <select id="upload-type" name="type"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="upload-w">Width</label>
              <select id="upload-w" name="width"></select>
            </div>
            <div class="col-6 col-lg-2">
              <label for="upload-h">Height</label>
              <select id="upload-h" name="height"></select>
            </div>
            <div class="col-12">
              <label class="upload-group" for="upload-file">
                <div class="upload-preview" title="Click to upload"></div>
                <input id="upload-file" type="file" accept=".jpg,.jpeg,.png", class="is-hidden">
              </label>
            </div>
            <div class="col-6">
              <p class="fbg-error"></p>
            </div>
          </div></form>
        </div>
      </div>
    `

    // store/retrieve selected tab
    _('input[name="tabs"]').on('change', change => {
      setRoomPreference('modalLibraryTab', change.target.id)
    })
    const preselect = getRoomPreference('modalLibraryTab') ?? 'tab-1'
    _('#' + preselect).checked = true

    refreshTabs()
    setupTabUpload()
    setupFooter()
    getModal().show()
    _('#input-search').focus()

    // adapt footer on change
    _('[name="tabs"]').on('change', click => {
      setupFooter()
    })
  }
}

// --- internal ----------------------------------------------------------------

let prevSearch = ''

/**
 * Get a fresh dataset from the state and populate the tabs with the items.
 */
function refreshTabs () {
  const library = getLibrary()

  // add items to their tab
  const tiles = _('#tab-tiles').empty()
  for (const asset of sortByString(library.tile ?? [], 'alias')) {
    tiles.add(assetToPreview(asset))
  }
  const overlays = _('#tab-overlays').empty()
  for (const asset of sortByString(library.overlay ?? [], 'alias')) {
    overlays.add(assetToPreview(asset))
  }
  const tokens = _('#tab-tokens').empty()
  for (const asset of sortByString(library.token ?? [], 'alias')) {
    tokens.add(assetToPreview(asset))
  }
  const other = _('#tab-other').empty()
  for (const asset of sortByString(library.other ?? [], 'alias')) {
    other.add(assetToPreview(asset))
  }

  // enable selection
  _('#tabs-library .is-scale-2').on('click', click => {
    _(click.target).toggle('.is-selected')

    // update add button
    const count = _('#tabs-library .is-selected').count()
    let label
    switch (count) {
      case 0:
        label = 'Add'
        break
      case 1:
        label = 'Add 1'
        break
      default:
        label = 'Add ' + count
    }
    _('#btn-ok').innerHTML = label

    click.preventDefault()
  })
}

/**
 * Setup the footer / buttons.
 *
 * Varies between upload form and all the other tabs.
 */
function setupFooter () {
  prevSearch = _('#input-search').value ?? prevSearch

  if (_('input[name="tabs"]:checked').value === 'upload') {
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <button id='btn-ok' type="button" class="btn btn-primary">Upload</button>
    `
    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalUpload())
  } else {
    _('#modal-footer').innerHTML = `
      <button id='btn-close' type="button" class="btn">Cancel</button>
      <span class="search">${iconSearch}<input id='input-search' type="text" class="search" placeholder="search ..." maxlength="8"></span>
      <button id='btn-ok' type="button" class="btn btn-primary">Add</button>
    `
    _('#input-search').on('keyup', () => filter()).value = prevSearch
    filter()
    _('#input-search').focus()

    _('#btn-close').on('click', () => getModal().hide())
    _('#btn-ok').on('click', () => modalOk())
  }
}

/**
 * Execute the upload form.
 */
function modalUpload () {
  _('#btn-ok').add('.is-spinner')

  // reset error
  const errorMessage = _('#modal-body .fbg-error')
  errorMessage.innerHTML = ''

  // do sanity checks
  const name = _('#upload-name')
  if (name.value.length <= 0 || _('#upload-name:invalid').exists()) {
    errorMessage.innerHTML += 'Invalid name. '
    name.focus()
  }
  const file = _('#upload-file').files[0]
  if (file) {
    if (file.size > 512 * 1024 * 1024) {
      errorMessage.innerHTML += 'Image filesize too large (> 512kB). '
    }
    switch (file.type) {
      case 'image/jpeg':
      case 'image/png':
        // whitelisted ok
        break
      default:
        errorMessage.innerHTML += 'Unsupported file format. '
    }
  } else {
    errorMessage.innerHTML += 'No image selected. '
  }

  // upload stuff if checks were ok
  if (errorMessage.innerHTML === '') {
    const layer = _('#upload-type').value
    const data = {
      name: unprettyName(name.value),
      format: file.type === 'image/png' ? 'png' : 'jpg',
      layer: layer,
      w: Number(_('#upload-w').value),
      h: Number(_('#upload-h').value),
      base64: _('.upload-preview .piece').node().style.backgroundImage
        .replace(/^[^,]*,/, '')
        .replace(/".*/, ''),
      bg: layer === 'token' ? '#808080' : 'transparent'
    }

    addAsset(data)
      .then(remoteImage => {
        reloadRoom()
          .then(() => {
            refreshTabs()
            switch (data.layer) {
              case 'tile':
                _('#tab-1').checked = true
                break
              case 'overlay':
                _('#tab-2').checked = true
                break
              case 'token':
                _('#tab-3').checked = true
                break
              default:
            }
            setupFooter()
          })
      })
      .catch(error => {
        console.error(error)
        _('#ok').remove('.is-spinner')
        if (error instanceof UnexpectedStatus) {
          switch (error.status) {
            default:
              errorMessage.innerHTML = 'Upload failed. '
          }
        }
        _('#btn-ok').remove('.is-spinner')
      })
  } else {
    _('#btn-ok').remove('.is-spinner')
  }
}

/**
 * Add everything needed to the upload tab.
 */
function setupTabUpload () {
  // width
  const layer = _('#upload-type')
  for (const l of ['token', 'overlay', 'tile']) {
    const option = _('option').create(toTitleCase(l))
    option.value = l
    if (l === 'token') option.selected = true
    layer.add(option)
  }
  layer.on('change', change => updatePreview())

  // width
  const width = _('#upload-w')
  for (let w = 1; w <= 32; w++) {
    const option = _('option').create(w)
    option.value = w
    if (w === 1) option.selected = true
    width.add(option)
  }
  width.on('change', change => updatePreview())

  // height
  const height = _('#upload-h')
  for (let h = 1; h <= 32; h++) {
    const option = _('option').create(h)
    option.value = h
    if (h === 1) option.selected = true
    height.add(option)
  }
  height.on('change', change => updatePreview())

  _('#upload-file').on('change', change => updatePreview(true))

  updatePreview()
}

/**
 * Update the upload WYSIWYG preview based on the selected infos.
 */
function updatePreview (parseImage = false) {
  const preview = _('.modal-library .upload-preview').remove('.is-*')
  preview.innerHTML = ''

  const file = _('#upload-file').files[0]
  if (parseImage) {
    const parts = splitAssetFilename(file.name)
    if (_('#upload-name').value.length <= 0) { // guess defaults for form
      _('#upload-w').value = parts.w
      _('#upload-h').value = parts.h
      if (parts.alias !== 'unknown') {
        _('#upload-name').value = prettyName(parts.alias)
      }
      if (parts.w > 2 || parts.h > 2) {
        _('#upload-type').value = 'tile'
      } else {
        _('#upload-type').value = 'token'
      }
    }
  }

  const type = _('#upload-type').value
  const w = _('#upload-w').value
  const h = _('#upload-h').value

  if (w > 16 || h > 16) {
    preview.add('.is-deflate-4x')
  } else if (w > 12 || h > 12) {
    preview.add('.is-deflate-3x')
  } else if (w > 8 || h > 8) {
    preview.add('.is-deflate-2x')
  } else if (w > 2 || h > 2) {
  } else {
    preview.add('.is-inflate-2x')
  }

  // add piece to DOM
  const piece = _(`.piece.piece-${type}.is-w-${w}.is-h-${h}`).create()
  if (type === 'overlay' || type === 'tile') {
    piece.css({
      backgroundColor: 'rgba(0,0,0,.05)'
    })
  } else {
    piece.css({
      backgroundColor: 'var(--fbg-piece-color)'
    })
  }
  preview.add(piece)

  // set preview background image
  if (file) {
    const reader = new FileReader()
    reader.addEventListener('load', event => {
      _('.upload-preview .piece').css({ backgroundImage: `url("${event.target.result}")` })
    }, false)
    reader.readAsDataURL(file)
  } else {
    piece.css({
      backgroundImage: 'url("img/upload.svg")',
      backgroundSize: '25%'
    })
  }
}

/**
 * Convert a library entry to a preview DOM element.
 *
 * @param {Object} assetJson The asset to convert.
 * @return {HTMLElement} Node for the modal.
 */
function assetToPreview (asset) {
  const node = pieceToNode(populatePieceDefaults({
    id: 'x' + asset.id,
    asset: asset.id,
    side: 0
  })).add(
    '.is-w-' + asset.w,
    '.is-h-' + asset.h
  )
  node.dataset.asset = asset.id

  const max = _('.is-scale-2').create(node)

  const card = _('.col-6.col-sm-4.col-md-3.col-lg-2.col-card').create(max)
  node.add('.is-max-' + Math.max(asset.w, asset.h))
  max.add('.is-max-' + Math.max(asset.w, asset.h))
  let tag = ''
  if (asset.w > 2 || asset.h > 2) {
    tag = `${asset.w}x${asset.h}`
  }
  if (asset.media.length > 1) {
    tag += `:${asset.media.length}`
  }
  if (tag !== '') max.add(_('.tag.tr').create().add(tag))
  card.add(_('p').create().add(prettyName(asset.alias)))
  return card
}

/**
 * Make an asset's name readable.
 *
 * Drops the group part (before the dot) and title-cases the rest.
 *
 * @param {String} assetName Name to convert, e.g. 'dungeon.ironDoor'.
 * @return {String} Improved name, e.g. 'Iron Door'.
 */
function prettyName (assetName = '') {
  const split = assetName.split('.')
  if (split.length <= 1) {
    return toTitleCase(split[0].replace(/([A-Z])/g, ' $1').trim())
  } else if (split[0] === '_') { // sort-first character
    return toTitleCase(split[1].replace(/([A-Z])/g, ' $1').trim())
  } else {
    return toTitleCase(split[0].replace(/([A-Z])/g, ' $1').trim()) +
    ', ' + toTitleCase(split[1].replace(/([A-Z])/g, ' $1').trim())
  }
}

/**
 * Convert an asset's readable name back into an alias.
 *
 * @param {String} assetName Name to convert, e.g. 'Iron Door'.
 * @return {String} Alias for filename, e.g. 'ironDoor'.
 */
function unprettyName (assetName = '') {
  const split = assetName.split(',')
  if (split.length <= 1) {
    return toCamelCase(split[0].trim())
  } else {
    return toCamelCase(split[0].trim()) + '.' + toCamelCase(split[1].trim())
  }
}

/**
 * Hides modal and adds the selected piece after user clicks OK.
 */
function modalOk () {
  const modal = document.getElementById('modal')
  const pieces = []
  const snapped = snap(modal.xy.x, modal.xy.y, getTemplate().snapSize)
  let offsetZ = 0
  _('#tabs-library .is-selected .piece').each(item => {
    const piece = createPieceFromAsset(item.dataset.asset, snapped.x, snapped.y)

    piece.z = piece.z + offsetZ
    pieces.push(piece)
    offsetZ += 1
  })
  if (pieces.length > 0) {
    createPieces(pieces, true)
    getModal().hide()
  }
}

/**
 * Filter items in the library by string entered in the bottom input field.
 */
function filter () {
  const filter = _('#input-search').value.trim().toLowerCase()

  _('#tabs-library .col-card p').each(p => {
    if (!p.innerText.toLowerCase().includes(filter)) {
      p.parentNode.classList.add('is-gone')
    } else {
      p.parentNode.classList.remove('is-gone')
    }
  })
}

const iconSearch = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
