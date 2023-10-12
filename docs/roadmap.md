# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.22

* [X] undo
* [X] select-all
* [ ] pre-release
  * [X] bump dependencies
  * [X] bugfixes + refactoring
    * [X] color 0 of token wrong
    * [X] refactor: get 's' out of asset IDs
    * [X] use _test object instead of exports
    * [X] cleanup /? endpoints
    * [X] library: asset no longer selected after rename
  * [X] review docs
  * [X] review tutorial
  * [ ] bump engine, version/codename & update CHANGELOG
  * [X] review + run tests
  * [X] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] bug: table.json cachign in demo mode
* [ ] exclude protected pieces from operation, instead of denying operation
* [ ] cursorkey move selection
* [ ] tooltip explanation for '3x3:3' in library window
* [ ] tweak minor grid visibility
* [ ] refactor: use _private exports for test cases
* [ ] refactor: use events more
* [ ] plugin-hook
* [ ] bug: dragging multi-selected hex tokens does not always snap correctly
* [ ] library editor: replace media/side
* [ ] ui: decks/stacks
* [ ] engine: grid-on-tile flag
* [ ] autopopulate empty data dir (for docker volumes)
* [ ] simplify/automate more deployment steps (ongoing)
  * [ ] automated screenshots using screenshot.zip snapshot
* [ ] engine: option to rotate group vs individual pieces
* [ ] engine: protect api objects in JS code
* [ ] snapshot download for demo mode
* [ ] ui: move dice more
* [ ] bug: png maps make pieces flicker when cursor changes
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] dedicated HP/Mana/Value field(s)
* [ ] ui: set fixed table size (e.g. 73x65)
* [ ] piece: supply heap
* [ ] piece: cards / card-decks
  * [ ] shuffle deck/stack
* [ ] player secrets (e.g. for goal cards, hidden rolling, ...)
* [ ] reduce impact of "back" button
* [ ] dicemat: randomize button
* [ ] dicemat: don't roll dice on transparent parts
* [ ] dicemat: count dice values
* [ ] ui: doubleclick handling?
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] system: password-protect assets, too
* [ ] build: minify js
* [ ] docs: template-template
* [ ] docs: how-to make snapshot `.zip`s
* [ ] API: check sides correspond to asset
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] repo: generate average piece color
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs
* [ ] more backgrounds: snow/ice

### rather later (unsorted, after v1)

* ui skins (modals, fonts, ...)
* library: folder / modules / packages to enable/disable groups of assets (e.g. dungeon, woods, space, ...)
* pieces: inline-edit notes
* better sticky notes (auto-size text)
* bulk manipulation of assets (delete, edit, change type)
* show even more infos in media browser
* sounds
  * dice-roll
  * shuffle
  * object selection
  * moving
* I18N
* cones + attack zones
* rotate desk 90° 180° 270°
* pinboard for handouts
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
* rename room
* custom, faster tooltips
* use left-right keys to switch tabs in modals
* multi-panes / splitscreen / split.js
* auto-z based on tile position
* better fix dragndrop when 'drop' outside
* dark mode css
* library window usability
  * add without closing
  * nicer cards/selection
  * asset adding: (re)set token size 2x2->3x4
* FreeDOM: Emmet '~' support
* users + roles
  * admins, players, spectators
  * vote for new admin / gm
* cache/resuse/symlink same assets in different table folders (via sha256?)
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* lobby / room browser
