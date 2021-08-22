# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.10 - Pointing Pony

* [X] pointer feature
* [X] different edit modals per piece type (hide useless fields)
* [X] token status (blind, poison, prone, dazed, ...)
* [X] unit tests for client data model
* [ ] pre-release
  * [ ] bugfixing
    * [X] css cleanup
    * [ ] note rotation
    * [X] wrong snapshot filename timezone
    * [ ] library tab sometimes wrong size
    * [ ] tolerate expires field on snapshot load
  * [ ] review + run tests
  * [ ] update screenshots
  * [ ] review docs
  * [ ] bump version/codename & update CHANGELOG

## v0.xx - Mobile Monkey

* better tablet / touch support
  * zooming
  * moving pieces
* table passwords

## v0.yy - Clean Cat

* empty template table
* reduce impact of "back" button
* concurrent drag-n-drop - first mover wins
* (bulk) manipulation of assets (delete, edit, change type)
* remove default entries from json files before save (e.g. side=0)
* add template version to asset urls
* catch all unhandled warnings/exceptions in PHP API and return 500

## Backlog (unsorted)

### rather sooner

* slightly table texture offset for different tables 1..9
* generic marker overlay (X, ?, ...)
* docs how to make table/template `.zip`s
* click thru / don't drag on transparent parts of images
* LOS-ruler
* more tabletop settings (e.g. change background, grid)
* undo (limited)
* demo mode (serverless?)
* use image masks for png backsides
* show backside/all sides in tile browser
* better sticky notes (more text, auto-size text)
* protect pieces (no-delete, no-move)
* meta-piece: supply heap
* overlay-grid-on-tile option
* hide .../data/... from URLs (via .htaccess)
* support for stacks/decks of cards
  * shuffle deck/stack
* option to force-install templates with invalid versions
* rightclick on desk -> add piece popup
* multi-select stuff
* add more classic game boards: go, backgammon, mills, solitaire
* "layer not active" hint when dragging nothing
* I18N
* show even more infos in media browser
* full-screen key
* dedicated HP/Mana/Value field(s)
* token status (blind, poison, prone, dazed, ...)
* obfuscate/hash room name
* pinboard for handouts
* tour / first-time-tutorial
* API Docs
* randomize button on dicemat
* generate average piece color during build and upload

### rather later

* color.sh: detect dominant piece color instead of average color
* compile js for older browsers (<globalThis)
* arbitrary layers
* link to subtable in url via /roomname#1
* game rules / metainfos (pdf) links in help
* send to previous position for pieces
* point-somewhere feature
* detail-pane to the right for selected item
* move stuff via cursor keys
* rename table
* custom, faster tooltips
* use left-right keys to switch tabs in modals
* arbitrary snap (e.g. 1px)
* tabs / multiple desks
* multi-panes / splitscreen / split.js
* measure range (in fields)
* delay dragndrop till min 2px are moved to avoid jigging
* auto-z based on tile position
* better fix dragndrop when 'drop' outside
* dark mode css
* library window usability
  * add without closing
  * nicer cards/selection
  * multiselect + create
  * asset adding: (re)set token size 2x2->3x4
* FreeDOM: Emmet '~' support
* shared notepad / scratchpad / piece of paper / postits
* users + roles
  * admins, players, spectators
  * vote for new admin / gm
* cache/resuse/symlink same assets in different table folders (via sha256?)
* common shadow layer for tile layer
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* hex mode
