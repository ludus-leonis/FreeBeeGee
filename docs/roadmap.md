# Roadmap

Here is a list what might happen next. However, priorities might change.

## v0.3 - Clicking Crab

* create screen: switch field order, submit-on-enter
* logo

## v0.4 - Zipping Zebra

* option token-number/letter badge within token
* upload-zip as template during game create
* game version checking
* game reset / restart / re-init
* fancier implementation for dynamic poll intervalls
  * show "you have been inactive" dialog after 10min
  * decrease poll intervall on mouse/keyboard activity
  * let others know via HEAD request
* generate average piece color during build
* FreeBeeGee icon in top-left corner
* show artwork copyright somewhere
* template GDRP privacy statement
* more API integration tests

## v0.5 - Uploading Unicorn

* upload custom images for tiles & tokens
* remove default entries from json fieles (e.g. side=0)
* color.sh: detect dominant piece color instead of average color
* add more classic game boards: go, backgammon, mills, solitaire
* hide .../data/... from URLs (via .htaccess)

## v0.6 - Mobile Monkey

* better tablet / touch support
* overlay-grid-on-tile option
* catch all unhandled warnings/exceptions in PHP API and return 500
* URL mapping for example.org/roomname -> example.org/#/game/roomname
* docs how to make game/template `.zip`s

## Backlog (unsorted)

### rather sooner

* multi-select stuff
* join-passwords
* randomize side (a.k.a. dice-tokens)
* shuffle stack/square
* I18N
* show backside/all sides in tile browser
* show even more infos in media browser
* full-screen key
* dedicated HP/Mana/Value field(s)
* LOS-ruler
* tbletop settings (e.g. change background, size, grid)
* snap-to-borders
* token status (blind, poison, prone, dazed, ...)
* auto-center
  * re-center button
  * origin 0/0 = middle
  * re-size desk if needed
* undo (limited)
* pinboard for handouts
* text token ("A")
* API Docs

### rather later

* point-somewhere feature
* detail-pane to the right for selected item
* move stuff via cursor keys
* rename game
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
* dicetray (separate dice window/pane)
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
