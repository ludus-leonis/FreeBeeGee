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
    private $engine = '$ENGINE$';
    private $api = null; // JSONRestAPI instance
    private $minTableGridSize = 16;
    private $maxTableGridSize = 256;
    private $maxAssetSize = 1024 * 1024;
    private $layers = ['overlay', 'tile', 'token', 'other', 'note'];

    /**
     * Constructor - setup our routes.
     */
    public function __construct()
    {
        $this->api = new JSONRestAPI();

        // best ordered by calling frequency within each method to reduce string
        // matching overhead

        // --- GET ---

        $this->api->register('GET', '/tables/:tid/digest/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->getTableDigest($data['tid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('GET', '/tables/:tid/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->getTable($data['tid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('GET', '/tables/:tid/states/:sid/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->getState($data['tid'], $data['sid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('GET', '/', function ($fbg, $data) {
            $fbg->getServerInfo();
        });

        $this->api->register('GET', '/templates/?', function ($fbg, $data) {
            $fbg->getTemplates();
        });

        $this->api->register('GET', '/tables/:tid/snapshot/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->getSnapshot($data['tid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('GET', '/tables/:tid/states/:sid/pieces/:pid/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->getPiece($data['tid'], $data['sid'], $data['pid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        // --- POST ---

        $this->api->register('POST', '/tables/:tid/states/:sid/pieces/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->createPiece($data['tid'], $data['sid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('POST', '/tables/:tid/assets/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->createAssetLocked($data['tid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('POST', '/tables/', function ($fbg, $data, $payload) {
            $formData = $this->api->multipartToJson();
            if ($formData) { // client sent us multipart
                $fbg->createTableLocked($formData);
            } else { // client sent us regular json
                $fbg->createTableLocked($payload);
            }
        });

        // --- PUT ---

        $this->api->register('PUT', '/tables/:tid/states/:sid/pieces/:pid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->updatePiece($data['tid'], $data['sid'], $data['pid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('PUT', '/tables/:tid/states/:sid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->putStateLocked($data['tid'], $data['sid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        // --- PATCH ---

        $this->api->register('PATCH', '/tables/:tid/states/:sid/pieces/:pid/?', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->updatePiece($data['tid'], $data['sid'], $data['pid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('PATCH', '/tables/:tid/states/:sid/pieces/', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->updatePieces($data['tid'], $data['sid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('PATCH', '/tables/:tid/template/', function ($fbg, $data, $payload) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->updateTableTemplateLocked($data['tid'], $payload);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        // --- DELETE ---

        $this->api->register('DELETE', '/tables/:tid/states/:sid/pieces/:pid/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->deletePiece($data['tid'], $data['sid'], $data['pid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        $this->api->register('DELETE', '/tables/:tid/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->deleteTable($data['tid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
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
     * Determine the filesystem-path where data for a particular table is stored.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @return type Full path to table data folder, including trailing slash.
     */
    private function getTableFolder(
        string $tableName
    ): string {
        return $this->api->getDataDir() . 'tables/' . $tableName . '/';
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
        $config->engine = '$ENGINE$';
        $config->maxAssetSize = $this->maxAssetSize;
        return $config;
    }

    /**
     * Calculate the available / free tables on this server.
     *
     * Done by counting the sub-folders in the ../tables/ folder.
     *
     * @param string $json (Optional) server.json to avoid re-reading it in some cases.
     * @return int Number of currently free tables.
     */
    private function getFreeTables(
        $json = null
    ) {
        if ($json === null) {
            $json = $this->getServerConfig();
        }

        // count tables
        $dir = $this->api->getDataDir() . 'tables/';
        $count = 0;
        if (is_dir($dir)) {
            $count = sizeof(scandir($this->api->getDataDir() . 'tables/')) - 2; // do not count . and ..
        }

        return $json->maxTables > $count ? $json->maxTables - $count : 0;
    }

    /**
     * Remove tables that were inactive too long.
     *
     * Will determine inactivity via modified-timestamp of .flock file in table
     * folder, as every sync of an client touches this.
     *
     * @param int $maxAgeSec Maximum age of inactive table in Seconds.
     */
    private function deleteOldTables($maxAgeSec)
    {
        $dir = $this->api->getDataDir() . 'tables/';
        $now = time();
        if (is_dir($dir)) {
            $tables = scandir($dir);
            foreach ($tables as $table) {
                if ($table[0] !== '.') {
                    $modified = filemtime($dir . $table . '/.flock');
                    if ($now - $modified > $maxAgeSec) {
                        $this->api->deleteDir($dir . $table);
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
     * Validate a template / snapshot.
     *
     * Does a few sanity checks to see if everything is there we need. Will
     * termiante execution and send a 400 in case of invalid zips.
     *
     * @param string $zipPath Full path to the zip to check.
     * @param array Array of strings / paths of all valid zip entries to extract.
     */
    private function validateSnapshot(
        string $zipPath
    ): array {
        $issues = [];
        $valid = [];
        $sizeLeft = $this->getServerConfig()->maxTableSizeMB  * 1024 * 1024;

        // basic sanity tests
        if (filesize($zipPath) > $sizeLeft) {
            // if the zip itself is too large, then it's content is probably too
            $this->api->sendError(400, 'zip too large', 'SIZE_EXCEEDED', $issues);
        }

        // iterate over zip entries
        $zip = new \ZipArchive();
        if (!$zip->open($zipPath)) {
            $this->api->sendError(400, 'can\'t open zip', 'ZIP_INVALID', $issues);
        }
        for ($i = 0; $i < $zip->numFiles; $i++) {
            // note: the checks below will just 'continue' for invalid/ignored items
            $entry = $zip->statIndex($i);

            switch ($entry['name']) { // filename checks
                case 'LICENSE.md':
                    break; // known, unchecked file
                case 'template.json':
                    $this->validateTemplateJson(file_get_contents('zip://' . $zipPath . '#template.json'));
                    break;
                case 'states/0.json':
                case 'states/1.json':
                case 'states/2.json':
                case 'states/3.json':
                case 'states/4.json':
                case 'states/5.json':
                case 'states/6.json':
                case 'states/7.json':
                case 'states/8.json':
                case 'states/9.json':
                    $this->validateStateJson('', file_get_contents('zip://' . $zipPath . '#' . $entry['name']));
                    break;
                default: // scan for asset filenames
                    if (
                        !preg_match(
                            '/^assets\/(overlay|tile|token|other)\/[a-zA-Z0-9_.-]*.(svg|png|jpg)$/',
                            $entry['name']
                        )
                    ) {
                        continue 2; // for
                    }
            }

            if ($entry['size'] > $this->maxAssetSize) { // filesize checks
                continue; // for
            }
            $sizeLeft -= $entry['size'];
            if ($sizeLeft < 0) {
                $this->api->sendError(400, 'zip content too large', 'SIZE_EXCEEDED', $issues);
            }

            // if we got here, no check failed, so the entry is ok!
            $valid[] = $entry['name'];
        }

        return $valid;
    }

    /**
     * Validate a template.json.
     *
     * Will termiante execution and send a 400 in case of invalid JSON.
     *
     * @param string $json JSON string.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @param Object The parsed template object.
     */
    private function validateTemplateJson(
        string $json,
        bool $checkMandatory = true
    ): object {
        $msg = 'validating template.json failed';
        $template = json_decode($json);

        // check the basics and abort on error
        if ($template === null) {
            $this->api->sendError(400, $json . ' - syntax error', 'TEMPLATE_JSON_INVALID');
        }

        if ($checkMandatory) {
            if (!property_exists($template, 'engine') || !$this->api->semverSatisfies($this->engine, $template->engine)) {
                $this->api->sendError(400, 'template.json: game engine mismatch', 'TEMPLATE_JSON_INVALID_ENGINE', [
                    $template->engine, $this->engine
                ]);
            }
            $this->api->assertHasProperties(
                'template.json',
                $template,
                ['type', 'gridSize', 'snapSize', 'version', 'engine', 'gridWidth', 'gridHeight', 'colors']
            );
        }

        // check for more stuff
        foreach ($template as $property => $value) {
            switch ($property) {
                case 'engine':
                    break; // was checked above
                case 'type':
                    $this->api->assertString('type', $value, 'grid-square');
                    break;
                case 'snapSize':
                    $this->api->assertInteger('snapSize', $value, 1, 64);
                    break;
                case 'version':
                    $this->api->assertSemver('version', $value);
                    break;
                case 'gridSize':
                    $this->api->assertInteger('gridSize', $value, 64, 64);
                    break;
                case 'gridWidth':
                    $this->api->assertInteger('gridWidth', $value, $this->minTableGridSize, $this->maxTableGridSize);
                    break;
                case 'gridHeight':
                    $this->api->assertInteger('gridHeight', $value, $this->minTableGridSize, $this->maxTableGridSize);
                    break;
                case 'colors':
                    $this->api->assertObjectArray('colors', $value, 1);
                    break;
                default:
                    $this->api->sendError(400, 'invalid template.json: ' . $property . ' unkown');
            }
        }

        return $template;
    }

    /**
     * Validate a state.json.
     *
     * Will termiante execution and send a 400 in case of invalid JSON.
     *
     * @param string $sid State ID for error messages.
     * @param string $json JSON string.
     */
    private function validateStateJson(
        string $sid,
        string $json
    ) {
        $msg = 'validating state ' . $sid . '.json failed';
        $state = json_decode($json);
        $validated = [];

        // check the basics and abort on error
        if ($state === null) {
            $this->api->sendError(400, $msg . ' - syntax error', 'STATE_JSON_INVALID');
        }

        // check for more stuff
        $this->api->assertObjectArray($sid . '.json', $state, 0);
        foreach ($state as $piece) {
            $validated[] = $this->validatePiece($piece, true);
        }

        return $validated;
    }

    /**
     * Install a template/snapshot into a table.
     *
     * Will unpack the template .zip into the table folder. Terminates execution
     * on errors. Expects the caller to handle FS locking.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $zipPath Path to snapshot/template zip to install.
     * @param array $validEntries Array of path names (strings) to extract from zip.
     */
    private function installSnapshot(
        string $tableName,
        string $zipPath,
        array $validEntries
    ) {
        $folder = $this->getTableFolder($tableName);

        // create mandatory folder structure
        if (
            !mkdir($folder . 'states', 0777, true)
            || !mkdir($folder . 'assets/other', 0777, true)
            || !mkdir($folder . 'assets/overlay', 0777, true)
            || !mkdir($folder . 'assets/tile', 0777, true)
            || !mkdir($folder . 'assets/token', 0777, true)
        ) {
            $this->api->sendError(500, 'can\'t write on server');
        }

        // unzip all validated files
        $zip = new \ZipArchive();
        if ($zip->open($zipPath) === true) {
            $zip->extractTo($folder, $validEntries);
            $zip->close();
        } else {
            $this->api->sendError(500, 'can\'t setup template ' . $zipPath);
        }

        // recreate potential nonexisting files as fallback
        if (!is_file($folder . 'template.json')) {
            file_put_contents($folder . 'template.json', json_encode($this->getTemplateDefault()));
        }
        if (!is_file($folder . 'states/1.json')) {
            file_put_contents($folder . 'states/1.json', '[]');
        }
        if (!is_file($folder . 'states/0.json')) { // recreate from 1.json, ignore digest
            file_put_contents($folder . 'states/0.json', file_get_contents($folder . 'states/1.json'));
        }
        if (!is_file($folder . 'LICENSE.md')) {
            file_put_contents($folder . 'LICENSE.md', 'This snapshot does not provide license information.');
        }
    }

    /**
     * Assemble a default template file.
     *
     * @return object Template PHP object.
     */
    private function getTemplateDefault(): object
    {
        return (object) [
            'type' => 'grid-square',
            'version' => $this->version,
            'engine' => '^' . $this->engine,
            'gridSize' => 64,
            'gridWidth' => 48,
            'gridHeight' => 32,
            'snapSize' => 32,
            'colors' => [
                (object) [ 'name ' => 'black', 'value' => '#0d0d0d' ],
                (object) [ 'name ' => 'white', 'value' => '#ffffff' ],
            ]
        ];
    }

    /**
     * Update a table's state in the filesystem.
     *
     * Will update the state.json of a table with the new piece. By replacing the
     * corresponding JSON Array item with the new one via ID reference.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $sid State id / number, e.g. 2.
     * @param object $piece The parsed & validated piece to update.
     * @param bool $create If true, this piece must not exist.
     * @return object The updated piece.
     */
    private function updatePieceStateLocked(
        string $tableName,
        string $sid,
        object $piece,
        bool $create
    ): object {
        $folder = $this->getTableFolder($tableName);
        $lock = $this->api->waitForWriteLock($folder . '.flock');

        $oldState = [];
        if (is_file($folder . 'states/' . $sid . '.json')) {
            $oldState = json_decode(file_get_contents($folder . 'states/' . $sid . '.json'));
        }
        $result = $piece;

        // rewrite state, starting with new item
        // only latest (first) state item per ID matters
        $now = time();
        $newState = [];
        $ids = [];
        if ($create) { // in create mode we inject the new piece
            $newState[] = $this->removeDefaultsFromPiece($piece);
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
                        if (property_exists($piece, 'layer') && $piece->layer === 'delete') {
                            continue;
                        }
                        $stateItem = $this->removeDefaultsFromPiece($this->merge($stateItem, $piece));
                        $result = $stateItem;
                    }
                    $newState[] = $stateItem;
                    $ids[] = $stateItem->id;
                }
            }
            if (!in_array($piece->id, $ids) && (!property_exists($piece, 'layer') || $piece->layer !== 'delete')) {
                $this->api->unlockLock($lock);
                $this->api->sendError(404, 'not found: ' . $piece->id);
            }
        }
        $this->writeAsJsonAndDigest($folder, 'states/' . $sid . '.json', $newState);
        $this->api->unlockLock($lock);

        return $result;
    }

    /**
     * Convert an asset's filename into JSON metadata.
     *
     * Will parse files named .myName.1x2x3.ff0000.jpg and split those
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
        if (
            // group.name.1x2x3.808080.png
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6}|transparent|border)\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            $asset->w = (int)$matches[2];
            $asset->h = (int)$matches[3];
            $asset->side = $matches[4];
            switch ($matches[5]) {
                case 'transparent':
                case 'border':
                    $asset->color = $matches[5];
                    break;
                default:
                    $asset->color = '#' . $matches[5];
            }
            $asset->alias = $matches[1];
        } elseif (
            // group.name.1x2x3.png
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            $asset->w = (int)$matches[2];
            $asset->h = (int)$matches[3];
            $asset->side = $matches[4];
            $asset->color = '#808080';
            $asset->alias = $matches[1];
        } elseif (
            // group.name.png
            preg_match('/^(.*)\.[a-zA-Z0-9]+$/', $filename, $matches)
        ) {
            $asset->w = 1;
            $asset->h = 1;
            $asset->side = 1;
            $asset->color = '#808080';
            $asset->alias = $matches[1];
        }
        return $asset;
    }

    /**
     * Regenerate a library JSON.
     *
     * Done by iterating over all files in the assets folder.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @return array The generated library JSON data object.
     */
    private function generateLibraryJson(
        string $tableName
    ): array {
        // generate json data
        $tableFolder = $this->getTableFolder($tableName);
        $assets = [];
        foreach ($this->layers as $type) {
            $assets[$type] = [];
            $lastAsset = null;
            foreach (glob($tableFolder . 'assets/' . $type . '/' . '*') as $filename) {
                $asset = $this->fileToAsset(basename($filename));
                $asset->type = $type;

                // this ID only has to be unique within the table, but should be reproducable
                // therefore we use a fast hash and even only use parts of it
                $idBase = $type . '/' . $asset->alias . '.' . $asset->w . 'x' . $asset->h . 'x' . $asset->side;
                $asset->id = substr(hash('md5', $idBase), -16);

                if (
                    $lastAsset === null
                    || $lastAsset->alias !== $asset->alias
                    || $lastAsset->w !== $asset->w
                    || $lastAsset->h !== $asset->h
                ) {
                    // this is a new asset. write out the old.
                    if ($lastAsset !== null) {
                        if (count($lastAsset->assets) === 1) { // add backside to 1-sided asset
                            $lastAsset->assets[] = '##BACK##';
                        }
                        array_push($assets[$type], $lastAsset);
                    }
                    if (preg_match('/^X+$/', $asset->side)) { // this is a back side
                        $asset->back = $asset->assets[0];
                        $asset->assets = [];
                    } elseif ((int)$asset->side === 0) { // this is a background layer
                        $asset->base = $asset->assets[0];
                        $asset->assets = [];
                    }
                    unset($asset->side); // we don't keep the side in the json data
                    $lastAsset = $asset;
                } else {
                    // this is another side of the same asset. add it to the existing one.
                    array_push($lastAsset->assets, $asset->assets[0]);
                }
            }
            if ($lastAsset !== null) { // don't forget the last one!
                if (count($lastAsset->assets) === 1) { // add backside to 1-sided asset
                    $lastAsset->assets[] = '##BACK##';
                }
                array_push($assets[$type], $lastAsset);
            }
        }

        return $assets;
    }

    /**
     * Write a data object as JSON to a file and generate a digest.
     *
     * Digest will be put into digest.json. Does not do locking.
     *
     * @param string $folder Root folder for file operations, ending in '/'.
     * @param string $filename Relative path within root folder.
     * @param object $object PHP object to write.
     */
    private function writeAsJsonAndDigest(
        $folder,
        $filename,
        $object
    ) {
        // handle data
        $data = json_encode($object);
        file_put_contents($folder . $filename, $data);

        // handle hash
        $digests = json_decode(file_get_contents($folder . 'digest.json'));
        $digests->$filename = 'crc32:' . crc32($data);
        file_put_contents($folder . 'digest.json', json_encode($digests));
    }

    // --- validators ----------------------------------------------------------

    /**
     * Parse incoming JSON for pieces.
     *
     * @param string $json JSON string from the client.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object Validated JSON, converted to an object.
     */
    private function validatePieceJson(
        string $json,
        bool $checkMandatory
    ): object {
        $piece = $this->api->assertJson($json);
        return $this->validatePiece($piece, $checkMandatory);
    }

    /**
     * Remove properties that are at their default values from a piece.
     *
     * Saves some space in the JSON later on.
     *
     * @param object $piece Full piece.
     * @return object New, reduced object.
     */
    private function removeDefaultsFromPiece(
        object $piece
    ): object {
        if (property_exists($piece, 'w') && $piece->w === 1) {
            unset($piece->w);
        }
        if (property_exists($piece, 'h') && $piece->h === 1) {
            unset($piece->h);
        }
        if (property_exists($piece, 'r') && $piece->r === 0) {
            unset($piece->r);
        }
        if (property_exists($piece, 'side') && $piece->side === 0) {
            unset($piece->side);
        }
        if (property_exists($piece, 'n') && $piece->n === 0) {
            unset($piece->n);
        }
        if (property_exists($piece, 'border') && $piece->border === 0) {
            unset($piece->border);
        }
        if (property_exists($piece, 'label') && $piece->label === '') {
            unset($piece->label);
        }
        return $piece;
    }

    /**
     * Sanity check for pieces.
     *
     * @param object $piece Full or partial piece.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object New, validated object.
     */
    private function validatePiece(
        object $piece,
        bool $checkMandatory
    ): object {
        $validated = new \stdClass();
        foreach ($piece as $property => $value) {
            switch ($property) {
                case 'id':
                    $validated->id = $this->api->assertString('id', $value, '^[0-9a-f]{16}$');
                    break;
                case 'layer':
                    $validated->layer = $this->api->assertEnum('layer', $value, $this->layers);
                    break;
                case 'asset':
                    $validated->asset = $this->api->assertString('asset', $value, '[a-z0-9]+');
                    break;
                case 'w':
                    $validated->w = $this->api->assertInteger('w', $value, 1, 32);
                    break;
                case 'h':
                    $validated->h = $this->api->assertInteger('h', $value, 1, 32);
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
                case 'border':
                    $validated->border = $val = $this->api->assertInteger('border', $value, 0, 15);
                    break;
                case 'n':
                    $validated->n = $this->api->assertInteger('n', $value, 0, 15);
                    break;
                case 'r':
                    $validated->r = $this->api->assertEnum('r', $value, [0, 90, 180, 270]);
                    break;
                case 'label':
                    $validated->label = trim($this->api->assertString('label', $value, '^[^\n\r]{0,32}$'));
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
            }
        }

        if ($checkMandatory) {
            switch ($validated->layer) {
                case 'note':
                    $mandatory = ['layer', 'x', 'y', 'z'];
                    break;
                default:
                    $mandatory = ['layer', 'asset', 'x', 'y', 'z'];
            }
            $this->api->assertHasProperties('piece', $validated, $mandatory);
        }

        return $validated;
    }

    /**
     * Parse incoming JSON for (new) tables.
     *
     * @param string $json JSON string from the client.
     * @param boolean $checkMandatory If true, this function will also ensure all
     *                mandatory fields are present.
     * @return object Validated JSON, convertet to an object.
     */
    private function validateTable(
        string $json,
        bool $checkMandatory
    ): object {
        $incoming = $this->api->assertJson($json);
        $validated = new \stdClass();

        if ($checkMandatory) {
            $this->api->assertHasProperties('table', $incoming, ['name']);
        }

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'id':
                case 'auth':
                    break; // we accept but ignore these
                case '_files':
                    $validated->_files = $value;
                    break;
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

        return $validated;
    }

    /**
     * Parse incoming JSON for (new) assets.
     *
     * @param string $json JSON string from the client.
     * @return object Validated JSON, convertet to an object.
     */
    private function validateAsset(
        string $json
    ): object {
        $incoming = $this->api->assertJson($json);
        $validated = new \stdClass();

        if ($checkMandatory) {
            $this->api->assertHasProperties('asset', $incoming, ['name', 'format', 'type', 'w', 'h', 'base64', 'color']);
        }

        foreach ($incoming as $property => $value) {
            switch ($property) {
                case 'name':
                    $validated->name = $this->api->assertString('name', $value, '[A-Za-z0-9-]{1,64}(.[A-Za-z0-9-]{1,64})?');
                    break;
                case 'format':
                    $validated->format = $this->api->assertEnum('format', $value, ['jpg', 'png']);
                    break;
                case 'layer':
                    $validated->layer = $this->api->assertEnum('layer', $value, $this->layers);
                    break;
                case 'w':
                    $validated->w = $this->api->assertInteger('w', $value, 1, 32);
                    break;
                case 'h':
                    $validated->h = $this->api->assertInteger('h', $value, 1, 32);
                    break;
                case 'base64':
                    $validated->base64 = $this->api->assertBase64('base64', $value);
                    break;
                case 'color':
                    $validated->color = $this->api->assertString('color', $value, '#[a-fA-F0-9]{6}|transparent|border');
                    break;
                default:
                    $this->api->sendError(400, 'invalid JSON: ' . $property . ' unkown');
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
        $this->deleteOldTables(($server->ttl ?? 48) * 3600);

        // assemble json
        $info = new \stdClass();
        $info->version = $server->version;
        $info->engine = $server->engine;
        $info->ttl = $server->ttl;
        $info->snapshotUploads = $server->snapshotUploads;
        $info->freeTables = $this->getFreeTables($server);
        $info->root = $this->api->getAPIPath();

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
        foreach (glob($this->api->getDataDir() . 'templates/*zip') as $filename) {
            $zip = pathinfo($filename);
            $templates[] = $zip['filename'];
        }
        $this->api->sendReply(200, json_encode($templates));
    }

    // --- table handling endpoints ---------------------------------------------

    /**
     * Setup a new table.
     *
     * If there is a free table available, this will create a new table folder and
     * initialize it properly. Will terminate with 201 or an error.
     *
     * @param string $payload Table JSON from client.
     */
    public function createTableLocked(
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

        // check if we have free tables left
        if ($this->getFreeTables($server) <= 0) {
            $this->api->sendError(503, 'no free tables available');
        }

        // sanitize item by recreating it
        $validated = $this->validateTable($payload, true);

        // we need either a template name or an uploaded snapshot
        if (
            property_exists($validated, 'template') && property_exists($validated, '_files')
            || (!property_exists($validated, 'template') && !property_exists($validated, '_files'))
        ) {
            $this->api->sendError(400, 'you need to either specify a template or upload a snapshot');
        }

        // check if upload (if any) was ok
        if (property_exists($validated, '_files')) {
            if (!$server->snapshotUploads) {
                $this->api->sendError(400, 'snapshot upload is not enabled on this server');
            }
            if ($_FILES[$validated->_files[0]]['error'] > 0) {
                $this->api->sendError(400, 'PHP upload failed', JSONRestAPI::UPLOAD_ERR[
                    $_FILES[$validated->_files[0]]['error']
                ]);
            }
            $zipPath = $_FILES[$validated->_files[0]]['tmp_name'] ?? 'invalid';
        } else {
            $zipPath = $this->api->getDataDir() . 'templates/' . $validated->template . '.zip';
        }

        // doublecheck template / snapshot
        if (!is_file($zipPath)) {
            $this->api->sendError(400, 'template not available');
        }
        $validEntries = $this->validateSnapshot($zipPath);

        // create a new table
        $newTable = new \stdClass();
        $newTable->id = $this->generateId();
        $newTable->name = $validated->name;
        $newTable->engine = $this->engine;
        $newTable->background = new \stdClass();
        $newTable->background->color = '#423e3d';
        $newTable->background->scroller = '#2b2929';
        $newTable->background->image = 'img/desktop-wood.jpg';

        $folder = $this->getTableFolder($newTable->name);
        if (!is_dir($folder)) {
            if (!mkdir($folder, 0777, true)) { // create table folder
                $this->api->sendError(500, 'can\'t write on server');
            }

            $lock = $this->api->waitForWriteLock($folder . '.flock');
            $this->installSnapshot($newTable->name, $zipPath, $validEntries);
            $newTable->library = $this->generateLibraryJson($newTable->name);

            // keep original state for table resets, if game does not have a 0-state
            if (!is_file($folder . 'states/0.json')) {
                $state = file_get_contents($folder . 'states/1.json');
                file_put_contents($folder . 'states/0.json', $state);
            }

            $this->regenerateDigests($folder);

            // add/overrule some template.json infos into the table.json
            $newTable->template = json_decode(file_get_contents($folder . 'template.json'));
            if (is_file($folder . 'LICENSE.md')) {
                $newTable->credits = file_get_contents($folder . 'LICENSE.md');
            } else {
                $newTable->credits = 'Your template does not provide license information.';
            }

            // specific for 'grid-square'
            $newTable->width = $newTable->template->gridWidth * $newTable->template->gridSize;
            $newTable->height = $newTable->template->gridHeight * $newTable->template->gridSize;

            $this->writeAsJsonAndDigest($folder, 'table.json', $newTable);
            $this->api->unlockLock($lock);

            $this->api->sendReply(201, json_encode($newTable), '/api/tables/' . $newTable->name);
        }
        $this->api->sendReply(409, json_encode($newTable));
    }

    /**
     * Populate digest.json with up-to-date crc32 hashes.
     *
     * @param string $folder Table folder to work in.
     */
    public function regenerateDigests(
        string $folder
    ) {
        $digests = new \stdClass();
        foreach (
            [
                'states/template.json',
                'states/table.json',
            ] as $filename
        ) {
            if (is_file($folder . $filename)) {
                $state = file_get_contents($folder . $filename);
            } else {
                $state = '{}';
            }
            $digests->$filename = 'crc32:' . crc32($state);
        }
        foreach (
            [
                'states/0.json',
                'states/1.json',
                'states/2.json',
                'states/3.json',
                'states/4.json',
                'states/5.json',
                'states/6.json',
                'states/7.json',
                'states/8.json',
                'states/9.json',
            ] as $filename
        ) {
            if (is_file($folder . $filename)) {
                $state = file_get_contents($folder . $filename);
            } else {
                $state = '[]';
            }
            $digests->$filename = 'crc32:' . crc32($state);
        }
        file_put_contents($folder . 'digest.json', json_encode($digests));
    }

    /**
     * Change table template values.
     *
     * Will terminate with 201 or an error.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $payload Parcial template JSON from client.
     */
    public function updateTableTemplateLocked(
        string $tableName,
        string $payload
    ) {
        $template = $this->validateTemplateJson($payload, false);

        $folder = $this->getTableFolder($tableName);
        $lock = $this->api->waitForWriteLock($folder . '.flock');

        // update template.json
        $templateFS = json_decode(file_get_contents($folder . 'template.json'));
        if (\property_exists($template, 'gridWidth')) {
            $templateFS->gridWidth = $template->gridWidth;
        }
        if (\property_exists($template, 'gridHeight')) {
            $templateFS->gridHeight = $template->gridHeight;
        }
        $this->writeAsJsonAndDigest($folder, 'template.json', $templateFS);

        // update table.json
        $tableFS = json_decode(file_get_contents($folder . 'table.json'));
        $tableFS->template = $templateFS;
        $tableFS->width = $templateFS->gridWidth * $templateFS->gridSize;
        $tableFS->height = $templateFS->gridHeight * $templateFS->gridSize;
        $this->writeAsJsonAndDigest($folder, 'table.json', $tableFS);

        $this->api->unlockLock($lock);
        $this->api->sendReply(201, json_encode($templateFS));
    }

    /**
     * Get table metadata.
     *
     * Will return the table.json from a table's folder.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     */
    public function getTable(
        string $tableName
    ) {
        $folder = $this->getTableFolder($tableName);
        if (is_dir($folder)) {
            $body = $this->api->fileGetContentsLocked(
                $folder . 'table.json',
                $folder . '.flock'
            );
            $this->api->sendReply(200, $body, null, 'crc32:' . crc32($body));
        }
        $this->api->sendError(404, 'not found: ' . $tableName);
    }

    /**
     * Get table digest / changelog.
     *
     * Will return the digest.json from a table's folder.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     */
    public function getTableDigest(
        string $tableName
    ) {
        $folder = $this->getTableFolder($tableName);
        if (is_dir($folder)) {
            $this->api->sendReply(200, $this->api->fileGetContentsLocked(
                $folder . 'digest.json',
                $folder . '.flock'
            ));
        }
        $this->api->sendError(404, 'not found: ' . $tableName);
    }

    /**
     * Delete a whole table.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     */
    public function deleteTable(
        string $tableName
    ) {
        $this->api->deleteDir($this->getTableFolder($tableName));

        $this->api->sendReply(204, '');
    }

    /**
     * Validate a state ID.
     *
     * Will stop execution with a 400 error if the value is not an int 0-9.
     *
     * @param mixed $value Hopefully a state ID, e.g. 2.
     */
    public function assertStateNo(
        $value
    ) {
        $value = intval($value);
        if ($value < 0 || $value > 9) {
            $this->api->sendError(400, 'invalid state: ' . $value);
        }
    }

    /**
     * Get the state of a table.
     *
     * Returns the state.json containing all pieces on the table.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param int $sid State id / number, e.g. 2.
     */
    public function getState(
        string $tableName,
        string $sid
    ) {
        $this->assertStateNo($sid);
        $folder = $this->getTableFolder($tableName);
        if (is_dir($folder)) {
            $body = '[]';
            if (is_file($folder . 'states/' . $sid . '.json')) {
                $body = $this->api->fileGetContentsLocked(
                    $folder . 'states/' . $sid . '.json',
                    $folder . '.flock'
                );
            }
            $this->api->sendReply(200, $body, null, 'crc32:' . crc32($body));
        }
        $this->api->sendError(404, 'not found: ' . $tableName);
    }

    /**
     * Replace the internal state with a new one.
     *
     * Can be used to reset a table or to revert to a save.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param int $sid State id / number, e.g. 2.
     * @param string $json New state JSON from client.
     */
    public function putStateLocked(
        string $tableName,
        string $sid,
        string $json
    ) {
        $this->assertStateNo($sid);
        $folder = $this->getTableFolder($tableName);
        $newState = $this->validateStateJson($sid, $json);

        $lock = $this->api->waitForWriteLock($folder . '.flock');
        $this->writeAsJsonAndDigest($folder, 'states/' . $sid . '.json', $newState);
        $this->api->unlockLock($lock);

        $this->api->sendReply(200, json_encode($newState));
    }

    /**
     * Add a new piece to a table.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $sid State id / number, e.g. 2.
     * @param string $json Full piece JSON from client.
     */
    public function createPiece(
        string $tableName,
        string $sid,
        string $json
    ) {
        $this->assertStateNo($sid);
        $piece = $this->validatePieceJson($json, true);
        $piece->id = $this->generateId();
        $this->updatePieceStateLocked($tableName, $sid, $piece, true);
        $this->api->sendReply(201, json_encode($piece));
    }

    /**
     * Get an individual piece.
     *
     * Not very performant, but also not needed very often ;)
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $sid State id / number, e.g. 2.
     * @param string $pieceId Id of piece.
     */
    public function getPiece(
        string $tableName,
        string $sid,
        string $pieceId
    ) {
        $this->assertStateNo($sid);
        $folder = $this->getTableFolder($tableName);

        if (is_file($folder . 'states/' . $sid . '.json')) {
            $state = json_decode($this->api->fileGetContentsLocked(
                $folder . 'states/' . $sid . '.json',
                $folder . '.flock'
            ));

            foreach ($state as $piece) {
                if ($piece->id === $pieceId) {
                    $this->api->sendReply(200, json_encode($piece));
                }
            }
        }

        $this->api->sendError(404, 'not found: piece ' . $pieceId . ' on table ' . $tableName . ' in state ' . $sid);
    }

    /**
     * Update a piece.
     *
     * Can overwrite the whole piece or only patch a few fields.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $sid State id / number, e.g. 2.
     * @param string $pieceID ID of the piece to update.
     * @param string $json Full or parcial piece JSON from client.
     */
    public function updatePiece(
        string $tableName,
        string $sid,
        string $pieceId,
        string $json
    ) {
        $this->assertStateNo($sid);
        $patch = $this->validatePieceJson($json, false);
        $patch->id = $pieceId; // overwrite with data from URL
        $updatedPiece = $this->updatePieceStateLocked($tableName, $sid, $patch, false);
        $this->api->sendReply(200, json_encode($updatedPiece));
    }

    /**
     * Update multiple pieces.
     *
     * Can overwrite a whole piece or only patch a few fields.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $sid State id / number, e.g. 2.
     * @param string $json Array of full or parcial pieces JSON from client.
     */
    public function updatePieces(
        string $tableName,
        string $sid,
        string $json
    ) {
        $this->assertStateNo($sid);

        // check if we got JSON array of valid piece-patches and IDs
        $patches = $this->api->assertJsonArray($json);
        $toPatch = [];
        foreach ($patches as $patch) {
            $piece = $this->validatePiece($patch, false);
            $this->api->assertHasProperties('piece', $patch, ['id']);
        }

        // looks good. do the update(s).
        foreach ($patches as $patch) {
            $updatedPiece = $this->updatePieceStateLocked($tableName, $sid, $patch, false);
        }

        $this->api->sendReply(200, json_encode($patches));
    }

    /**
     * Delete a piece from a table.
     *
     * Will not remove it from the library.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $sid State id / number, e.g. 2.
     * @param string $pieceID ID of the piece to delete.
     */
    public function deletePiece(
        string $tableName,
        string $sid,
        string $pieceId
    ) {
        $this->assertStateNo($sid);

        // create a dummy 'delete' object to represent deletion
        $piece = new \stdClass(); // sanitize item by recreating it
        $piece->layer = 'delete';
        $piece->id = $pieceId;

        $this->updatePieceStateLocked($tableName, $sid, $piece, false);
        $this->api->sendReply(204, '');
    }

    /**
     * Add a new asset to the library of a table.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $json Full asset JSON from client.
     */
    public function createAssetLocked(
        string $tableName,
        string $json
    ) {
        $asset = $this->validateAsset($json);

        // determine asset path elements
        $folder = $this->getTableFolder($tableName);
        $filename = $asset->name . '.' . $asset->w . 'x' . $asset->h . 'x1.' .
            str_replace('#', '', $asset->color) . '.' . $asset->format;

        // output file data
        $lock = $this->api->waitForWriteLock($folder . '.flock');
        file_put_contents($folder . 'assets/' . $asset->layer . '/' . $filename, base64_decode($asset->base64));

        // regenerate library json
        $table = json_decode(file_get_contents($folder . 'table.json'));
        $table->library = $this->generateLibraryJson($tableName);
        $this->writeAsJsonAndDigest($folder, 'table.json', $table);

        // return asset (without large blob)
        $this->api->unlockLock($lock);
        unset($asset->base64);
        $this->api->sendReply(201, json_encode($asset));
    }

    /**
     * Download a table's snapshot.
     *
     * Will zip the table folder and provide that zip.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     */
    public function getSnapshot(
        string $tableName
    ) {
        $folder = realpath($this->getTableFolder($tableName));

        // get all files to zip and sort them
        $toZip = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($folder),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );
        foreach ($iterator as $filename => $file) {
            if (!$file->isDir()) {
                $absolutePath = $file->getRealPath();
                $relativePath = substr($absolutePath, strlen($folder) + 1);
                switch ($relativePath) { // filter those files away
                    case '.flock':
                    case 'snapshot.zip':
                    case 'table.json':
                    case 'digest.json':
                        break; // they don't go into the zip
                    default:
                        $toZip[$relativePath] = $absolutePath; // keep all others
                }
            }
        }
        ksort($toZip);

        // now zip them
        $zipName = $folder . '/snapshot.zip';
        $zip = new \ZipArchive();
        $zip->open($zipName, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        foreach ($toZip as $relative => $absolute) {
            $zip->addFile($absolute, $relative);
        }
        $zip->close();

        // send and delete temporary file
        header('Content-disposition: attachment; filename=' . $tableName . '.' . date('Y-m-d-Hi') . '.zip');
        header('Content-type: application/zip');
        readfile($zipName);
        unlink($zipName);
        die();
    }

    /**
     * Generate an ID.
     *
     * Central function so we can change the type of ID easily later on.
     *
     * @return {String} A random ID.
     */
    private function generateId()
    {
        return JSONRestAPI::id();
    }
}
