# FreeBeeGee CHANGELOG

Download current and old versions from [https://github.com/ludus-leonis/FreeBeeGee/releases](https://github.com/ludus-leonis/FreeBeeGee/releases).

## v0.8.0 - Resizing Rhinoceros

### Noteable changes

* added table resize feature
* added table content alignment feature
* improved snapshot upload: ignore extra files in ZIP instead of rejecting them
* added more room types and assets to RPG template

### Other changes

* added default back side for all 1-sided pieces
* fixed popup menu sometimes cut-off
* fixed rotated pieces placement next to table border
* fixed uploaded token border color bug
* docs/requirements update

## v0.7.0 - Uploading Unicorn

### Noteable changes

* added image upload tab in library modal
* added search/filter to library
* added new dungeon tiles by 2minutetabletop.com to RPG template
* added 200+ monster token by game-icons.net to RPG template
* added Go boards by github.com/svenja to Classic template

### Other changes

* added random movement to single die rolls
* added piece size indicator backgrounds in library modal
* improved sticky note text sizes
* improved cyan dice
* improved piece shadows
* improved navigating create-screen via keyboard
* fixed invalid new-piece placement outside table bounds
* fixed missing colors when cycling borders
* fixed token-border bug
* added draft of snapshot docs
* updated docs & screenshots
* updated unit tests

## v0.6.1

* fixed missing animation for moving pieces
* added IfModule for PHP-instructions in .htaccess'

## v0.6 - Sticky Starling

### Notable changes

* added sticky notes (hotkey: n)
* added FATE dice to RPG template
* added multiselect in library modal (add multiple pieces)
* added customizable snap positions (& RPG template snaps to half-grid now)
* added auto-scroll-to-action after joining/reloading a table
* added border-color hotkey "o"
* added delete-table button to settings
* added support for discard piles (shuffle tile stacks)
* added GDRP template
* changed table URLs from anchors to folders (example.org/#/fancyPony -> example.org/fancyPony)

### Other changes

* changed wording game->table
* added tabs to settings dialog
* improved polling logic & interval
* improved mouse cursor in modals
* improved piece select indicator
* disabled random UQ rotation for big tiles (8+)
* changed library hotkey to l
* added loading indicator to create game
* added support for partially transparent tiles (PNG alpha)
* fixed drag-n-drop z position
* changed state json for more optional fields
* changed state json x/y coordinates to px
* refactored state / slot handling, added multiple states to templates
* fixed integration tests
* fixed same z-index when multiple pieces are added
* fixed dicemat bug
* reduced border radius for pieces
* fixed popup hidden behind tiles in low quality mode
* fixed no-badge for tokens
* moved some filters to ultra quality
* fixed reset/clean table bug in Firefox

## v0.5 - Random Rabbit

### Notable changes

* added support for rolling dice on your table
* added d4, d6, d8, d10, d12 and d20 in 4 colors
* improved general rendering speed
* added render-quality slider to settings dialog

### Other changes

* added randomize icon/popup menu
* tweaked preview-size of pieces in library dialog
* fixed z position for cloned pieces
* improved piece shadows
* fixed upload limits and upload problem verbosity
* updated unit tests
* updated help dialog

## v0.4.2

* fixed create-table error due case-sensitive http headers for POST requests

## v0.4.1

* fixed piece-delete bug

## v0.4.0 - Zipping Zebra

* added more unit/integration tests
* added reset-table feature
* added clear-table feature
* added snapshot uploads
* disabled flip menu for single-sided pieces
* added template credits / license information to about modal
* replaced png assets with svgs in default templates
* improved handling of missing assets
* added settings dialog
* added token numbers (letters)
* added logo icon to readme
* fixed logo font

## v0.3.0 - Clicking Crab

* added logo
* improved create game dialog UX
* added more integration tests
* added INSTALL.md to release archives
* added svg favicon
* added timestamp to snapshot zips, removed unnecessary files from snapshot
* refactored asset handling in JSON files
* added technical FAQ
* added game snapshot downloads
* added right-click context menu for pieces
* added scroll-on-grab for middle mouse button
* moved hardcoded values from client into API/templates
* added generic A-Z and 0-9 tokens, added gulp-image to minimize images
* improved game-does-not-exist error handling
* fixed dragndrop-hang issue
* improved label readability
* fixed maximum tile size in editor, added F2 editor hotkey
* updated dependencies

## v0.2.0 - Public Parrot

* first public release

## v0.1.0 - Internal Ibis

* internal test release
