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
 * JSONRestAPI - generic parts of a JSON/Rest API.
 *
 * Covers HTTP request routing and provides a few JSON payload helpers.
 */
class JSONRestAPI
{
    private $apiDirFS = null; // e.g. /var/www/www.mysite.com/api/
    private $apiRoot = null;  // URL-parent-folder of the API, e.g. /api
    private $routes = [ // all registered routes
        'GET' => [],
        'PUT' => [],
        'POST' => [],
        'DELETE' => [],
        'PATCH' => [],

        'CONNECT' => [],
        'HEAD' => [],
        'OPTIONS' => [],
        'TRACE' => [],
    ];

    /**
     * Constructor.
     */
    public function __construct()
    {
        // autodetect our FS dir and our (sub)directory in the URL/path
        $scriptDir = dirname(__FILE__);
        $this->apiDirFS = $scriptDir . '/';
        $this->apiRoot = substr($scriptDir, strlen($_SERVER['DOCUMENT_ROOT']));
    }

    /**
     * Get directory for API data.
     *
     * Might be used by derived classes to store API data (e.g. JSON). This is
     * the same directory this php file is in.
     *
     * @return string FS path to data dir, e.g. '/var/www/www.mysite.com/api/'
     */
    public function getDataDir(): string
    {
        $dir = $this->apiDirFS . 'data/';
        if (!is_dir($dir)) { // create dir on the fly
            if (!mkdir($dir, 0777, true)) {
                $this->api->sendError(500, 'can\'t create API data dir');
            }
        }
        return $dir;
    }

    // --- routing helpers -----------------------------------------------------

    /**
     * Register a route.
     *
     * Registered routes are available to route() calls later on.
     *
     * @param string $method An HTTP method.
     * @param string $route The route / path, e.g. '/users/:id/name'.
     * @param callable $handler The function to call when the route is hit.
     */
    public function register(
        string $method,
        string $route,
        callable $handler
    ): void {
        $this->routes[$method][$route] = $handler;
    }

    /**
     * Convert a route to a RegExp for easy checking.
     *
     * Will convert ':id' parts into named RegExp groups.
     *
     * @param string $route A route, e.g. '/users/:id/name'.
     * @return string RegExp, e.g. '/\/users\/(?'id'[^\/]+)/name'
     */
    private function routeToRegExp(
        string $route
    ): string {
        // replace backlashes
        $route = preg_replace('/\//', '\\/', $route);

        // replace group detection
        $route = preg_replace('/\/:([a-zA-Z]+)/', "/(?'$1'[^\/]+)", $route);

        // complete the regexp
        return '/^' . $route . '$/';
    }

    /**
     * Run the router.
     *
     * Requires prior registration of routes. Will call the first route that
     * matches the HTTP method and path (as of $_SERVER) or return a 404/405
     * error if no route exists.
     *
     * This method is not supposed to finish. Either a proper route should return
     * something to the client & exit, or route() will do that by sending an error.
     *
     * @param object $instance Instance to forward to the route.
     */
    public function route(
        object $instance
    ): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->sanitizePath(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

        // find a matching route
        foreach ($this->routes[$method] as $route => $handler) {
            if (preg_match($this->routeToRegExp($route), $path, $matches)) {
                if ($method === 'PATCH' || $method === 'PUT' || $method === 'POST') {
                    $handler($instance, $matches, file_get_contents('php://input'));
                } else {
                    $handler($instance, $matches); // don't parse incoming data on GET/DELETE
                }
                $this->sendError(500, 'oops, route failed'); // handler did not return anything
            }
        }

        // no route? too bad!
        switch ($method) {
            case 'GET':
                $this->sendError(404, 'not found: ' . $path);
                break;
            default:
                $this->sendError(405, 'method not allowed: ' . $path);
        }
    }

    // --- request helpers -----------------------------------------------------

