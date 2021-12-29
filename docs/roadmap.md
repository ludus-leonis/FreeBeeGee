# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.14 - ??? ???

* [X] change RPG template tiles to paper material
* [ ] autofix older rooms (or be more tolerant)
* [ ] system assets (always there, not part of template)
* [ ] serverless demo mode
* [ ] more helper/marker overlays (arrows, areas, )
* [ ] set default/start table other than 1 in template
* [ ] add more classic game boards: backgammon, mills, solitaire
* [ ] pre-release
  * [ ] bump dependencies
  * [ ] bugfixes + refactoring
    * [ ] fix isSolid image loading
  * [ ] review docs
  * [ ] review + run tests
  * [ ] bump version/codename & update CHANGELOG
  * [ ] update screenshots

## Backlog (unsorted)

### rather sooner

* [ ] add more integration/API tests (edge cases during CRUD)
* [ ] table passwords
* [ ] use 'v' to paste / clone
* [ ] automated deployment tests for new zip/tgz packages after build
* [ ] provide clearer feedback when uploading incompatible templates / parsing errors happen
* [ ] right-click on table (add piece, change table)
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
* [ ] don't roll dice on transparent part of dicemat
* [ ] add dice on dicemat
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
