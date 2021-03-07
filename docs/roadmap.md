# Roadmap

Here is a list what might happen next. However, priorities might change.

## v0.4 - Zipping Zebra

* [X] upload-zip as template during game create
  * [X] template zip checking
    * [X] meaningful user-feedback on errors
    * [X] game version checking
    * [X] included files
    * [X] size vs maxSize
    * [X] verify template.json
    * [X] verify game.json
  * [X] Add upload to create-table dialog
* [X] svg logo in docs
* [X] disable flip for 1-sided tokens
* [X] option token-number/letter badge within token
* [X] game reset / restart / re-init
* [X] FreeBeeGee icon in top-left corner
* [X] show artwork copyright somewhere
* [ ] pre-release
  * [ ] update+run unit+integration tests
  * [ ] update docs
  * [ ] update screenshots
  * [ ] update CHANGELOG

## v0.5 - Random Rabbit

* randomize side (a.k.a. dice-tokens)
* shuffle stack/square
* dicetray (separate dice window/pane)
* basic dice-assets d4, d6, d8, d10, d12, d20
* support for custom dice
* delete table
* fancier implementation for dynamic poll intervalls
  * show "you have been inactive" dialog after 10min
  * decrease poll intervall on mouse/keyboard activity
  * let others know via HEAD request
* template GDRP privacy statement

## v0.6 - Uploading Unicorn

* rename "game" to "table"
* scroll to center of setup/table when opening new tables
* upload custom images for tiles & tokens
* remove default entries from json fieles (e.g. side=0)
* hide .../data/... from URLs (via .htaccess)

## v0.7 - Mobile Monkey

* better tablet / touch support
* catch all unhandled warnings/exceptions in PHP API and return 500
* URL mapping for example.org/roomname -> example.org/#/game/roomname
* docs how to make game/template `.zip`s

## Backlog (unsorted)

### rather sooner

* overlay-grid-on-tile option
* distinct select-token look from outline
* persist scroll position between page refresh
* change table size
* option to force-install templates with invalid versions
* color.sh: detect dominant piece color instead of average color
* rightclick on desk -> add piece popup
* generate average piece color during build
* multi-select stuff
* join-passwords
* add more classic game boards: go, backgammon, mills, solitaire
* "layer not active" hint when dragging nothing
* I18N
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

### rather later

* point-somewhere feature
* detail-pane to the right for selected item
* move stuff via cursor keys
* rename game
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
* cache/resuse/symlink same assets in different game folders (via sha256?)
* common shadow layer for tile layer
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* hex mode