    /**
     * Remove 'bad' stuff from a path so no one can break out of the docroot.
     *
     * @param string $path Path to sanitize.
     * @return string A path with invalid characters and '..' tricks, as well as
     *                the scriptfolder removed.
     */
    public function sanitizePath(
        string $path
    ): string {
        $path = urldecode($path);
        $path = preg_replace('/[^\w\s\d\-_~,;\/\[\]\(\)\.]/u', '', $path); // only whitelisted chars
        $path = preg_replace('/\.\.+/', '.', $path); // no '..'
        $path = preg_replace('/\/+/', '/', $path);   // reduce multiple slashes to one

        // remove (sub)dir name of php script
        return substr($path, strlen($this->apiRoot));
    }

    /**
     * Check/convert String JSON field against an array of values.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param string[] $values Possible values as array.
     * @return mixed The matching item from the array.
     */
    public function assertEnum(
        string $field,
        $value,
        array $values
    ) {
        if ($value !== null) {
            if (in_array($value, $values)) {
                return $value;
            }
        }
        $this->sendError(400, 'invalid JSON: ' . $field . ' invalid');
    }

    /**
     * Check/convert String JSON field against a RegExp.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param string $pattern RegExp to check against. Excluding '/^' and '$/'.
     * @return string The parsed value.
     */
    public function assertString(
        string $field,
        $value,
        string $pattern
    ) {
        if ($value !== null) {
            if (preg_match('/^' . $pattern . '$/', $value)) {
                return $value;
            }
        }
        $this->sendError(400, 'invalid JSON: ' . $field . ' does not match ' . $pattern);
    }

    /**
     * Check/convert array-of-strings JSON field against a RegExp.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $values The value(s) to check.
     * @param string $pattern RegExp to check against. Excluding '/^' and '$/'.
     * @return array The parsed strings as array.
     */
    public function assertStringArray(
        string $field,
        $values,
        string $pattern
    ) {
        if ($values !== null && gettype($values) === 'array') {
            $array = [];
            foreach ($values as $value) {
                if (preg_match('/^' . $pattern . '$/', $value)) {
                    array_push($array, $value);
                }
            }
            if (sizeof($array) === sizeof($values)) {
                return $array;
            }
        }
        $this->sendError(400, 'invalid JSON: ' . $field . ' does not match ' . $pattern);
    }

    /**
     * Check/convert Integer JSON field.
     *
     * Accepts any datatype that can be cast properly to an Integer. Will
     * check for min/max value.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param int $min Minimum value. Defaults to 1.
     * @param int $max Maximum value. Defaults to 256.
     * @return int The parsed value.
     */
    public function assertInteger(
        string $field,
        $value,
        int $min = 1,
        int $max = 256
    ): int {
        if ($value !== null) {
            $i = (int) $value;
            if ($i >= $min && $i <= $max) {
                return $i;
            }
        }
        $this->sendError(400, 'invalid JSON: ' . $field . ' not between ' . $min . ' and ' . $max);
    }

    // --- payload helpers -----------------------------------------------------

    /**
     * Assert that user-data is in JSON format.
     *
     * To be used on JSON provided by the client to check for syntax errors. Will
     * send an 400-error to the client and terminate further execution if invalid.
     *
     * @param string $data User-provided data/string.
     * @return object Parsed JSON data if successfull.
     */
    public function assertJson(
        ?string $data
    ): object {
        $decoded = json_decode($data);
        if ($decoded === null) {
            $this->sendError(400, 'invalid JSON');
        }
        return $decoded;
    }

    /**
     * Send an JSON error to the client.
     *
     * Will wrap the error in a simple JSON error object:
     *
     * '{ "error": "<message>" }'
     *
     * Will also terminate execution after sending.
     *
     * @param int $cod Statuscode to send. Defaults to 200.
     * @param string $message An error message.
     * @return void
     */
    public function sendError(
        int $code,
        string $message
    ): void {
        $this->sendReply($code, '{"_errors":["' . $message . '"]}');
    }

    /**
     * Send a HTTP reply to the client.
     *
     * Will terminate execution after sending.
     *
     * @param int $cod Statuscode to send. Defaults to 200.
     * @param string $body Response body. Defaults to ''.
     * @param string $location Optional URL for a 'Location:' header.
     * @return void
     */
    public function sendReply(
        int $code = 200,
        ?string $body = '',
        string $location = null,
        string $digest = null
    ): void {
        http_response_code($code);
        if ($location) {
            header('Location: ' . $location);
        }
        if ($digest) {
            header('Digest: ' . $digest);
        }
        if ($body !== null) {
            echo $body;
        }
        die;
    }

