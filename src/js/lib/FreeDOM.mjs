/**
* @file DOM manipulation helpers.
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

/**
 * Our own little jQuery/Cash/UmbrellaJS/ChibiJS.
 *
 * It can do things like:
 *
 * * _('#username').value = 'Jolie' // set property
 * * _('.selected').value = 'Jolie' // set property of multiple nodes
 * * _('.tabletop .piece.piece-token').add('.is-selected') // add classes
 * * _('.container > .row > .col-12').create() // create nested nodes Emmet-style
 * * _('.piece.is-selected').css({ backgroundColor: 'red' })
 * * _('.piece').on('click', click => { console.log('clicked!') }) // add events
 * * _('input').each(node => { node.value = '' }) // iterate selected nodes
 * * _('.col-12').toggle('.important').css({ display: 'block' }) // chaining
 *
 * ... and more!
 */
class FreeDOM {
  /**
   * Setup DOM manipulation.
   *
   * Accepts a query string or objects to operate on.
   *
   * @param {(String|Element|DOM)} stuff Stuff to operate on. Usually a query string (e.g.
   *              '#myform > input.blue'), but can also be a vanilla Element
   *              or other DOM element.
   */
  constructor (stuff) {
    if (typeof stuff === 'string') {
      this._selector = stuff
      this._nodes = null
    } else if (stuff instanceof globalThis.Element) {
      this._selector = null
      this._nodes = [stuff]
    } else if (stuff instanceof FreeDOM) {
      this._selector = stuff._selector
      this._nodes = stuff._nodes
    } else {
      this._error('can\'t init ' + typeof stuff)
    }
  }

  // --- internal stuff --------------------------------------------------------

  /**
   * Throw an error.
   *
   * Will stop further execution on fatal errors.
   *
   * @param {String} message Text for the Error() object.
   */
  _error (message) {
    throw new Error('_: ' + message)
  }

  /**
   * Get the value of a property from all currently selected Elements.
   *
   * @param {String} property Property to get.
   * @return {*} A single value if one element is selected, an array of values if
   *         multiple elements are selected, or undefined if selection is empty.
   */
  _get (property) {
    const values = []
    this.each(node => { values.push(node[property]) })
    switch (values.length) {
      case 0: return undefined
      case 1: return values[0]
      default: return values
    }
  }

