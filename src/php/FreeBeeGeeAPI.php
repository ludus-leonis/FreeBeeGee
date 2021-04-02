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
    private $maxTableGridSize = 128;

    /**
     * Constructor - setup our routes.
     */
    public function __construct()
    {
        $this->api = new JSONRestAPI();

        // best ordered by calling frequency within each method to reduce string
        // matching overhead

        // --- HEAD ---

        $this->api->register('HEAD', '/tables/:tid/states/:sid/?', function ($fbg, $data) {
            if (is_dir($this->getTableFolder($data['tid']))) {
                $fbg->headState($data['tid'], $data['sid']);
            }
            $this->api->sendError(404, 'not found: ' . $data['tid']);
        });

        // --- GET ---

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

        $this->api->register('POST', '/tables/', function ($fbg, $data, $payload) {
            $formData = $this->api->multipartToJson();
            if ($formData) { // client sent us multipart
                $fbg->createTable($formData);
            } else { // client sent us regular json
                $fbg->createTable($payload);
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
                $fbg->putState($data['tid'], $data['sid'], $payload);
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
     */
    private function validateSnapshot(
        string $zipPath
    ) {
        $size = 0;
        $mandatory = [
            'LICENSE.md' => 'LICENSE.md',
            'states/1.json' => 'states/1.json',
            'template.json' => 'template.json',
        ];
        $optional = [
            'assets/' => 'assets/',
            'assets/tile/' => 'assets/tile/',
            'assets/token/' => 'assets/token/',
            'assets/overlay/' => 'assets/overlay/',
            'assets/other/' => 'assets/other/',
            'states/' => 'states/',
            'states/0.json' => 'states/0.json',
            'states/2.json' => 'states/2.json',
            'states/3.json' => 'states/3.json',
            'states/4.json' => 'states/4.json',
            'states/5.json' => 'states/5.json',
            'states/6.json' => 'states/6.json',
            'states/7.json' => 'states/7.json',
            'states/8.json' => 'states/8.json',
            'states/9.json' => 'states/9.json',
        ];
        $issues = [];
        $maxSize = $this->getServerConfig()->maxTableSizeMB;

        // basic tests
        if (filesize($zipPath) > $maxSize * 1024 * 1024) {
            // if the zip itself is too large, then so probably is its content
            $this->api->sendError(400, 'zip too large', 'SIZE_EXCEEDED', $issues);
        }

        // more detailed tests
        $zip = new \ZipArchive();
        if (!$zip->open($zipPath)) {
            return ['invalid zip'];
        }
        $assetCount = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entry = $zip->statIndex($i);

            // filename checks
            $entryName = $entry['name'];
            if (array_key_exists($entryName, $mandatory)) {
                unset($mandatory[$entryName]);
            } elseif (array_key_exists($entryName, $optional)) {
                // just ignore
            } else {
                if (preg_match('/^assets\/(overlay|tile|token|other)\/[a-zA-Z0-9_.-]*.(svg|png|jpg)$/', $entryName)) {
                    $assetCount++;
                } else {
                    $issues[] = 'unexpected ' . $entryName;
                }
            }
            // filesize checks
            $entrySize = $entry['size'];
            if ($entrySize > 1024 * 1024) {
                $issues[] = $entryName . ' exceeded 1024kB';
            }
            $size += $entrySize;
        }
        if ($assetCount <= 0) {
            $issues[] = 'no assets found in snapshot';
        }
        foreach ($mandatory as $missing) {
            $issues[] = 'missing ' . $missing;
        }
        if ($size > $maxSize * 1024 * 1024) {
            $issues[] = 'total size exceeded server maximum of ' . $maxSize . 'MB';
            $this->api->sendError(400, 'zip too large', 'SIZE_EXCEEDED', $issues);
        }

        // report any findings so far back
        if ($issues !== []) {
            $this->api->sendError(400, 'validating snapshot failed', 'ZIP_INVALID', $issues);
        }

        // at this point the zip is formally ok, but now we look into individual files
        $this->validateTemplateJson(file_get_contents('zip://' . $zipPath . '#template.json'));
        for ($i = 0; $i <= 9; $i++) {
            $json = @file_get_contents('zip://' . $zipPath . '#states/' . $i . '.json');
            if ($json !== false) {
                $this->validateStateJson($i, $json);
            }
        }
    }

    /**
     * Validate a template.json.
     *
     * Will termiante execution and send a 400 in case of invalid JSON.
     *
     * @param string $json JSON string.
     */
    private function validateTemplateJson(
        string $json
    ) {
        $msg = 'validating template.json failed';
        $template = json_decode($json);

        // check the basics and abort on error
        if ($template === null) {
            $this->api->sendError(400, $msg, 'TEMPLATE_JSON_INVALID');
        }
        if (!property_exists($template, 'engine') || !$this->api->semverSatisfies($this->engine, $template->engine)) {
            $this->api->sendError(400, $msg, 'TEMPLATE_JSON_INVALID_ENGINE', [$template->engine, $this->engine]);
        }

        // check for more stuff
        $this->api->assertHasProperties(
            'template.json',
            $template,
            ['type', 'gridSize', 'snapSize', 'version', 'engine', 'gridWidth', 'gridHeight', 'colors']
        );
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
        $msg = 'validating template.json failed';
        $state = json_decode($json);
        $validated = [];

        // check the basics and abort on error
        if ($state === null) {
            $this->api->sendError(400, $msg, 'STATE_JSON_INVALID');
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
     * on errors.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param string $zipPath Path to snapshot/template zip to install.
     * @return array The library Json for this template.
     */
    private function installSnapshot(
        string $tableName,
        string $zipPath
    ): array {
        $zip = new \ZipArchive();
        if ($zip->open($zipPath) === true) {
            $zip->extractTo($this->getTableFolder($tableName));
            $zip->close();
            return $this->generateLibraryJson($tableName);
        } else {
            $this->api->sendError(500, 'can\'t setup template ' . $zipPath);
        }
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
    private function updatePieceState(
        string $tableName,
        string $sid,
        object $piece,
        bool $create
    ): object {
        $folder = $this->getTableFolder($tableName);
        $lock = $this->api->waitForWriteLock($folder . '.flock');

        $oldState = '[]';
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
                        if ($piece->layer === 'delete') {
                            continue;
                        }
                        $stateItem = $this->merge($stateItem, $piece);
                        $result = $stateItem;
                    }
                    $newState[] = $stateItem;
                    $ids[] = $stateItem->id;
                }
            }
            if (!in_array($piece->id, $ids) && $piece->layer !== 'delete') {
                $this->api->unlockLock($lock);
                $this->api->sendError(404, 'not found: ' . $piece->id);
            }
        }
        $this->writeAsJsonAndDigest($folder . 'states/' . $sid . '.json', $newState);
        $this->api->unlockLock($lock);

        return $result;
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
        if (
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.([a-fA-F0-9]{6})\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            // group.name.1x2x3.808080.png
            $asset->width = (int)$matches[2];
            $asset->height = (int)$matches[3];
            $asset->side = $matches[4];
            $asset->color = $matches[5];
            $asset->alias = $matches[1];
        } elseif (
            preg_match(
                '/^(.*)\.([0-9]+)x([0-9]+)x([0-9]+|X+)\.[a-zA-Z0-9]+$/',
                $filename,
                $matches
            )
        ) {
            // group.name.1x2x3.png
            $asset->width = (int)$matches[2];
            $asset->height = (int)$matches[3];
            $asset->side = $matches[4];
            $asset->color = '808080';
            $asset->alias = $matches[1];
        } elseif (preg_match('/^(.*)\.[a-zA-Z0-9]+$/', $filename, $matches)) {
            // group.name.png
            $asset->width = 1;
            $asset->height = 1;
            $asset->side = 1;
            $asset->color = '808080';
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
        foreach (['overlay', 'tile', 'token', 'other'] as $type) {
            $assets[$type] = [];
            $lastAsset = null;
            foreach (glob($tableFolder . 'assets/' . $type . '/' . '*') as $filename) {
                $asset = $this->fileToAsset(basename($filename));
                $asset->type = $type;

                // this ID only has to be unique within the table, but should be reproducable
                // therefore we use a fast hash and even only use parts of it
                $idBase = $type . '/' . $asset->alias . '.' . $asset->width . 'x' . $asset->height . 'x' . $asset->side;
                $asset->id = substr(hash('md5', $idBase), -16);

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
                array_push($assets[$type], $lastAsset);
            }
        }

        return $assets;
    }

    /**
     * Write a data object as JSON to a file and generate a digest.
     *
     * Digest will be in filename.digest. Does not do locking.
     *
     * @param $filename Path to file to write.
     * @param $object PHP object to write.
     */
    private function writeAsJsonAndDigest(
        $filename,
        $object
    ) {
        $data = json_encode($object);
        file_put_contents($filename, $data);
        file_put_contents($filename . '.digest', 'crc32:' . crc32($data));
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
                    $validated->layer = $this->api->assertEnum('layer', $value, ['tile', 'token', 'overlay', 'other']);
                    break;
                case 'asset':
                    $validated->asset = $this->api->assertString('asset', $value, '[a-z0-9]+');
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
                case 'border':
                    $validated->border = $this->api->assertInteger('border', $value, 0, 7);
                    break;
                case 'no':
                    $validated->no = $this->api->assertInteger('no', $value, 0, 15);
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
            $this->api->assertHasProperties(
                'piece',
                $validated,
                ['layer', 'asset', 'width', 'height', 'x', 'y', 'z', 'side', 'border'] // no
            );
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
    public function createTable(
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
            $validated->template && $validated->_files
            || (!$validated->template && !$validated->_files )
        ) {
            $this->api->sendError(400, 'you need to either specify a template or upload a snapshot');
        }
        if ($validated->_files && !$server->snapshotUploads) {
            $this->api->sendError(400, 'snapshot upload is not enabled on this server');
        }

        // check if upload (if any) was ok
        if ($validated->_files) {
            if ($_FILES[$validated->_files[0]]['error'] > 0) {
                $this->api->sendError(400, 'PHP upload failed', JSONRestAPI::UPLOAD_ERR[
                    $_FILES[$validated->_files[0]]['error']
                ]);
            }
        }

        // doublecheck template / snapshot
        $zipPath = ($validated->_files ?? null)
            ? ($_FILES[$validated->_files[0]]['tmp_name'] ?? 'invalid')
            : ($this->api->getDataDir() . 'templates/' . $validated->template . '.zip');
        if (!is_file($zipPath)) {
            $this->api->sendError(400, 'template not available');
        }
        $this->validateSnapshot($zipPath);

        // create a new table
        $newTable = new \stdClass();
        $newTable->id = $this->generateId();
        $newTable->name = $validated->name;
        $newTable->engine = $this->engine;
        $newTable->tables = [new \stdClass()];

        $table = $newTable->tables[0];
        $table->name = 'Main';
        $table->background = new \stdClass();
        $table->background->color = '#423e3d';
        $table->background->scroller = '#2b2929';
        $table->background->image = 'img/desktop-wood.jpg';

        $folder = $this->getTableFolder($newTable->name);
        if (!is_dir($folder)) {
            if (!mkdir($folder, 0777, true)) {
                $this->api->sendError(500, 'can\'t write on server');
            }

            $lock = $this->api->waitForWriteLock($folder . '.flock');
            $table->library = $this->installSnapshot($newTable->name, $zipPath);

            // keep original state for table resets, if game does not have a 0-state
            if (!is_file($folder . 'states/0.json')) {
                $state = file_get_contents($folder . 'states/1.json');
                file_put_contents($folder . 'states/0.json', $state);
            }

            // generate digests
            for ($i = 0; $i <= 9; $i++) {
                if (is_file($folder . 'states/' . $i . '.json')) {
                    $state = file_get_contents($folder . 'states/' . $i . '.json');
                    $statecrc = crc32($state);
                    file_put_contents($folder . 'states/' . $i . '.json.digest', 'crc32:' . $statecrc);
                }
            }

            // add invalid.svg to table | @codingStandardsIgnoreLine
            file_put_contents($folder . 'invalid.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.4 25.4" height="96" width="96"><path fill="#40bfbf" d="M0 0h25.4v25.4H0z"/><g fill="#fff" stroke="#fff" stroke-width="1.27" stroke-linecap="round" stroke-linejoin="round"><path d="M1.9 1.9l21.6 21.6M23.5 1.9L1.9 23.5" stroke-width="1.1"/></g></svg>');

            // add/overrule some template.json infos into the table.json
            $table->template = json_decode(file_get_contents($folder . 'template.json'));
            if (is_file($folder . 'LICENSE.md')) {
                $table->credits = file_get_contents($folder . 'LICENSE.md');
            } else {
                $table->credits = 'Your template does not provide license information.';
            }
            $table->width = $table->template->gridWidth * $table->template->gridSize; // specific for 'grid-square'
            $table->height = $table->template->gridHeight * $table->template->gridSize; // specific for 'grid-square'

            $this->writeAsJsonAndDigest($folder . 'table.json', $newTable);
            $this->api->unlockLock($lock);

            $this->api->sendReply(201, json_encode($newTable), '/api/tables/' . $newTable->name);
        }
        $this->api->sendReply(409, json_encode($newTable));
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
            $this->api->sendReply(200, $this->api->fileGetContentsLocked(
                $folder . 'table.json',
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
     * Get the head of a state of a table.
     *
     * Returns a Digest HTTP header so the client can check if it's worth to
     * download the rest.
     *
     * @param string $tableName Name of the table, e.g. 'darkEscapingQuelea'
     * @param int $sid State id / number, e.g. 2.
     */
    public function headState(
        string $tableName,
        string $sid
    ) {
        $this->assertStateNo($sid);
        $folder = $this->getTableFolder($tableName);
        if (is_dir($folder)) {
            $digest = 'crc32:0';
            if (is_file($folder . 'states/' . $sid . '.json.digest')) {
                $digest = $this->api->fileGetContentsLocked(
                    $folder . 'states/' . $sid . '.json.digest',
                    $folder . '.flock'
                );
            }
            $this->api->sendReply(200, null, null, $digest);
        }
        $this->api->sendError(404, 'not found: ' . $tableName);
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
    public function putState(
        string $tableName,
        string $sid,
        string $json
    ) {
        $this->assertStateNo($sid);
        $folder = $this->getTableFolder($tableName);
        $newState = $this->validateStateJson($sid, $json);

        $lock = $this->api->waitForWriteLock($folder . '.flock');
        $this->writeAsJsonAndDigest($folder . 'states/' . $sid . '.json', $newState);
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
        $this->updatePieceState($tableName, $sid, $piece, true);
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
        $updatedPiece = $this->updatePieceState($tableName, $sid, $patch, false);
        $this->api->sendReply(200, json_encode($updatedPiece));
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

        $this->updatePieceState($tableName, $sid, $piece, false);
        $this->api->sendReply(204, '');
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
        $tableFolder = realpath($this->getTableFolder($tableName));

        // get all files to zip and sort them
        $toZip = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($tableFolder),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );
        foreach ($iterator as $filename => $file) {
            if (!$file->isDir()) {
                $absolutePath = $file->getRealPath();
                $relativePath = substr($absolutePath, strlen($tableFolder) + 1);
                switch ($relativePath) { // filter those files away
                    case '.flock':
                    case 'snapshot.zip':
                    case 'invalid.svg':
                    case 'table.json':
                        break; // they don't go into the zip
                    default:
                        if (! preg_match('/\.digest$/', $relativePath)) {
                            $toZip[$relativePath] = $absolutePath; // keep all others except digests
                        }
                }
            }
        }
        ksort($toZip);

        // now zip them
        $zipName = $tableFolder . '/snapshot.zip';
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
