# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.13 - ??? ???

* [ ] change backgrounds from room to server setting
* [ ] elemental status icons
* [ ] predefined piece/asset colors
* [ ] table passwords
* [ ] LOS-ruler
* [ ] advanced grid settings (minor, major)
* [X] added separate color sets in templates for piece's borders and backgrounds
* [ ] add template name + version to asset urls
* [ ] pre-release
  * [ ] bump dependencies
  * [ ] bugfixes + refactoring
    * [X] "RPG" template glass tiles transparency
    * [X] dice rolling
    * [X] match library preview to show default color "none"
    * [ ] rotating border highlights
    * [X] refactor all JS-CSS changes to custom properties
  * [ ] update screenshots
  * [ ] review docs
  * [ ] review + run tests
    * [X] document how to run tests
    * [X] add more PHP unit tests
    * [X] add more JS unit tests
    * [ ] add more integration/API tests
  * [ ] bump version/codename & update CHANGELOG

## Backlog (unsorted)

### rather sooner

* [ ] automated deployment tests for new zip/tgz packages after build
* [ ] demo mode (serverless?)
* [ ] more helper/marker overlays (arrows, areas, )
* [ ] provide clearer feedback when uploading incompatible templates / parsing errors happen
* [ ] right-click on table (add piece, change table)
* [ ] set default/start table other than 1 in template
* [ ] delete items from library
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] dragging some pieces should not change z (e.g. dicemat)
* [ ] multi-select stuff
* [ ] move / copy setups between tables
* [ ] protect pieces (no-delete, no-move)
* [ ] show backside/all sides in tile browser
* [ ] dedicated HP/Mana/Value field(s)
* [ ] meta-piece: supply heap
* [ ] support for stacks/decks of cards
  * [ ] shuffle deck/stack
* [ ] player secrets (e.g. for goal cards, hidden rolling, ...)
* [ ] better sticky notes (auto-size text)
* [ ] manipulation of single assets in library (edit, change type)
* [ ] more tabletop settings in UI (e.g. grid)
* [ ] reduce impact of "back" button
* [ ] "layer not active" hint when dragging nothing
* [ ] randomize button on dicemat
* [ ] generic marker overlay (X, ?, ...)
* [ ] add more classic game boards: backgammon, mills, solitaire
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
* sounds
  * dice-roll
  * shuffle
  * object selection
  * moving
* option to force-install templates with invalid versions
* I18N
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
* lobby / room browser
