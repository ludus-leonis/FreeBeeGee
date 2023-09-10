# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.21 - ??? ???

* [X] show tile+token sides as individual pieces in library
* [X] library editor: edit asset name / size / material / color
* [X] wooden cubes
* [X] paper background for windows and cards
* [X] open edit window on note create
* [X] ui
  * [X] smaller modal paddings
  * [X] half-rotations via settings (45° for square, 30° for hex)
* [X] clipboard ctrl+c/v/x on/between tables
* [X] change docker image to PHP 8.2
* [X] add error message when snapshot list is empty
* [X] improve server-delete timespan display
* [ ] pre-release
  * [X] bump dependencies
  * [X] bugfixes + refactoring
    * [X] github action to rebuid app on dev
    * [X] add tabular numbers for library editor tree/preview
    * [X] refactor: add jsdoc linting
    * [X] refactor: use npm linter instead of gulp linter
    * [X] refactor: add GitHub Actions for automated build
    * [X] refactor: replace gulp-image with custom plugin
    * [X] refactor: replace sass-lint with stylelint
    * [X] fix texture bug on non-square assets
    * [X] click on icon in popup does not trigger function
    * [X] document or improve data volume mounting strategy
  * [X] review docs
  * [X] review tutorial
  * [X] bump engine, version/codename & update CHANGELOG
  * [X] review + run tests
  * [X] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] bug: selection lost after clone
* [ ] refactor: use _private exports for test cases
* [ ] refactor: use events more
* [ ] refactor: get 's' out of asset IDs
* [ ] plugin-hook
* [ ] bug: dragging multi-selected hex tokens does not always snap correctly
* [ ] library editor: replace media/side
* [ ] ui: decks/stacks
* [ ] ui: tweak minor grid visibility
* [ ] engine: grid-on-tile flag
* [ ] autopopulate empty data dir (for docker volumes)
* [ ] simplify/automate more deployment steps (ongoing)
  * [ ] automated screenshots using screenshot.zip snapshot
* [ ] engine: option to rotate group vs individual pieces
* [ ] engine: protect api objects in JS code
* [ ] snapshot download for demo mode
* [ ] ui: move dice more
* [ ] ui: library: tooltip explanation for '3x3:3' in library window
* [ ] bug: png maps make pieces flicker when cursor changes
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] dedicated HP/Mana/Value field(s)
* [ ] ui: set fixed table size (e.g. 73x65)
* [ ] undo / time travel
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
* move stuff via cursor keys
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
