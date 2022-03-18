# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.15 - ???

* [X] add Docker build
* [ ] build: automated deployment tests for new zip/tgz packages after build
* [ ] system: table passwords
* [ ] table: dragging some pieces should not change z (e.g. dicemat)
* [ ] table: native zoom function
* [ ] system: template colors as masks (dice, areas)
* [ ] content: more classic game boards - backgammon, mills, solitaire, ...
* [ ] content: more helper/marker overlays (arrows, areas, )
* [ ] snapshot: set default/start table other than 1 in template
* [ ] library: delete assets UI
* [ ] protect pieces (no-delete, no-move)
* [ ] pieces: inline-edit notes
* [ ] pre-release
  * [ ] bump dependencies
  * [ ] bugfixes + refactoring
    * [ ] library: select-border sometimes cutoff
  * [ ] review docs
  * [ ] review + run tests
  * [ ] bump version/codename & update CHANGELOG
  * [ ] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] library: edit asset UI
* [ ] library: show/indicate backside/all sides in tile browser
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
* [ ] docs how to make table/template `.zip`s
* [ ] API: check sides correspond to asset
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] build: generate average piece color
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs

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
