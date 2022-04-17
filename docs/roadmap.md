# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.15 - Protecting Porpoise

* [X] repo: Docker build
* [X] system: table passwords
* [X] table: dragging some pieces should not change z (e.g. dicemat)
* [X] system: color masks for dice, areas, zones and pins
* [X] content: more classic game boards - backgammon, mills, solitaire, ...
* [X] content: more helper/marker overlays (pin, areas)
* [X] system: random material offset
* [X] protected pieces: no-delete, no-clone, no-move
* [ ] pre-release
  * [X] bump dependencies
  * [ ] bugfixes + refactoring
    * [X] refactor pieces scss
    * [X] disable rotate for other-pieces
    * [X] count _ assets against room size limit
    * [X] dicemat to-bottom not working
  * [X] review docs
  * [X] review + run tests
  * [X] review tutorial
  * [X] bump engine, version/codename & update CHANGELOG
  * [ ] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] repo: automated deployment tests for new zip/tgz packages after build
* [ ] table: native zoom function
* [ ] snapshot: set default/start table other than 1 in template
* [ ] library: delete assets UI
* [ ] library: edit asset UI
* [ ] library: show/indicate backside/all sides in tile browser
* [ ] bug: png maps make pieces flicker when cursor changes
* [ ] pieces: inline-edit notes
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] multi-select stuff
* [ ] move / copy setups between tables
* [ ] dedicated HP/Mana/Value field(s)
* [ ] piece: supply heap
* [ ] piece: cards / card-decks
  * [ ] shuffle deck/stack
* [ ] player secrets (e.g. for goal cards, hidden rolling, ...)
* [ ] reduce impact of "back" button
* [ ] "layer not active" hint when dragging nothing
* [ ] dicemat: randomize button
* [ ] dicemat: don't roll dice on transparent parts
* [ ] dicemat: count dice values
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] system: password-protect assets, too
* [ ] docs how to make table/template `.zip`s
* [ ] API: check sides correspond to asset
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] repo: generate average piece color
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs
* [ ] Firefox: filter + 180° bug

### rather later (unsorted, after v1)

* better sticky notes (auto-size text)
* bulk manipulation of assets (delete, edit, change type)
* show even more infos in media browser
* overlay-grid-on-tile option
* sounds
  * dice-roll
  * shuffle
  * object selection
  * moving
* I18N
* rotate desk 180°
* pinboard for handouts
* undo (limited)
* better tablet / touch support
  * zooming
  * moving pieces
* color.sh: detect dominant piece color instead of average color
* compile js for older browsers (<globalThis)
* arbitrary layers via template configuration
* link to subtable in url via /roomname#1
* game rules / metainfos (pdf) links in help
* send to previous position for pieces
* detail-pane to the right for selected item
* move stuff via cursor keys
* rename table
* custom, faster tooltips
* use left-right keys to switch tabs in modals
* arbitrary snap (e.g. 1px)
* multi-panes / splitscreen / split.js
* measure range (in fields)
* auto-z based on tile position
* better fix dragndrop when 'drop' outside
* dark mode css
* library window usability
  * add without closing
  * nicer cards/selection
  * asset adding: (re)set token size 2x2->3x4
* FreeDOM: Emmet '~' support
* shared notepad / scratchpad / piece of paper / postits
* users + roles
  * admins, players, spectators
  * vote for new admin / gm
* cache/resuse/symlink same assets in different table folders (via sha256?)
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* lobby / room browser