    // --- file locking --------------------------------------------------------

    // Locking functions are not needed by JSONRestAPI. They are provided for
    // convenience, as classes deriving from JSONRestAPI often want to lock
    // stuff.

    /**
     * Obain an exclusive file lock for writing.
     *
     * If no LOCK_EX lock can be obtained, a JSON error is sent to the client.
     *
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     */
    public function waitForWriteLock(
        ?string $lockFile
    ) {
        $lockFile = $lockFile ?? $this->getDataDir() . '.flock';

        $lock = fopen($lockFile, 'w');
        if (flock($lock, LOCK_EX)) {  // acquire an exclusive lock
            return $lock;
        } else {
            $this->sendError(423, 'can\'t lock ' + $lockFile + ' for writing');
        }
    }

    /**
     * Obain a shared file lock for reading.
     *
     * If no LOCK_SH lock can be obtained, a JSON error is sent to the client.
     *
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     */
    public function waitForReadLock(
        ?string $lockFile
    ) {
        $lockFile = $lockFile ?? $this->getDataDir() . '.flock';

        $lock = fopen($lockFile, 'w');
        if (flock($lock, LOCK_SH)) {  // acquire a shared lock
            return $lock;
        } else {
            $this->api->sendError(423, 'can\'t lock ' + $lockFile + ' for reading');
        }
    }

    /**
     * Unlock a lock obtained by waitForReadLock() or waitForWriteLock().
     *
     * @param $lock The lock to release.
     */
    public function unlockLock(
        $lock
    ) {
        flock($lock, LOCK_UN);
    }

    /**
     * Read a file using a shared lock.
     *
     * Calls waitForReadLock - see there for more infos.
     *
     * @param string $path Path to file to read.
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     * @return string The file's content.
     */
    public function fileGetContentsLocked(
        string $path,
        ?string $lockFile
    ): string {
        $lock = $this->waitForReadLock($lockFile);
        $content = file_get_contents($path);
        $this->unlockLock($lock);
        return $content;
    }

    /**
     * (Over)Write a file using an exclusive lock.
     *
     * Calls waitForWriteLock - see there for more infos.
     *
     * @param string $path Path to file to write.
     * @param string $content Content to write into file (replaces old content).
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     * @return string The file's content.
     */
    public function filePutContentsLocked(
        string $path,
        string $content,
        ?string $lockFile
    ) {
        $lock = $this->waitForReadLock($lockFile);
        file_put_contents($path, $content);
        $this->unlockLock($lock);
    }

    // --- other helpers -------------------------------------------------------

    // Again, not needed by JSONRestAPI, but very handy in derived classes.

    /**
     * Create a v4 UUID.
     *
     * @param string $seed Optional seed for randomness in UUID.
     * @return string A UUID, e.g. '8b8deba5-640b-4388-a2cc-3a4c56af9fb8'.
     */
    public static function uuid(
        string $seed = null
    ): string {
        $data = $seed ?? random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Create a random ID.
     *
     * @param string $seed Optional seed for randomness.
     * @return string 16-digit hex string, e.g. 'a2cc3a4c56af9fb8'.
     */
    public static function id(
        string $seed = null
    ): string {
        $data = $seed ?? random_bytes(8);
        return bin2hex($data);
    }

    /**
     * Delete a directory recursively.
     *
     * As sanity precaution it will only operate on directories blow the API.
     * Will silently fail if the dir is relative our outside the API dir.
     *
     * @param string $path Absolute path to directory.
     */
    public function deleteDir(
        string $path
    ) {
        $dataDir = $this->getDataDir();
        if (substr($path . '/', 0, strlen($dataDir)) === $dataDir) { // sanity check
            if (is_dir($path)) {
                foreach (scandir($path) as $file) {
                    if (is_dir($path . '/' . $file)) {
                        if ($file !== '.' && $file !== '..') {
                            self::deleteDir($path . '/' . $file);
                        }
                    } else {
                        unlink($path . '/' . $file);
                    }
                }
                rmdir($path);
            }
        }
    }
}
