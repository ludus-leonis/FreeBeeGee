# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.12 - Hexing Heron

* [X] Hex mode
  * [X] Engine changes
  * [X] Game template
* [X] click thru / don't select on transparent parts of images
* [X] more table backgrounds
* [X] improved generic game token / Go piece / bead
* [X] toggle grid on/off (visual)
* [X] use image masks for backsides
* [X] fullscreen hotkey (F11)
* [ ] pre-release
  * [X] bugfixing
    * [X] unreadable piece numbers on white borders
    * [X] tokens sometime shifting when selecting
    * [X] build speed by caching some files
    * [X] library search sometimes missing / ok not working
    * [X] check existing rooms for engine mismatch after updates
  * [ ] review + run tests
  * [X] update screenshots
  * [X] review docs
  * [ ] bump version/codename & update CHANGELOG

## Backlog (unsorted)

### rather sooner

* [ ] provide clearer feedback when uploading incompatible templates / parsing errors happen
* [ ] right-click on table (add piece, change table)
* [ ] set default/start table other than 1 in template
* [ ] table passwords
* [ ] delete items from library
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] dragging some pieces should not change z (e.g. dicemat)
* [ ] multi-select stuff
* [ ] move / copy setups between tables
* [ ] protect pieces (no-delete, no-move)
* [ ] LOS-ruler
* [ ] toggle grid on/off (snapping)
* [ ] show backside/all sides in tile browser
* [ ] dedicated HP/Mana/Value field(s)
* [ ] meta-piece: supply heap
* [ ] support for stacks/decks of cards
* [ ] shuffle deck/stack
* [ ] better sticky notes (auto-size text)
* [ ] manipulation of single assets in library (edit, change type)
* [ ] more tabletop settings in UI (e.g. grid)
* [ ] reduce impact of "back" button
* [ ] "layer not active" hint when dragging nothing
* [ ] demo mode (serverless?)
* [ ] randomize button on dicemat
* [ ] generic marker overlay (X, ?, ...)
* [ ] add more classic game boards: backgammon, mills, solitaire
* [ ] remove default entries from json files before save (e.g. side=0)
* [ ] add template version to asset urls
* [ ] generate average piece color during build and upload
* [ ] catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] hide .../data/... from URLs (via .htaccess)
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] obfuscate/hash room name
* [ ] docs how to make table/template `.zip`s
* [ ] API Docs

### rather later

* bulk manipulation of assets (delete, edit, change type)
* show even more infos in media browser
* overlay-grid-on-tile option
* option to force-install templates with invalid versions
* I18N
* pinboard for handouts
* undo (limited)
* better tablet / touch support
  * zooming
  * moving pieces
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