  /**
   * Get nodes that we operate on.
   *
   * Will do a querySelectorAll() lookup if it was not done yet and cache the
   * result.
   *
   * @return {Element[]} Array of matching/assigned Elements or empty Array if nothing
   *         matches our query.
   */
  _getNodes () {
    if (this._nodes === null) {
      this._nodes = document.querySelectorAll(this._selector.replace(/#([0-9])/, '#\\3$1 '))
    }
    return this._nodes
  }

  /**
   * Set a property on all currently selected Elements.
   *
   * @param {String} property Property to set.
   * @param {*} value Vale to set to.
   * @return {FreeDOM} DOM object for chaining.
   */
  _set (property, value) {
    return this.each(node => {
      node[property] = value
    })
  }

  /**
   * Create a Text node.
   *
   * @param {*} value Vale to use. Will be converted to String.
   * @return {Text} DOM Text node.
   */
  _text (value) {
    return document.createTextNode('' + value)
  }

  // --- common node stuff -----------------------------------------------------

  /**
   * Add items to all selected nodes.
   *
   * Supports adding the following:
   * - Element nodes
   * - DOM objects
   * - Text nodes
   * - CSS classes (strings starting with '.')
   *
   * @param {...(Element|DOM|Text|String)} Items to add.
   * @return {FreeDOM} DOM object for chaining.
   */
  add (...items) {
    for (const item of items) {
      if (typeof item === 'string') {
        if (item.charAt(0) === '.') { // add as class
          this.each(node => node.classList.add(item.substr(1)))
        } else { // add as text node
          return this.each(node => node.appendChild(document.createTextNode(item)))
        }
      } else if (item instanceof globalThis.Element) { // add node
        return this.each(node => node.appendChild(item))
      } else if (item instanceof FreeDOM) { // add self
        return this.each(node => node.appendChild(item.node()))
      } else if (item instanceof globalThis.Text) { // add self
        return this.each(node => node.appendChild(item))
      } else {
        this._error('can\'t add() ' + typeof item)
      }
    }
    return this
  }

  /**
   * Count the currently selected nodes.
   *
   * @return {Number} Number of items matched by selector.
   */
  count () {
    return this._getNodes().length
  }

  /**
   * Add css/style declarations to all selected nodes
   *
   * Will set Element.style.* properties provided as flat object.
   *
   * @param {object} css Object with property -> value entries.
   * @return {FreeDOM} DOM object for chaining.
   */
  css (css) {
    return this.each(node => {
      for (const property in css) {
        if (property[0] === '-') {
          node.style.setProperty(property, css[property])
        } else {
          node.style[property] = css[property]
        }
      }
    })
  }

  /**
   * Create nodes using partial Emmety syntax.
   *
   * Will parse the _()-selector given and create nodes for it. For example, ...
   *
   * _('.container>.row>.col-12.col-sm-6>p').create('Hello')
   *
   * ... will create DOM elements representing ...
   *
   * <div class="container">
   *   <div class="row">
   *     <div class="col-12 col-sm-6">
   *       <p>Hello</p>
   *     </div>
   *   </div>
   * </div>
   *
   * The following Emmet operators are supported:
   * - '>' for child items (' ' works, too)
   * - '.' for classes
   *
   * @param {Element|DOM} childItem An item to add as child for the deepest
   *                  child. Can be a Element, a Text node, another DOM
   *                  object or a string. The latter will be converted to a Text.
   * @return {FreeDOM} Topmost DOM object for chaining.
   */
  create (childItem = null) {
    const superselector = this._selector.trim().split(/[ >]/)
    const selector = superselector.shift()

    if (superselector.length > 0) {
      // multiple nodes - create leftmost & recurse
      if (selector === '') { // querystring had multiple ' ' or '>'
        return _(superselector.join('>')).create(childItem)
      } else {
        return _(selector).create().add(_(superselector.join('>')).create(childItem))
      }
    } else { // one node - create it
      let selector = this._selector

      // detect node name & create it
      let element = 'div'
      if (!selector.match(/^[#.]/)) { // we got an element name
        const l = selector.search(/[#.]/)
        element = selector.substr(0, l > 0 ? l : undefined)
        selector = selector.substr(element.length)
      }
      const n = _(document.createElement(element === '' ? 'div' : element))

      // detect additional ids/classes
      while (selector.length > 0) {
        const l = selector.search(/.[#.]/)
        const hasMore = l > 0
        switch (selector.charAt(0)) {
          case '#':
            n.id = selector.substr(1).substr(0, l)
            break
          case '.':
            n.add(selector.substr(0, l > 0 ? l + 1 : undefined))
            break
          default:
            this._error('can\'t create() option ' + selector.charAt(0))
        }
        selector = hasMore ? selector.substr(l + 1) : ''
      }

      // add child to innermost node
      if (childItem !== null) {
        if (childItem instanceof globalThis.Element || childItem instanceof globalThis.Text || childItem instanceof FreeDOM) {
          n.add(childItem)
        } else {
          n.add(this._text(childItem))
        }
      }
      return n
    }
  }

  /**
   * Add data-* attributes to all selected nodes
   *
   * Will set Element.dataset.* properties provided as flat object.
   *
   * @param {object} dataset Object with property -> value entries.
   * @return {FreeDOM} DOM object for chaining.
   */
  data (dataset) {
    return this.each(node => {
      for (const property in dataset) {
        node.dataset[property] = dataset[property]
      }
    })
  }

  /**
   * Remove all selected nodes from DOM tree.
   *
   * Won't return anything as deleting is the end of every chain.
   */
  delete () {
    this.each(node => { node.parentNode.removeChild(node) })
    this._nodes = null // force re-query on next call
  }

  /**
   * Run a method on every selected node.
   *
   * @param {Function} handler Function to call. Will recieve one node at a time
   *                as single parameter.
   * @return {FreeDOM} DOM object for chaining.
   */
  each (handler) { // apply hander to all nodes
    for (const node of this._getNodes()) { handler(node) }
    return this
  }

  /**
   * Remove all child items of all selected nodes.
   *
   * @return {FreeDOM} DOM object for chaining.
   */
  empty () {
    this.each(node => { node.innerHTML = '' })

    return this
  }

  /**
   * Check if the selector matches anything.
   *
   * @return {Boolean} True, if selector selects at least one node in DOM tree.
   */
  exists () {
    return this.count() > 0
  }

  /**
   * Check if the selected nodes have some properties.
   *
   * Supports checking the following:
   * - CSS classes (strings starting with '.')
   *
   * @param {...String} items Items to check for.
   * @return {Boolean} True, if all items are found.
   */
  hasAll (...items) {
    for (const item of items) {
      if (typeof item === 'string' && item.charAt(0) === '.') { // check for class
        const search = item.substr(1, item.length - 2) // remove dot
        this.each(node => {
          for (const cls of node.classList) {
            if (cls.startsWith(search)) continue
          }
        })
      }
      return false
    }
    return true
  }

  /**
   * Check if the selected nodes have some properties.
   *
   * Supports checking the following:
   * - CSS classes (strings starting with '.')
   *
   * @param {...String} items Items to check for.
   * @return {Boolean} True, if at least one item was found.
   */
  hasAny (...items) {
    for (const item of items) {
      if (typeof item === 'string' && item.charAt(0) === '.') { // check for class
        const search = item.substr(1, item.length - 2) // remove dot
        this.each(node => {
          for (const cls of node.classList) {
            if (cls.startsWith(search)) return true
          }
        })
      }
    }
    return false
  }

  /**
   * Get the first matching node.
   *
   * @return {Element} First node.
   * @throws Error, if no node is selected.
   */
  node () { // get first node
    const nodes = this._getNodes()
    if (nodes.length > 0) return nodes[0]
    this._error('no node() selected')
  }

  /**
   * Get all matching nodes.
   *
   * @return {Element[]} Array of nodes, possibly empty.
   */
  nodes () { // get first node
    return this._getNodes()
  }

  /**
   * Add an event handler to each selected node.
   *
   * @param {String} event HTML event, e.g. 'click' or 'mousedown'.
   * @param {Function} handler Function to call when event is triggered. Will recieve the
   *                corresponding event object as first parameter.
   * @return {FreeDOM} DOM object for chaining.
   */
  on (event, handler) {
    return this.each(node => { node.addEventListener(event, e => handler(e)) })
  }

  /**
   * Remove items from all selected nodes.
   *
   * Supports removing the following:
   * - CSS classes (strings starting with '.')
   *
   * @param {...String} items Items to remove.
   * @return {FreeDOM} DOM object for chaining.
   */
  remove (...items) {
    for (const item of items) {
      if (typeof item === 'string') {
        if (item.charAt(0) === '.') { // remove class
          const asterisk = item.indexOf('*')
          if (asterisk < 0) {
            this.each(node => node.classList.remove(item.substr(1)))
          } else {
            const search = item.substr(1, item.length - 2) // remove dot & asterisk
            this.each(node => {
              const toRemove = []
              for (const cls of node.classList) {
                if (cls.startsWith(search)) toRemove.push(cls)
              }
              for (const cls of toRemove) {
                node.classList.remove(cls)
              }
            })
          }
          return this
        } else if (item.charAt(0) === '-') { // remove CSS variable
          this.each(node => node.style.removeProperty(item))
        }
      } else {
        this._error('can\'t remove() ' + typeof item)
      }
    }
  }

  /**
   * Toggle stuff on all selected nodes - usually CSS classes.
   *
   * Toggled items will be turned on / added if they are not active and are
   * turned off / removed if they were active.
   *
   * Supports adding the following:
   * - CSS classes (strings starting with '.')
   *
   * @param {...String} items Items to toggle.
   * @return {FreeDOM} DOM object for chaining.
   */
  toggle (...items) {
    for (let item of items) {
      if (typeof item === 'string' && item.charAt(0) === '.') { // toggle class
        item = item.substr(1)
        for (const node of this._getNodes()) {
          if (node.classList.contains(item)) {
            node.classList.remove(item)
          } else {
            node.classList.add(item)
          }
        }
        return this
      }
      this._error('can\'t toggle() ' + typeof item)
    }
  }

  /**
   * Check if the selector matches exactly one node.
   *
   * @return {Boolean} True, if exactly one node matches. False otherwise.
   */
  unique () {
    return this.count() === 1
  }

  // --- input/form stuff ------------------------------------------------------

  /**
   * Focus the first selected item.
   *
   * Best used for <input>s.
   * @return {FreeDOM} DOM object for chaining.
   */
  focus () {
    if (this.exists()) {
      this.node().focus()
    }
    return this
  }

  /**
   * Return the value of all selected nodes - usually <inputs>. Fall back to
   * placeholder (if any) if the value is empty.
   *
   * @return {any[]} Array of node.value's or node.placeholder's.
   */
  valueOrPlaceholder () {
    const value = this.value.trim()
    return value === '' ? this.placeholder : value
  }
}

/**
 * Magic little proxy that exposes all selected node's properties.
 *
 * Allows calling any property (e.g. .value or .id) on all selected DOM objects
 * by mapping properties to DOM._get() and DOM._set() calls.
 *
 * @param {(String|Element|DOM)} item Stuff forwarded to DOM().
 * @return {FreeDOM} DOM object with enabled proxy calls for getters/setters.
 */
export default function _ (item) {
  // a magic little proxy that exposes all Element properties
  return new Proxy(new FreeDOM(item), {
    set: function (target, prop, value, receiver) {
      if (typeof target[prop] !== 'function' && prop.charAt(0) !== '_') {
        return target._set(prop, value)
      }
      return Reflect.set(...arguments)
    },
    get: function (target, prop, receiver) {
      if (typeof target[prop] !== 'function' && prop.charAt(0) !== '_') {
        return target._get(prop)
      }
      return Reflect.get(...arguments)
    }
  })
}
