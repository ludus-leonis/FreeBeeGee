# Roadmap

Here is a list what might happen next. However, priorities can change.

## v0.7 - Uploading Unicorn

* [X] search in library
* [X] upload custom images for tiles & tokens via web UI
* [X] add nicer default tiles
* [ ] pre-release
  * [ ] bugfixing
  * [ ] review+run unit+integration tests
  * [ ] update screenshots
  * [ ] review docs
  * [ ] bump version/codename & update CHANGELOG

## v0.8 - Mobile Monkey

* [ ] better tablet / touch support
  * [ ] zooming
  * [ ] moving pieces
* [ ] table passwords
* [ ] reuse pieces' DOM elements more

## v0.10 - Content Cobra

* make zip upload more robust
  * ignore unknown files instead rejecting them
  * auto-create missing state json
  * auto-create missing license
* generic marker overlay (X, ?, ...)
* docs how to make table/template `.zip`s

## v0.10 - Clean Cat

* empty template table
* reduce impact of "back" button
* concurrent drag-n-drop - first mover wins
* bulk manipulation of assets (delete, edit)
* remove default entries from json files before save (e.g. side=0)
* add template version to asset urls
* catch all unhandled warnings/exceptions in PHP API and return 500

## Backlog (unsorted)

### rather sooner

* different edit modals per piece type (hide useless fields)
* click thru / don't drag on transparent parts of images
* protect pieces (no-delete, no-move)
* meta-piece: supply heap
* overlay-grid-on-tile option
* hide .../data/... from URLs (via .htaccess)
* change table size
* support for stacks/decks of cards
  * shuffle deck/stack
* option to force-install templates with invalid versions
* color.sh: detect dominant piece color instead of average color
* rightclick on desk -> add piece popup
* generate average piece color during build and upload
* multi-select stuff
* add more classic game boards: go, backgammon, mills, solitaire
* "layer not active" hint when dragging nothing
* I18N
* obfuscate/hash room name
* show backside/all sides in tile browser
* show even more infos in media browser
* full-screen key
* dedicated HP/Mana/Value field(s)
* LOS-ruler
* tabletop settings (e.g. change background, size, grid)
* snap-to-borders
* token status (blind, poison, prone, dazed, ...)
* auto-center
  * re-center button
  * origin 0/0 = middle
  * re-size desk if needed
* undo (limited)
* pinboard for handouts
* full set of mm1/bestiary1 monsters in RPG template
* tour / first-time-tutorial
* API Docs
* randomize button on dicemat
* cycle border colors

### rather later

* compile js for older browsers (<globalThis)
* in-game clock
* game rules / metainfos (pdf) links in help
* send to previous position for pieces
* point-somewhere feature
* detail-pane to the right for selected item
* move stuff via cursor keys
* in-game clock
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
