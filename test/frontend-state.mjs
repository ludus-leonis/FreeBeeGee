/**
 * @copyright 2021 Markus Leupold-Löwenthal
 *
 * @license This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

/* global describe, it */

import { expect } from 'chai'
import {
  _setState,
  _setRoom,
  getState,
  getStateNo,
  setStateNo,
  getRoom,
  getTemplate,
  getLibrary,
  isTabActive,
  setTabActive
} from '../src/js/room/table/state.mjs'

describe('Frontend - state.mjs', function () {
  it('getRoom() getTemplate() getLibrary()', function () {
    _setRoom(undefined)
    expect(getRoom()).to.be.eq(undefined)
    expect(getTemplate()).to.be.eq(undefined)

    _setRoom(JSON.parse(roomJSON))
    expect(getRoom()).to.be.an('object')
    expect(getRoom().id).to.be.eq('f9d05a1ecec3ecb8')
    expect(getTemplate()).to.be.an('object')
    expect(getTemplate().type).to.be.eq('grid-square')
    expect(getLibrary()).to.be.an('object')
    expect(getLibrary().overlay).to.be.an('array')
    expect(getLibrary().tile).to.be.an('array')
    expect(getLibrary().other).to.be.an('array')
    expect(getLibrary().token).to.be.an('array')
  })

  it('getState()', function () {
    _setState(1, [JSON.parse(pieceJSON)])

    expect(getState(1)).to.be.an('array')
    expect(getState(1).length).to.be.eq(1)
    expect(getState(1)[0].id).to.be.eq('fe008a4da3b2511e')

    expect(getState(2)).to.be.eql([])
  })

  it('getStateNo() setStateNo()', function () {
    _setState(1, [JSON.parse(pieceJSON)])
    _setRoom(JSON.parse(roomJSON))

    expect(getStateNo()).to.be.eq(1)

    expect(getState()).to.be.an('array')
    expect(getState().length).to.be.eq(1)
    expect(getState()[0].id).to.be.eq('fe008a4da3b2511e')

    setStateNo(2, false)
    expect(getStateNo()).to.be.eq(2)

    expect(getState()).to.be.eql([])

    setStateNo(1, false)
    expect(getStateNo()).to.be.eq(1)
  })

  it('setTabActive() isTabActive', function () {
    _setState(1, [JSON.parse(pieceJSON)])

    expect(isTabActive()).to.be.eq(true)
    setTabActive(false, false)
    expect(isTabActive()).to.be.eq(false)
  })
})

const pieceJSON = '{"id":"fe008a4da3b2511e","layer":"other","asset":"f45f27b57498c3be","x":256,"y":192,"z":13,"side":4}'

const roomJSON = '{"id":"f9d05a1ecec3ecb8","name":"selfishExaminingBaboon","engine":"0.3.0","background":{"color":"#423e3d","scroller":"#2b2929","image":"img/desktop-wood.jpg"},"library":{"overlay":[{"media":["area.1x1.1x1x1.svg","##BACK##"],"w":1,"h":1,"color":"#808080","alias":"area.1x1","type":"overlay","id":"7261fff0158e27bc"}],"tile":[{"media":["altar.3x2x1.transparent.png","##BACK##"],"w":3,"h":2,"color":"transparent","alias":"altar","type":"tile","id":"5b150d84cee577dc"}],"token":[{"media":["aasimar.1x1x1.border.svg","##BACK##"],"w":1,"h":1,"color":"border","alias":"aasimar","type":"token","id":"484d7d45fdc27afa"}],"other":[{"media":["classic.a.1x1x1.svg","classic.a.1x1x2.svg","classic.a.1x1x3.svg"],"w":1,"h":1,"color":"#808080","alias":"classic.a","type":"other","id":"f45f27b57498c3be","base":"classic.a.1x1x0.png"}],"note":[]},"template":{"type":"grid-square","version":"0.9.0-dev","engine":"^0.3.0","gridSize":64,"gridWidth":48,"gridHeight":32,"snapSize":32,"colors":[{"name":"black","value":"#0d0d0d"},{"name":"blue","value":"#061862"},{"name":"white","value":"#ffffff"}]},"credits":"test template","width":3072,"height":2048}'
