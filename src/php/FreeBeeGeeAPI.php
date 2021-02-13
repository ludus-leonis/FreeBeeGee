<?php

/**
 * Copyright 2021 Markus Leupold-Löwenthal
 *
 * @license This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

namespace com\ludusleonis\freebeegee;

/**
 * FreeBeeGeeAPI - The tabletop backend.
 *
 * JSON/REST backend for FreeBeeGee.
 */
class FreeBeeGeeAPI
{
    private $version = '$VERSION$';
    private $api = null; // JSONRestAPI instance

    /**
     * Constructor - setup our routes.
     */
    public function __construct()
    {
        $this->api = new JSONRestAPI();

        // best ordered by calling frequency within each method to reduce string
        // matching overhead

        // --- HEAD ---

        $this->api->register('HEAD', '/games/:gid/state/?', function ($fbg, $data) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->getStateHead($data['gid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        // --- GET ---

        $this->api->register('GET', '/games/:gid/?', function ($fbg, $data) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->getGame($data['gid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        $this->api->register('GET', '/games/:gid/library/?', function ($fbg, $data) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->getLibrary($data['gid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        $this->api->register('GET', '/games/:gid/state/?', function ($fbg, $data) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->getState($data['gid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        $this->api->register('GET', '/', function ($fbg, $data) {
            $fbg->getServerInfo();
        });

        $this->api->register('GET', '/templates/?', function ($fbg, $data) {
            $fbg->getTemplates();
        });

        // --- POST ---

        $this->api->register('POST', '/games/:gid/pieces/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->createPiece($data['gid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        $this->api->register('POST', '/games/', function ($fbg, $data, $payload) {
            $fbg->createGame($payload);
        });

        // --- PUT ---

        $this->api->register('PUT', '/games/:gid/pieces/:pid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->updatePiece($data['gid'], $data['pid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        // --- PATCH ---

        $this->api->register('PATCH', '/games/:gid/pieces/:pid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->updatePiece($data['gid'], $data['pid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });

        // --- DELETE ---

        $this->api->register('DELETE', '/games/:gid/pieces/:pid/?', function ($fbg, $data) {
            if (is_dir($this->getGameFolder($data['gid']))) {
                $fbg->deletePiece($data['gid'], $data['pid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['gid']);
        });
    }

    /**
     * Run this application.
     *
     * Will route and execute a single HTTP request.
     */
    public function run(): void
    {
        $this->api->route($this);
    }

    // --- helpers -------------------------------------------------------------

    /**
     * Determine the filesystem-path where FreeBeeGee is installed in.
     *
     * This is one level up the tree from where the API script is located.
     *
     * @return string Full path to our install folder.
     */
    private function getAppFolder(): string
    {
        return $scriptDir = dirname(dirname(__FILE__)) . '/'; // app is in our parent folder
    }

    /**
     * Determine the filesystem-path where data for a particular game is stored.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     * @return type Full path to game data folder, including trailing slash.
     */
    private function getGameFolder(
        string $gameName
    ): string {
        return $this->api->getDataDir() . 'games/' . $gameName . '/';
    }

    /**
     * Obtain server config values.
     *
     * Done by loading server.json from disk.
     *
     * @return object Parsed server.json.
     */
    private function getServerConfig()
    {
        $config = json_decode(file_get_contents($this->api->getDataDir() . 'server.json'));
        $config->version = '$VERSION$';
        return $config;
    }

    /**
     * Calculate the available / open game slots on this server.
     *
     * Done by counting the sub-folders in the ../games/ folder.
     *
     * @param string $json (Optional) server.json to avoid re-reading it in some cases.
     * @return int Number of currently open slots.
     */
    private function getOpenSlots(
        $json = null
    ) {
        if ($json === null) {
            $json = $this->getServerConfig();
        }

        // count games
        $dir = $this->api->getDataDir() . 'games/';
        $count = 0;
        if (is_dir($dir)) {
            $count = sizeof(scandir($this->api->getDataDir() . 'games/')) - 2; // do not count . and ..
        }

        return $json->maxGames > $count ? $json->maxGames - $count : 0;
    }

    /**
     * Remove games that were inactive too long.
     *
     * Will determine inactivity via modified-timestamp of .flock file in game
     * folder, as every sync of an client touches this.
     *
     * @param int $maxAgeSec Maximum age of inactive game in Seconds.
     */
    private function deleteOldGames($maxAgeSec)
    {
        $dir = $this->api->getDataDir() . 'games/';
        $now = time();
        if (is_dir($dir)) {
            $games = scandir($dir);
            foreach ($games as $game) {
                if ($game[0] !== '.') {
                    $modified = filemtime($dir . $game . '/.flock');
                    if ($now - $modified > $maxAgeSec) {
                        $this->api->deleteDir($dir . $game);
                    }
                }
            }
        }
    }

    /**
     * Merge two data objects.
     *
     * The second object's properties take precedence.
     *
     * @param object $original The first/source object.
     * @param object $updates An object containing new/updated properties.
     * @return object An object with $original's properties overwritten by $updates's.
     */
    private function merge(
        object $original,
        object $updates
    ): object {
        return (object) array_merge((array) $original, (array) $updates);
    }

    /**
     * Install a game template into a game.
     *
     * Will unpack the template .zip into the game folder. Terminates execution
     * on errors.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     * @param string $template Name of the template, e.g. 'default' for default.zip
     */
    private function installTemplate(
        string $gameName,
        string $template
    ): void {
        $zipPath = $this->getAppFolder() . 'templates/' . $template . '.zip';
        $zip = new \ZipArchive($zipPath);
        $res = $zip->open($this->getAppFolder() . 'templates/' . $template . '.zip');
        if ($res === true) {
            $zip->extractTo($this->getGameFolder($gameName));
            $zip->close();
        } else {
            $this->api->sendError(500, 'can\'t setup template ' . $zipPath);
        }
    }

    /**
     * Update a game's state in the filesystem.
     *
     * Will update the state.json of a game with the new piece. By replacing the
     * corresponding JSON Array item with the new one via ID reference.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     * @param object $piece The parsed & validated piece to update.
     * @param bool $create If true, this piece must not exist.
     */
    private function updateState(
        string $gameName,
        object $piece,
        bool $create
    ) {
        $folder = $this->getGameFolder($gameName);
        $lock = $this->api->waitForWriteLock($folder . '.flock');

        $oldState = json_decode(file_get_contents($folder . 'state.json'));

        // rewrite state, starting with new item
        // only latest (first) state item per ID matters
        $now = time();
        $newState = [];
        $ids = [];
        if ($create) { // in create mode we inject the new piece
            $newState[] = $piece;
            foreach ($oldState as $stateItem) {
                if (!in_array($stateItem->id, $ids)) {
                    // for newly created items we just copy the current state of the others
                    if ($stateItem->id === $piece->id) {
                        // the ID is already in the history - abort!
                        $this->api->unlockLock($lock);
                        $this->api->sendReply(409, json_encode($piece));
                    }
                    $newState[] = $stateItem;
                    $ids[] = $stateItem->id;
                }
            }
        } else { // in update mode we lookup the piece by ID and merge the changes
            foreach ($oldState as $stateItem) {
                if (!in_array($stateItem->id, $ids)) {
                    // this is an update, and we have to patch the item if the ID matches
                    if ($stateItem->id === $piece->id) {
                        // just skip deleted piece
                        if ($piece->type === 'delete') {
                            continue;
                        }
                        $stateItem = $this->merge($stateItem, $piece);
                    }
                    $newState[] = $stateItem;
                    $ids[] = $stateItem->id;
                }
            }
            if (!in_array($piece->id, $ids) && $piece->type !== 'delete') {
                $this->api->unlockLock($lock);
                $this->api->sendError(404, 'not found: ' . $piece->id);
            }
        }
        $data = json_encode($newState);
        file_put_contents($folder . 'state.json', $data);
        file_put_contents($folder . 'state.json.digest', 'crc32:' . crc32($data));
        $this->api->unlockLock($lock);
    }

    /**
     * Convert an asset's filename into JSON metadata.
     *
     * Will parse files named group.myName.1x2x3.ff0000.jpg and split those
     * properties into JSON metadata.
     *
     * @param string $filename Filename to parse
     * @return object Asset object (for JSON conversion).
     */
    private function fileToAsset(
        $filename
    ) {
        $asset = new \stdClass();
        $asset->assets = [$filename];
        if (preg_match('/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+)\.([a-fA-F0-9]{6})\.[a-zA-Z0-9]+$/', $filename, $matches)) {
            // name, size and color
            $asset->width = (int)$matches[2];
            $asset->height = (int)$matches[3];
            $asset->bg = $matches[5];
            $asset->alias = $matches[1];
        } elseif (preg_match('/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+)\.[a-zA-Z0-9]+$/', $filename, $matches)) {
            // name and size
            $asset->width = (int)$matches[2];
            $asset->height = (int)$matches[3];
            $asset->bg = '808080';
            $asset->alias = $matches[1];
        } elseif (preg_match('/^(.*)\.[a-zA-Z0-9]+$/', $filename, $matches)) {
            // name only
            $asset->width = 1;
            $asset->height = 1;
            $asset->bg = '808080';
            $asset->alias = $matches[1];
        }
        return $asset;
    }

    // --- validators ----------------------------------------------------------

    /**
     * Parse incoming JSON for pieces.
     *
     * @param string $json JSON string from the client.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object Validated JSON, convertet to an object.
     */
    private function validatePiece(
        string $json,
        bool $checkMandatory
    ): object {
        $incoming = $this->api->assertJson($json);
        $validated = new \stdClass();

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'id':
                    break; // we accept but ignore these
                case 'type':
                    $validated->type = $this->api->assertEnum('type', $value, ['tile', 'token', 'overlay']);
                    break;
                case 'assets':
                    $validated->assets = $this->api->assertStringArray('assets', $value, '[A-Za-z0-9._-]+');
                    break;
                case 'width':
                    $validated->width = $this->api->assertInteger('width', $value, 1, 32);
                    break;
                case 'height':
                    $validated->height = $this->api->assertInteger('height', $value, 1, 32);
                    break;
                case 'x':
                    $validated->x = $this->api->assertInteger('x', $value, -100000, 100000);
                    break;
                case 'y':
                    $validated->y = $this->api->assertInteger('y', $value, -100000, 100000);
                    break;
                case 'z':
                    $validated->z = $this->api->assertInteger('z', $value, -100000, 100000);
                    break;
                case 'side':
                    $validated->side = $this->api->assertInteger('side', $value, 0, 128);
                    break;
                case 'color':
                    $validated->color = $this->api->assertInteger('color', $value, 0, 7);
                    break;
                case 'bg':
                    $validated->bg = $this->api->assertString('bg', $value, '[A-Fa-f0-9]{6}');
                    break;
                case 'r':
                    $validated->r = $this->api->assertEnum('r', $value, [0, 90, 180, 270]);
                    break;
                case 'label':
                    $validated->label = $this->api->assertString('label', $value, '^[^\n\r]{0,32}$');
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
            }
        }

        if ($checkMandatory) {
            foreach (['type', 'assets', 'width', 'height', 'x', 'y', 'z', 'side', 'color', 'bg'] as $property) {
                if (!\property_exists($validated, $property)) {
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' missing');
                }
            }
        }

        return $validated;
    }

    /**
     * Parse incoming JSON for (new) games.
     *
     * @param string $json JSON string from the client.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object Validated JSON, convertet to an object.
     */
    private function validateGame(
        string $json,
        bool $checkMandatory
    ): object {
        $incoming = $this->api->assertJson($json);
        $validated = new \stdClass();

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'id':
                case 'auth':
                    break; // we accept but ignore these
                case 'name':
                    $validated->name = $this->api->assertString('name', $value, '[A-Za-z0-9]{8,48}');
                    break;
                case 'template':
                    $validated->template = $this->api->assertString('template', $value, '[A-Za-z0-9]{1,99}');
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
            }
        }

        if ($checkMandatory) {
            foreach (['name', 'template'] as $property) {
                if (!\property_exists($validated, $property)) {
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' missing');
                }
            }
        }

        return $validated;
    }

    // --- meta / server endpoints ---------------------------------------------

    /**
     * Send server info JSON to client.
     *
     * Consists of some server.json values, as well as some calculated ones. Will
     * send JSON reply and terminate execution.
     */
    private function getServerInfo()
    {
        $server = $this->getServerConfig();

        // this is a good opportunity for housekeeping
        $this->deleteOldGames(($server->ttl ?? 48) * 3600);

        // assemble json
        $info = new \stdClass();
        $info->version = $server->version;
        $info->ttl = $server->ttl;
        $info->openSlots = $this->getOpenSlots($server);
        if ($server->passwordCreate ?? '' !== '') {
            $info->createPassword = true;
        }
        $this->api->sendReply(200, json_encode($info));
    }

    /**
     * Sent list of available templates to client.
     *
     * Done by counting the .zip files in the templates folder. Will send JSON
     * reply and terminate execution.
     */
    private function getTemplates()
    {
        $templates = [];
        foreach (glob($this->getAppFolder() . 'templates/*zip') as $filename) {
            $zip = pathinfo($filename);
            $templates[] = $zip['filename'];
        }
        $this->api->sendReply(200, json_encode($templates));
    }

    // --- game handling endpoints ---------------------------------------------

    /**
     * Setup a new game.
     *
     * If there is a free slot available, this will create a new game folder and
     * initialize it properly. Will terminate with 201 or an error.
     *
     * @param string $payload Game JSON from client.
     */
    public function createGame(
        string $payload
    ) {
        $item = $this->api->assertJson($payload);

        // check the password (if required)
        $server = $this->getServerConfig();
        if ($server->passwordCreate ?? '' !== '') {
            if (!password_verify($item->auth ?? '', $server->passwordCreate)) {
                $this->api->sendError(401, 'valid password required');
            }
        }

        // check if we have slots left
        if ($this->getOpenSlots($server) <= 0) {
            $this->api->sendError(503, 'no more game slots available');
        }

        // sanitize item by recreating it
        $validated = $this->validateGame($payload, true);

        if (!is_file($this->getAppFolder() . 'templates/' . $validated->template . '.zip')) {
            $this->api->sendError(400, 'template ' . $validated->template . ' not available');
        }

        // create a new game
        $newGame = new \stdClass();
        $newGame->id = JSONRestAPI::uuid();
        $newGame->name = $validated->name;
        $newGame->engine = $this->version;
        $newGame->tables = [new \stdClass()];

        $table = $newGame->tables[0];
        $table->name = 'Main';
        $table->background = new \stdClass();
        $table->background->color = '#423e3d';
        $table->background->scroller = '#2b2929';
        $table->background->image = 'img/desktop-wood.jpg';

        $folder = $this->getGameFolder($newGame->name);
        if (!is_dir($folder)) {
            if (!mkdir($folder, 0777, true)) {
                $this->api->sendError(500, 'can\'t write on server');
            }

            $lock = $this->api->waitForWriteLock($folder . '.flock');
            $this->installTemplate($newGame->name, $validated->template);

            // add/overrule some template.json infos into the game.json
            $table->template = json_decode(file_get_contents($folder . 'template.json'));
            $table->width = $table->template->width * $table->template->gridSize; // specific for 'grid-square'
            $table->height = $table->template->height * $table->template->gridSize; // specific for 'grid-square'

            file_put_contents($folder . 'game.json', json_encode($newGame));
            $this->api->unlockLock($lock);

            $this->api->sendReply(201, json_encode($newGame), '/api/games/' . $newGame->name);
        }
        $this->api->sendReply(409, json_encode($newGame));
    }

    /**
     * Get game metadata.
     *
     * Will return the game.json from a game's folder.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     */
    public function getGame(
        string $gameName
    ) {
        $folder = $this->getGameFolder($gameName);
        if (is_dir($folder)) {
            $this->api->sendReply(200, $this->api->fileGetContentsLocked(
                $folder . 'game.json',
                $folder . '.flock'
            ));
        }
        $this->api->sendError(404, 'not found: ' . $gameName);
    }

    /**
     * Get the head of the state of a game.
     *
     * Returns a Digest HTTP header so the client can check if it's worth to
     * download the rest.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     */
    public function getStateHead(
        string $gameName
    ) {
        $folder = $this->getGameFolder($gameName);
        if (is_dir($folder)) {
            $digest = 'crc32:0';
            if (is_file($folder . 'state.json.digest')) {
                $digest = $this->api->fileGetContentsLocked(
                    $folder . 'state.json.digest',
                    $folder . '.flock'
                );
            }
            $this->api->sendReply(200, null, null, $digest);
        }
        $this->api->sendError(404, 'not found: ' . $gameName);
    }

    /**
     * Get the state of a game.
     *
     * Returns the state.json containing all pieces on the table.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     */
    public function getState(
        string $gameName
    ) {
        $folder = $this->getGameFolder($gameName);
        if (is_dir($folder)) {
            $body = $this->api->fileGetContentsLocked(
                $folder . 'state.json',
                $folder . '.flock'
            );
            $this->api->sendReply(200, $body, null, 'crc32:' . crc32($body));
        }
        $this->api->sendError(404, 'not found: ' . $gameName);
    }

    /**
     * Add a new piece to a game.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     * @param string $json Full piece JSON from client.
     * @return type Description.
     */
    public function createPiece(
        string $gameName,
        string $json
    ) {
        $piece = $this->validatePiece($json, true);
        $piece->id = JSONRestAPI::uuid();
        $this->updateState($gameName, $piece, true);
        $this->api->sendReply(201, json_encode($piece));
    }

    /**
     * Update a piece.
     *
     * Can overwrite the whole piece or only patch a few fields.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     * @param string $pieceID ID of the piece to update.
     * @param string $json Full or parcial piece JSON from client.
     */
    public function updatePiece(
        string $gameName,
        string $pieceId,
        string $json
    ) {
        $patch = $this->validatePiece($json, false);
        $patch->id = $pieceId; // overwrite with data from URL
        $this->updateState($gameName, $patch, false);
        $this->api->sendReply(200, json_encode($patch));
    }

    /**
     * Delete a piece from a game.
     *
     * Will not remove it from the library.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     * @param string $pieceID ID of the piece to delete.
     */
    public function deletePiece(
        string $gameName,
        string $pieceId
    ) {
        // create a dummy 'delete' object to represent deletion
        $piece = new \stdClass(); // sanitize item by recreating it
        $piece->type = 'delete';
        $piece->id = $pieceId;

        $this->updateState($gameName, $piece, false);
        $this->api->sendReply(204, '');
    }

    /**
     * Get a game's library.
     *
     * This is a list of all assets available in the game.
     *
     * @param string $gameName Name of the game, e.g. 'darkEscapingQuelea'
     */
    public function getLibrary(
        string $gameName
    ) {
        $assets = [];
        foreach (['overlay', 'tile', 'token'] as $type) {
            $assets[$type] = [];
            $lastAsset = null;
            foreach (glob($this->getGameFolder($gameName) . 'assets/' . $type . '/*') as $filename) {
                $asset = $this->fileToAsset(basename($filename));
                $asset->type = $type;

                if (
                    $lastAsset === null
                    || $lastAsset->alias !== $asset->alias
                    || $lastAsset->width !== $asset->width
                    || $lastAsset->height !== $asset->height
                ) {
                    // this is a new asset. write out the old.
                    if ($lastAsset !== null) {
                        array_push($assets[$type], $lastAsset);
                    }
                    $lastAsset = $asset;
                } else {
                    // this is another side of the same asset. add it to the existing one.
                    array_push($lastAsset->assets, $asset->assets[0]);
                }
            }
            if ($lastAsset !== null) { // don't forget the last one!
                array_push($assets[$type], $lastAsset);
            }
        }

        $this->api->sendReply(200, json_encode($assets));
    }
}
