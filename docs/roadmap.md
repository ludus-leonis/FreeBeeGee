# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.24.0

* [X] zoom-to-cursor
* [X] rotate dice on random
* [X] random 360° rotation for pieces via Alt+r
* [ ] different blue menu for measure and non-measure mode
* [ ] use png for mask + image in upload
* [ ] pre-release
  * [ ] bump dependencies
  * [ ] bugfixes + refactoring
    * [X] note padding won't zoom properly
    * [X] clone no-clone object disables edit without reselection
    * [X] refactor imports and module responsibility
    * [X] should token numbers increase on cut+paste?
    * [X] long token label + 2 icons cutoff wrong
    * [X] linen material border
    * [X] token number material
    * [ ] upload preview - no shadow
    * [ ] upload preview - no material on default token
  * [ ] review docs
  * [ ] review tutorial
  * [ ] bump engine, version/codename & update CHANGELOG
  * [ ] review + run tests
  * [ ] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] refactor: always use getFeatures([piece]) to check
* [ ] refactor: test selectionFeatures() for mixed selections, e.g. .flip
* [ ] refactor: always use numeric layer number in 'l' (no string translation)
* [ ] refactor: frontend-state: test all State.xyz, all API endpoints
* [ ] switch to PHP 8.3 for docker release
* [ ] invert svg/decal on white
* [ ] refactor: system asset flag instead of '_'
* [ ] snapshot download for demo mode
* [ ] doubleclick opens edit modal
* [ ] plugin-hook
* [ ] bug: font Patrick Hand glyphbox error
* [ ] library editor: replace media/side
* [ ] ui: decks/stacks
* [ ] simplify/automate more deployment steps (ongoing)
  * [ ] automated screenshots using screenshot.zip snapshot
* [ ] engine: option to rotate group vs individual pieces
* [ ] engine: protect api objects in JS code
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
* [ ] outline material overlay
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] system: password-protect assets, too
* [ ] build: minify js
* [ ] API: check sides correspond to asset
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] refactor: use events more
* [ ] docs: template-template
* [ ] docs: how-to make snapshot `.zip`s
* [ ] repo: generate average piece color & svg mask
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs

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
